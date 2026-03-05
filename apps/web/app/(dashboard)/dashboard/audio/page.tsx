"use client";

import { useState } from "react";
import { Music, Mic, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { formatPercent, formatMs } from "@/lib/utils";

export default function AudioPage() {
  const [task, setTask]       = useState("transcribe");
  const [result, setResult]   = useState<null | { answer: string; confidence: number; processingMs: number; converged: boolean }>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", input: { task } }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
          <Music className="w-4 h-4 text-warning" />
        </div>
        <div>
          <h1 className="font-semibold">AudioNet</h1>
          <p className="text-text-secondary text-sm">Speech recognition, audio classification, emotion detection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="omega-card p-5 text-center cursor-pointer hover:border-border-bright transition-colors">
          <Mic className="w-6 h-6 text-warning mx-auto mb-2" />
          <p className="text-sm font-medium">Record Audio</p>
          <p className="text-text-muted text-xs mt-1">Live microphone input</p>
        </div>
        <div className="omega-card p-5 text-center cursor-pointer hover:border-border-bright transition-colors">
          <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
          <p className="text-sm font-medium">Upload File</p>
          <p className="text-text-muted text-xs mt-1">MP3, WAV, OGG, FLAC</p>
        </div>
      </div>

      <div className="omega-card p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {["transcribe", "classify", "analyze", "detect-emotion", "identify-speaker"].map(t => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${task === t ? "bg-warning/10 text-warning border border-warning/25" : "bg-bg-hover text-text-secondary border border-border hover:border-border-bright"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <div className="omega-spinner" /> : <Music className="w-4 h-4" />}
          Process Audio
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
