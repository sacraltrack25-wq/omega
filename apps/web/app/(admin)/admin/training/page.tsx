"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dumbbell, Play, Settings, Loader2, Zap, Database, Plus, Trash2, ClipboardList } from "lucide-react";
import { PARAM_META } from "@omega/core";

export interface TrainingSource {
  name: string;
  type: string;
  column?: string;
  text_from?: string | string[];
  limit?: number;
  streaming?: boolean;
  config?: string;
  split?: string;
}

const DURATION_OPTIONS = [
  { value: 0, label: "Без лимита" },
  { value: 1, label: "1 час" },
  { value: 6, label: "6 часов" },
  { value: 24, label: "24 часа" },
  { value: 168, label: "7 дней" },
];

const GROUPS = Array.from(new Set(PARAM_META.map(p => p.group)));

const PRESETS = [
  { id: "fast", label: "Быстрый", level: 1, desc: "Wikipedia only, quick start", params: { LEARNING_RATE: 0.001, BATCH_SIZE: 16, CONTEXT_WINDOW: 2048 } },
  { id: "standard", label: "Стандарт", level: 2, desc: "Wikipedia + quality sites", params: { LEARNING_RATE: 0.001, BATCH_SIZE: 32, CONTEXT_WINDOW: 4096 } },
  { id: "full", label: "Полный", level: 3, desc: "All levels + AI research", params: { LEARNING_RATE: 0.0005, BATCH_SIZE: 64, CONTEXT_WINDOW: 8192 } },
];

const LEVELS = [
  { level: 1, label: "Level 1", desc: "Wikipedia (EN + RU)", detail: "Structured facts, best for initial training" },
  { level: 2, label: "Level 2", desc: "Wikipedia + quality sites", detail: "News, blogs, diverse content" },
  { level: 3, label: "Level 3", desc: "All + AI research sites", detail: "Papers, arXiv, specialized sources" },
];

export default function TrainingPage() {
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(PARAM_META.map(p => [p.key, p.min])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [training, setTraining] = useState(false);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const [hfForm, setHfForm] = useState({ dataset: "", column: "text", limit: 1000, streaming: true });
  const [planSources, setPlanSources] = useState<TrainingSource[]>([
    { name: "squad", type: "huggingface", text_from: ["context", "question"], limit: 5000, streaming: true },
    { name: "HuggingFaceFW/fineweb", type: "huggingface", column: "text", limit: 10000, streaming: true },
  ]);
  const [planDuration, setPlanDuration] = useState(0);

  useEffect(() => {
    fetch("/api/admin/params")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data === "object") {
          setParams(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key: string, val: number) {
    setParams(prev => ({ ...prev, [key]: val }));
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    setParams(prev => ({ ...prev, ...preset.params }));
    toast.success(`Applied preset: ${preset.label}`);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Parameters saved");
    } catch {
      toast.error("Failed to save parameters");
    } finally {
      setSaving(false);
    }
  }

  async function startTraining(level: number) {
    setTraining(true);
    try {
      const res = await fetch("/api/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Training failed");
      toast.success(`Training Level ${level} started (job: ${data.job_id ?? "unknown"})`);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to start training");
    } finally {
      setTraining(false);
    }
  }

  async function startHfTraining() {
    if (!hfForm.dataset.trim()) {
      toast.error("Укажи датасет (например HuggingFaceFW/fineweb)");
      return;
    }
    setTraining(true);
    try {
      const res = await fetch("/api/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hf_dataset: hfForm.dataset.trim(),
          hf_column: hfForm.column || "text",
          limit: hfForm.limit || 1000,
          streaming: hfForm.streaming,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Training failed");
      toast.success(`HF training started (job: ${data.job_id ?? "unknown"})`);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to start training");
    } finally {
      setTraining(false);
    }
  }

  function addPlanSource() {
    setPlanSources(s => [...s, { name: "", type: "huggingface", column: "text", limit: 1000, streaming: true }]);
  }

  function removePlanSource(i: number) {
    setPlanSources(s => s.filter((_, j) => j !== i));
  }

  function updatePlanSource(i: number, upd: Partial<TrainingSource>) {
    setPlanSources(s => s.map((src, j) => (j === i ? { ...src, ...upd } : src)));
  }

  async function startPlanTraining() {
    const valid = planSources.filter(s => s.name?.trim());
    if (valid.length === 0) {
      toast.error("Добавь хотя бы один источник с name");
      return;
    }
    setTraining(true);
    try {
      const body: Record<string, unknown> = {
        sources: valid.map(s => ({
          name: s.name.trim(),
          type: s.type || "huggingface",
          column: s.column || undefined,
          text_from: s.text_from || undefined,
          limit: s.limit || undefined,
          streaming: s.streaming ?? true,
          config: s.config || undefined,
          split: s.split || "train",
        })),
      };
      if (planDuration > 0) body.duration_hours = planDuration;
      const res = await fetch("/api/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Training failed");
      toast.success(`План запущен (job: ${data.job_id ?? "unknown"})${planDuration ? ` на ${planDuration} ч` : ""}`);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to start plan");
    } finally {
      setTraining(false);
    }
  }

  const groupParams = PARAM_META.filter(p => p.group === activeGroup);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">Training Parameters</h1>
          <p className="text-text-secondary text-sm mt-1">Adjust gX-Li-Ω regulators and depth settings</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save & Apply"}
        </button>
      </div>

      {/* Presets */}
      <div className="omega-card p-4">
        <div className="font-medium text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          Presets
        </div>
        <div className="flex gap-3 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="px-4 py-2 rounded-lg border border-border hover:border-accent/50 bg-bg-card text-sm transition-colors"
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-text-muted text-xs block mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* План обучения */}
      <div className="omega-card p-4">
        <div className="font-medium text-sm mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-accent" />
          План обучения
        </div>
        <p className="text-text-muted text-xs mb-3">
          Составь список источников (как datasets_config). Запуск по плану — один прогон или цикл до истечения времени.
        </p>
        <div className="space-y-3 mb-4">
          {planSources.map((src, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-start p-3 rounded-lg border border-border bg-bg-hover/50">
              <div className="flex-1 min-w-[140px] grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  value={src.name}
                  onChange={e => updatePlanSource(i, { name: e.target.value })}
                  placeholder="name (squad, HuggingFaceFW/fineweb)"
                  className="omega-input col-span-2"
                />
                <input
                  value={src.column ?? ""}
                  onChange={e => updatePlanSource(i, { column: e.target.value || undefined })}
                  placeholder="column"
                  className="omega-input"
                />
                <input
                  value={Array.isArray(src.text_from) ? src.text_from.join(", ") : (src.text_from ?? "")}
                  onChange={e => updatePlanSource(i, { text_from: e.target.value ? e.target.value.split(",").map(x => x.trim()) : undefined })}
                  placeholder="text_from (context, question)"
                  className="omega-input"
                />
                <input
                  type="number"
                  value={src.limit ?? ""}
                  onChange={e => updatePlanSource(i, { limit: parseInt(e.target.value, 10) || undefined })}
                  placeholder="limit"
                  className="omega-input w-20"
                />
                <label className="flex items-center gap-1 text-xs text-text-muted col-span-2">
                  <input
                    type="checkbox"
                    checked={src.streaming ?? true}
                    onChange={e => updatePlanSource(i, { streaming: e.target.checked })}
                    className="rounded accent-accent"
                  />
                  streaming
                </label>
              </div>
              <button
                onClick={() => removePlanSource(i)}
                className="p-2 rounded border border-border hover:border-red-500/50 text-text-muted hover:text-red-400"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button onClick={addPlanSource} className="px-4 py-2 rounded-lg border border-border hover:border-accent/50 bg-bg-card text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить источник
          </button>
          <select
            value={planDuration}
            onChange={e => setPlanDuration(Number(e.target.value))}
            className="omega-input w-32"
          >
            {DURATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={startPlanTraining}
            disabled={training || planSources.every(s => !s.name?.trim())}
            className="btn-primary flex items-center gap-2"
          >
            {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Запустить план
          </button>
        </div>
      </div>

      {/* Hugging Face */}
      <div className="omega-card p-4">
        <div className="font-medium text-sm mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          Hugging Face
        </div>
        <p className="text-text-muted text-xs mb-3">
          Любой датасет с Hub. Примеры: HuggingFaceFW/fineweb, squad, facebook/lama (config: trex)
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-text-muted block mb-1">Датасет</label>
            <input
              value={hfForm.dataset}
              onChange={e => setHfForm(f => ({ ...f, dataset: e.target.value }))}
              placeholder="HuggingFaceFW/fineweb"
              className="omega-input w-full"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-text-muted block mb-1">Колонка</label>
            <input
              value={hfForm.column}
              onChange={e => setHfForm(f => ({ ...f, column: e.target.value }))}
              placeholder="text"
              className="omega-input w-full"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-text-muted block mb-1">Лимит</label>
            <input
              type="number"
              value={hfForm.limit}
              onChange={e => setHfForm(f => ({ ...f, limit: parseInt(e.target.value, 10) || 1000 }))}
              min={100}
              max={100000}
              className="omega-input w-full"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={hfForm.streaming}
              onChange={e => setHfForm(f => ({ ...f, streaming: e.target.checked }))}
              className="rounded accent-accent"
            />
            Streaming
          </label>
          <button
            onClick={startHfTraining}
            disabled={training || !hfForm.dataset.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Запустить HF
          </button>
        </div>
      </div>

      {/* Training levels */}
      <div className="omega-card p-4">
        <div className="font-medium text-sm mb-3 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-accent" />
          Уровни обучения
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEVELS.map(l => (
            <div key={l.level} className="border border-border rounded-lg p-4 space-y-2">
              <div>
                <div className="font-medium text-sm">{l.label}</div>
                <div className="text-text-muted text-xs">{l.desc}</div>
                <div className="text-text-muted text-xs mt-1">{l.detail}</div>
              </div>
              <button
                onClick={() => startTraining(l.level)}
                disabled={training}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Запустить Level {l.level}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeGroup === g ? "bg-accent/10 text-accent border border-accent/20" : "bg-bg-card text-text-secondary border border-border hover:border-border-bright"}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="omega-card p-4 flex-1 animate-pulse h-24 rounded-lg bg-bg-hover" />
            ))}
          </div>
        ) : (
          groupParams.map(p => (
            <div key={p.key} className="omega-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-text-muted text-xs mt-0.5 leading-relaxed">{p.description}</div>
                </div>
                <span className="text-accent font-mono text-xs ml-3 mt-0.5">
                  {typeof params[p.key] === "number" && !isNaN(params[p.key])
                    ? params[p.key].toFixed(p.step < 1 ? 4 : 0)
                    : p.min.toFixed(p.step < 1 ? 4 : 0)}
                </span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={params[p.key] ?? p.min}
                onChange={e => update(p.key, parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted font-mono">
                <span>{p.min}</span>
                <span>{p.max}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
