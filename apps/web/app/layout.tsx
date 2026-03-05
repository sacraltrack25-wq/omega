import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMEGA AI — Mirror Intelligence",
  description: "A novel AI built on the Mirror Principle: gX · Li · Ω — text, image, video, audio, and game intelligence in one unified system.",
  keywords: ["AI", "mirror neural network", "gX", "Li", "Omega", "artificial intelligence"],
  openGraph: {
    title: "OMEGA AI",
    description: "Mirror Intelligence — gX · Li · Ω",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    // JWT decryption failed (stale cookie, changed secret) — treat as logged out
    session = null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <Providers session={session}>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
