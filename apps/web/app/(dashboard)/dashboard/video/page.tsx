"use client";

import { useState } from "react";
import { Video, Link as LinkIcon, Play } from "lucide-react";
import { motion } from "framer-motion";
import { formatPercent, formatMs } from "@/lib/utils";

export default function VideoPage() {
  const [url, setUrl]         = useState("");
  const [task, setTask]       = useState<string>("understand");
  const [result, setResult]   = useState<null | { answer: string; confidence: number; processingMs: number; converged: boolean }>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", input: { url, task } }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center">
          <Video className="w-4 h-4 text-info" />
        </div>
        <div>
          <h1 className="font-semibold">VideoNet</h1>
          <p className="text-text-secondary text-sm">Temporal video understanding, scene analysis, captioning</p>
        </div>
      </div>

      <div className="omega-card p-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste a video URL…"
              className="omega-input pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["understand", "caption", "segment", "detect-action"].map(t => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${task === t ? "bg-accent/15 text-accent border border-accent/25" : "bg-bg-hover text-text-secondary border border-border hover:border-border-bright"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <button onClick={analyze} disabled={loading || !url} className="btn-primary flex items-center gap-2">
          {loading ? <div className="omega-spinner" /> : <Play className="w-4 h-4" />}
          Analyze Video
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="omega-card p-5 space-y-3">
          <p className="text-sm leading-relaxed">{result.answer}</p>
          <div className="flex gap-4 text-xs font-mono text-text-muted">
            <span className={result.converged ? "text-success" : "text-warning"}>
              {result.converged ? "✓ converged" : "~ partial"}
            </span>
            <span>confidence {formatPercent(result.confidence)}</span>
            <span>{formatMs(result.processingMs)}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
