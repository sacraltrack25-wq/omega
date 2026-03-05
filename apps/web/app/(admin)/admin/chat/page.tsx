"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Zap, RotateCcw, Network, Cpu, CheckCircle, Circle, Brain, Database } from "lucide-react";
import { cn, formatMs, formatPercent } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface KnowledgeMatch {
  key: string;
  score: number;
  resonanceScore: number;   // gX fingerprint similarity [0..1]
  source: string;
  raw?: string;
  liId: string;
}

interface OmegaTruth {
  answer: string;
  confidence: number;
  converged: boolean;
  iterations: number;
  processingMs: number;
  mirrorAgreement: number;
  participatingLi: string[];
  knowledgeRecall: KnowledgeMatch[];
  recallUsed: boolean;
  networkType: string;
}

type ThinkStep = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  icon: React.ElementType;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  truth?: OmegaTruth;
  steps?: ThinkStep[];
  loading?: boolean;
  error?: boolean;
}

// ── Think steps builder ────────────────────────────────────────────────────────

function buildSteps(truth: OmegaTruth): ThinkStep[] {
  return [
    {
      id: "encode",
      label: "gX encode",
      detail: `запрос → 128-dim вектор`,
      done: true,
      icon: Network,
    },
    {
      id: "li",
      label: "Li1 ↔ Li2",
      detail: `mirror agreement: ${(truth.mirrorAgreement * 100).toFixed(0)}% | ${truth.participatingLi.length} Li центров`,
      done: true,
      icon: Cpu,
    },
    {
      id: "omega",
      label: "Ω converge",
      detail: `${truth.iterations} ${truth.iterations === 1 ? "итерация" : "итерации"} | ${truth.converged ? "сошлось" : "не сошлось"}`,
      done: true,
      icon: Zap,
    },
    {
      id: "recall",
      label: "Knowledge recall",
      detail: truth.knowledgeRecall.length > 0
        ? `${truth.knowledgeRecall.length} совпадений | gX резонанс: ${((truth.knowledgeRecall[0]?.resonanceScore ?? truth.knowledgeRecall[0]?.score ?? 0) * 100).toFixed(0)}%`
        : "Knowledge Map пуст — нужно обучение",
      done: true,
      icon: Database,
    },
  ];
}

// ── Components ─────────────────────────────────────────────────────────────────

function ThinkingSteps({ steps }: { steps: ThinkStep[] }) {
  return (
    <div className="space-y-1 py-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-start gap-2 text-xs">
            <span className="text-text-muted w-4 text-right flex-shrink-0 pt-0.5">
              {i + 1}
            </span>
            <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
            <span className="text-text-secondary font-mono font-semibold w-28 flex-shrink-0">
              {step.label}
            </span>
            <span className="text-text-muted">{step.detail}</span>
            {step.done
              ? <CheckCircle className="w-3 h-3 text-success ml-auto flex-shrink-0 mt-0.5" />
              : <Circle className="w-3 h-3 text-text-muted ml-auto flex-shrink-0 mt-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

function ThinkingLoader() {
  return (
    <div className="space-y-1 py-2">
      {["gX encode", "Li1 ↔ Li2", "Ω converge", "Knowledge recall"].map((label, i) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="text-text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
          <div className="w-3.5 h-3.5 rounded-full border border-accent/40 animate-pulse flex-shrink-0" />
          <span className="text-text-muted font-mono">{label}</span>
          <div className="h-1.5 bg-bg-elevated rounded flex-1 overflow-hidden ml-2">
            <div
              className="h-full bg-accent/30 animate-pulse rounded"
              style={{ width: `${30 + i * 20}%`, animationDelay: `${i * 150}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecallPanel({ matches }: { matches: KnowledgeMatch[] }) {
  const [expanded, setExpanded] = useState(false);
  if (matches.length === 0) return null;

  return (
    <div className="mt-2 border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:bg-bg-hover transition-colors text-left"
      >
        <Database className="w-3 h-3 text-info" />
        <span className="font-mono">{matches.length} совпадений из Knowledge Map</span>
        <span className="ml-auto">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          {matches.slice(0, 3).map((m, i) => (
            <div key={m.key} className="px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-mono">#{i + 1}</span>
                {/* gX Resonance bar */}
                <div className="flex-1 h-1 bg-bg-elevated rounded overflow-hidden">
                  <div
                    className="h-full bg-success/60 rounded"
                    style={{ width: `${Math.min(100, (m.resonanceScore ?? m.score) * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-success" title="gX resonance">
                  gX {((m.resonanceScore ?? m.score) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-text-muted truncate">{m.source}</p>
              {m.raw && (
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{m.raw}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageMeta({ truth }: { truth: OmegaTruth }) {
  return (
    <div className="mt-2 space-y-1">
      {/* Metrics row */}
      <div className="flex flex-wrap gap-3 text-xs text-text-muted font-mono">
        <span className={cn(truth.confidence > 0.6 ? "text-success" : truth.confidence > 0.3 ? "text-warning" : "text-danger")}>
          confidence {formatPercent(truth.confidence)}
        </span>
        <span>mirror {(truth.mirrorAgreement * 100).toFixed(0)}%</span>
        <span>{truth.iterations} iter</span>
        <span>{formatMs(truth.processingMs)}</span>
        {truth.recallUsed && (
          <span className="text-success">✓ recall</span>
        )}
        {truth.converged
          ? <span className="text-success">✓ converged</span>
          : <span className="text-warning">~ partial</span>}
      </div>

      {/* Participating Li */}
      {truth.participatingLi.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {truth.participatingLi.map(li => (
            <span key={li} className="text-xs font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted">
              {li.split("_").slice(-2).join("_")}
            </span>
          ))}
        </div>
      )}

      <RecallPanel matches={truth.knowledgeRecall} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const INTRO: Message = {
  id: "intro",
  role: "assistant",
  content: "Привет. Я OMEGA TextNet — уникальный ИИ на зеркальном принципе gX·Li·Ω.\n\ngX — нейрон мозга (1 бит, зеркальная пара).\nLi — очаг обработки (зеркальные Li1↔Li2, растут с данными).\nΩ — центр истины (сходится к ответу через само-зеркалирование).\n\nЗадай вопрос. Если Li-центры обучены — отвечу знанием из базы памяти. Если нет — скажу честно и подскажу как обучить.",
  steps: undefined,
  truth: undefined,
};

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [multimodal, setMultimodal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const thinkingId = (Date.now() + 1).toString();
    const thinkingMsg: Message = { id: thinkingId, role: "assistant", content: "", loading: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", input: text, multimodal }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const truth = await res.json() as OmegaTruth;
      const steps = buildSteps(truth);

      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? {
              ...m,
              loading: false,
              content: truth.answer,
              truth,
              steps,
            }
          : m,
      ));
    } catch (err: unknown) {
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, loading: false, content: `Ошибка: ${String(err)}`, error: true }
          : m,
      ));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const clear = () => {
    setMessages([INTRO]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-border bg-bg-secondary">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          <span className="font-semibold text-sm">Ω TextNet Chat</span>
          <span className="text-xs text-text-muted font-mono ml-2">gX · Li · Ω</span>
        </div>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          очистить
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-accent text-xs font-bold">Ω</span>
              </div>
            )}

            <div className={cn(
              "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "user"
                ? "bg-accent text-white rounded-tr-sm"
                : "bg-bg-secondary border border-border rounded-tl-sm",
              msg.error && "border-danger/30 bg-danger/5",
            )}>
              {/* Loading state */}
              {msg.loading ? (
                <div>
                  <p className="text-xs text-text-muted font-mono mb-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="ml-1">думаю...</span>
                  </p>
                  <ThinkingLoader />
                </div>
              ) : (
                <>
                  {/* Steps (completed) */}
                  {msg.steps && msg.role === "assistant" && (
                    <div className="mb-2 pb-2 border-b border-border/50">
                      <ThinkingSteps steps={msg.steps} />
                    </div>
                  )}

                  {/* Answer */}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Metadata */}
                  {msg.truth && <MessageMeta truth={msg.truth} />}
                </>
              )}
            </div>

            {/* User avatar */}
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-text-muted text-xs">👤</span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-bg-secondary px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Задай вопрос OMEGA TextNet... (Enter — отправить, Shift+Enter — новая строка)"
            rows={1}
            disabled={loading}
            className={cn(
              "flex-1 resize-none bg-bg-primary border border-border rounded-xl px-4 py-2.5",
              "text-sm text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40",
              "disabled:opacity-50 transition-colors",
              "max-h-40 overflow-y-auto",
            )}
            style={{ minHeight: "42px" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
            }}
          />
          <button
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-accent text-white transition-all",
              "hover:bg-accent/80 active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Multimodal + Hint */}
        <div className="flex items-center gap-4 mt-1.5">
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={multimodal}
              onChange={e => setMultimodal(e.target.checked)}
              className="rounded accent-accent"
            />
            Multimodal (text+image+video+audio)
          </label>
          <span className="text-xs text-text-muted font-mono">
            Li-центры пусты → <code className="text-accent">python train_textnet.py --level 1</code>
          </span>
        </div>
      </div>
    </div>
  );
}
