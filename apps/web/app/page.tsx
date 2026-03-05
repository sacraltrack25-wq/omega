"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, Image, Video, Music, Gamepad2,
  ArrowRight, Zap, Shield, Layers, GitMerge,
  ChevronRight
} from "lucide-react";

const NETWORKS = [
  {
    id: "text",
    label: "TextNet",
    icon: MessageSquare,
    desc: "Language, reasoning, code generation, and conversation.",
    color: "#7c6af7",
    href: "/dashboard/chat",
  },
  {
    id: "image",
    label: "ImageNet",
    icon: Image,
    desc: "Image understanding, classification, and visual generation.",
    color: "#22c55e",
    href: "/dashboard/images",
  },
  {
    id: "video",
    label: "VideoNet",
    icon: Video,
    desc: "Video analysis, temporal understanding, scene captioning.",
    color: "#38bdf8",
    href: "/dashboard/video",
  },
  {
    id: "audio",
    label: "AudioNet",
    icon: Music,
    desc: "Speech recognition, audio classification, emotion detection.",
    color: "#f59e0b",
    href: "/dashboard/audio",
  },
  {
    id: "game",
    label: "GameNet",
    icon: Gamepad2,
    desc: "Ultra-realistic game AI, NPC behavior, procedural generation.",
    color: "#ef4444",
    href: "/dashboard/games",
  },
];

const FEATURES = [
  { icon: GitMerge, title: "Mirror Principle", desc: "Every neuron (gX) has a permanent mirror pair. Every Li center has a mirror. Truth emerges from consensus." },
  { icon: Layers,   title: "Grows with Data",  desc: "Li processing centers grow automatically as harvesters feed new knowledge from the web." },
  { icon: Zap,      title: "Omega Truth",       desc: "Ω validates its own output by re-running it through the mirror loop until convergence." },
  { icon: Shield,   title: "Self-Correcting",   desc: "Built-in error correction at the neuron level — gX1 and gX2 cancel noise automatically." },
];

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-wide flex items-center gap-2">
            <span className="text-accent">Ω</span> OMEGA AI
          </span>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost text-sm py-1.5 px-3">Admin</Link>
            <Link href="/login" className="btn-ghost text-sm py-1.5 px-3">Sign in</Link>
            <Link href="/login" className="btn-primary text-sm py-1.5 px-3">
              Get Started <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 grid-bg">
        {/* Mirror glow */}
        <div className="absolute inset-0 mirror-glow pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {/* Badge */}
          <motion.div variants={fade} className="inline-flex mb-6">
            <span className="badge badge-accent text-xs">
              <span className="neuron-dot bg-accent" /> Mirror Principle Architecture
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fade} className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Intelligence born from{" "}
            <span className="text-gradient">reflection</span>
          </motion.h1>

          <motion.p variants={fade} className="text-text-secondary text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            OMEGA AI is built on the Mirror Principle — every neuron, every processing center,
            every truth is validated by its mirror. <br />
            <span className="text-text-primary font-mono text-sm">const gX1 ↔ const gX2 &nbsp;·&nbsp; let Li1 ↔ let Li2 &nbsp;·&nbsp; let Ω</span>
          </motion.p>

          <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              Start Exploring <ArrowRight className="inline w-4 h-4 ml-1.5" />
            </Link>
            <Link href="#architecture" className="btn-outline px-6 py-3 text-base">
              How it works
            </Link>
          </motion.div>
        </motion.div>

        {/* Architecture diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="omega-card p-6 font-mono text-xs text-text-secondary leading-relaxed">
            <div className="flex justify-between items-center mb-3">
              <span className="text-accent font-semibold">gX · Li · Ω</span>
              <span className="badge badge-success text-xs">online</span>
            </div>
            <pre className="overflow-x-auto">{`┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐
│  gX Neurons │───▶│    Li  Centers       │───▶│   Ω Omega   │
│             │    │                      │    │             │
│ const gX1   │    │  let Li1 ↔ let Li2   │    │  let Omega  │
│    ↕mirror  │    │  cores grow w/ data  │    │  converges  │
│ const gX2   │    │                      │    │  to truth   │
└─────────────┘    └──────────────────────┘    └─────────────┘
  1 bit = 1 gX        knowledge + process        final answer`}</pre>
          </div>
        </motion.div>
      </section>

      {/* ── Networks ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">5 Neural Networks</h2>
            <p className="text-text-secondary">Each network runs on the same gX-Li-Ω engine, tuned for its modality.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {NETWORKS.map((net, i) => {
              const Icon = net.icon;
              return (
                <motion.div
                  key={net.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={net.href} className="omega-card p-5 block group cursor-pointer h-full">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: `${net.color}18`, border: `1px solid ${net.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: net.color }} />
                    </div>
                    <div className="font-semibold text-sm mb-1.5 group-hover:text-accent transition-colors">
                      {net.label}
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed">{net.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-text-muted group-hover:text-accent transition-colors">
                      Open <ChevronRight className="w-3 h-3" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="architecture" className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Built on the Mirror Principle</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Truth emerges not from a single computation, but from the consensus of a system and its perfect reflection.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="omega-card p-5 flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-muted border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">{f.title}</div>
                    <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center border-t border-border">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-6 font-bold">
            <span className="text-gradient">Ω</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-text-secondary mb-8">Sign in with Google and access all 5 networks immediately.</p>
          <Link href="/login" className="btn-primary px-8 py-3 text-base">
            Sign in with Google <ArrowRight className="inline w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-text-muted text-xs">
          OMEGA AI &nbsp;·&nbsp; gX · Li · Ω &nbsp;·&nbsp; Mirror Intelligence
        </p>
      </footer>
    </div>
  );
}
