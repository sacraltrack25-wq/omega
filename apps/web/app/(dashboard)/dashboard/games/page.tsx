"use client";

import { useState } from "react";
import { Gamepad2, Zap, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { formatPercent, formatMs } from "@/lib/utils";

const GAME_MODES = ["survival", "combat", "exploration", "creative"] as const;

export default function GamesPage() {
  const [mode, setMode]       = useState<typeof GAME_MODES[number]>("combat");
  const [realism, setRealism] = useState(3);
  const [result, setResult]   = useState<null | { answer: string; confidence: number; processingMs: number; converged: boolean }>(null);
  const [loading, setLoading] = useState(false);

  async function simulate() {
    setLoading(true);
    const state = {
      position:  [0, 0, 0], velocity: [0, 0, 0], rotation: [0, 0, 0],
      health: 0.8, stamina: 0.9, nearbyEntities: [[5, 0, 3, 1, 0.7], [-3, 0, 2, 2, 1.0]],
      terrainData: Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.3) * 128 + 128),
      lightLevel: 0.7, timeOfDay: 0.4, objectiveVector: [0.5, 0.2],
      inventory: [1, 0, 1, 0, 0], threatLevel: 0.4, playerSkillEstimate: 0.6,
      gameMode: mode, realistLevel: realism,
    };
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "game", input: state }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center">
          <Gamepad2 className="w-4 h-4 text-danger" />
        </div>
        <div>
          <h1 className="font-semibold">GameNet</h1>
          <p className="text-text-secondary text-sm">Ultra-realistic NPC AI, physics, procedural generation</p>
        </div>
      </div>

      <div className="omega-card p-5 space-y-5">
        {/* Game mode */}
        <div>
          <label className="text-xs text-text-muted mb-2 block">Game Mode</label>
          <div className="flex gap-2 flex-wrap">
            {GAME_MODES.map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${mode === m ? "bg-danger/10 text-danger border border-danger/25" : "bg-bg-hover text-text-secondary border border-border hover:border-border-bright"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Realism slider */}
        <div>
          <label className="text-xs text-text-muted mb-2 block flex items-center justify-between">
            <span>Realism Level</span>
            <span className="text-text-secondary">{realism}/5</span>
          </label>
          <input
            type="range" min={1} max={5} value={realism}
            onChange={e => setRealism(Number(e.target.value))}
            className="w-full accent-danger"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Arcade</span>
            <span>Simulation</span>
            <span>Ultra-Real</span>
          </div>
        </div>

        <button onClick={simulate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Run NPC Decision
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="omega-card p-5 space-y-3">
          <div className="text-xs text-text-muted mb-2 font-mono">GameNet · Ω output</div>
          <p className="text-sm leading-relaxed font-mono">{result.answer}</p>
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
