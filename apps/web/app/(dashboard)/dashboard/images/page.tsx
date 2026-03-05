"use client";

import { useState } from "react";
import { Upload, Image as ImageIcon, Search } from "lucide-react";
import { motion } from "framer-motion";
import { formatPercent, formatMs } from "@/lib/utils";

export default function ImagesPage() {
  const [result, setResult]   = useState<null | { answer: string; confidence: number; processingMs: number; converged: boolean }>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt]   = useState("");

  async function analyze() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", input: { data: "", task: "describe", prompt } }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-success" />
        </div>
        <div>
          <h1 className="font-semibold">ImageNet</h1>
          <p className="text-text-secondary text-sm">Image understanding, classification, visual analysis</p>
        </div>
      </div>

      {/* Upload area */}
      <div className="omega-card p-8 border-dashed border-2 border-border text-center cursor-pointer hover:border-border-bright transition-colors">
        <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary text-sm mb-1">Drag & drop an image, or click to upload</p>
        <p className="text-text-muted text-xs">PNG, JPG, WebP — max 20MB</p>
      </div>

      {/* Prompt */}
      <div className="flex gap-3">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && analyze()}
          placeholder="Describe or ask about the image…"
          className="omega-input flex-1"
        />
        <button onClick={analyze} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <div className="omega-spinner" /> : <Search className="w-4 h-4" />}
          Analyze
        </button>
      </div>

      {/* Result */}
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
