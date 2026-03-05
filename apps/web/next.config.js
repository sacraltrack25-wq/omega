const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Map the AI engine workspace package to its TypeScript source
  webpack(config) {
    config.resolve.alias["@omega/core"] = path.resolve(
      __dirname,
      "../../core/src/index.ts",
    );
    return config;
  },
};

module.exports = nextConfig;
