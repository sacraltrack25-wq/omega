"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Chrome } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard/chat" });
    // Page will redirect — no need to reset loading
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 grid-bg">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary text-sm mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        {/* Card */}
        <div className="omega-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-accent mb-2">Ω</div>
            <h1 className="text-lg font-semibold">Welcome to OMEGA</h1>
            <p className="text-text-secondary text-sm mt-1">Sign in to access Mirror Intelligence</p>
          </div>

          {/* One-button Google sign-in / sign-up */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-bg-hover hover:bg-bg-elevated
                       border border-border hover:border-border-bright text-text-primary font-medium
                       py-3 px-4 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="omega-spinner" />
            ) : (
              <Chrome className="w-4 h-4" />
            )}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-center text-text-muted text-xs mt-4">
            New user? Your account is created automatically on first sign-in.
          </p>

          <p className="text-center text-text-muted text-xs mt-2">
            By continuing you agree to our terms of service.
          </p>
        </div>

        {/* Mirror annotation */}
        <div className="mt-6 text-center">
          <span className="text-text-muted text-xs font-mono">
            const gX1 ↔ const gX2 &nbsp;·&nbsp; let Ω
          </span>
        </div>
      </motion.div>
    </div>
  );
}
