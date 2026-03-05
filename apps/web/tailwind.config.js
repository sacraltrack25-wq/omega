/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OMEGA dark palette
        bg: {
          primary:   "#080808",
          secondary: "#0f0f0f",
          card:      "#141414",
          hover:     "#1a1a1a",
          elevated:  "#1e1e1e",
        },
        border: {
          DEFAULT: "#222222",
          subtle:  "#1a1a1a",
          bright:  "#333333",
        },
        text: {
          primary:   "#f0f0f0",
          secondary: "#888888",
          muted:     "#444444",
          dim:       "#2a2a2a",
        },
        accent: {
          DEFAULT:   "#7c6af7",
          hover:     "#9a8bff",
          muted:     "rgba(124,106,247,0.12)",
          glow:      "rgba(124,106,247,0.25)",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#38bdf8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "glow":       "glow 2s ease-in-out infinite alternate",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "slide-up":   "slideUp 0.4s ease forwards",
      },
      keyframes: {
        glow: {
          "0%":   { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(circle, #222 1px, transparent 1px)",
        "mirror-gradient": "linear-gradient(135deg, rgba(124,106,247,0.08) 0%, transparent 50%, rgba(124,106,247,0.04) 100%)",
      },
      backgroundSize: {
        "grid": "32px 32px",
      },
      boxShadow: {
        "glow-sm":  "0 0 12px rgba(124,106,247,0.2)",
        "glow-md":  "0 0 24px rgba(124,106,247,0.25)",
        "glow-lg":  "0 0 48px rgba(124,106,247,0.3)",
        "card":     "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,106,247,0.15)",
      },
    },
  },
  plugins: [],
};
