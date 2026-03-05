"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatMs, formatPercent } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  converged?: boolean;
  iterations?: number;
  processingMs?: number;
  mirrorAgreement?: number;
  loading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Hello. I am OMEGA — TextNet is online. The gX-Li-Ω engine is ready. Ask me anything.",
      confidence: 1,
      converged: true,
      iterations: 1,
    },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const thinkingId = `t_${Date.now()}`;
    const thinkingMsg: Message = { id: thinkingId, role: "assistant", content: "", loading: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", input: text }),
      });
      const data = await res.json();

      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingId
            ? {
                ...m,
                loading: false,
                content: data.answer ?? "No response.",
                confidence: data.confidence,
                converged: data.converged,
                iterations: data.iterations,
                processingMs: data.processingMs,
                mirrorAgreement: data.mirrorAgreement,
              }
            : m,
        ),
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingId
            ? { ...m, loading: false, content: "Error connecting to AI engine." }
            : m,
        ),
      );
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 gap-3">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
        <span className="font-medium text-sm">TextNet</span>
        <span className="text-text-muted text-xs">gX · Li · Ω</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "user" ? (
                <div className="max-w-xl bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-xl space-y-2">
                  <div className="omega-card px-4 py-3 text-sm">
                    {msg.loading ? (
                      <div className="flex items-center gap-2 text-text-muted">
                        <div className="omega-spinner" />
                        <span>Ω processing…</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {!msg.loading && msg.confidence !== undefined && (
                    <div className="flex items-center gap-3 px-1 text-xs text-text-muted font-mono">
                      <span className={cn(msg.converged ? "text-success" : "text-warning")}>
                        {msg.converged ? "✓ converged" : "~ partial"}
                      </span>
                      <span>conf {formatPercent(msg.confidence)}</span>
                      <span>agree {formatPercent(msg.mirrorAgreement ?? 0)}</span>
                      <span>iter {msg.iterations}</span>
                      {msg.processingMs && <span>{formatMs(msg.processingMs)}</span>}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask OMEGA anything…"
            className="omega-input flex-1"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{loading ? "…" : "Send"}</span>
          </button>
        </div>
        <p className="text-center text-text-muted text-xs mt-2 font-mono">
          <Zap className="inline w-3 h-3 mr-1" />TextNet · gX neurons · Li centers · Ω truth
        </p>
      </div>
    </div>
  );
}
