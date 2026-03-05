/**
 * Admin API — dump Li RAM to Supabase
 * Proxies to AI Engine POST /dump-li
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = { role?: string };

export async function POST() {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const coreUrl = process.env.AI_ENGINE_URL ?? "http://localhost:4000";
  const apiKey = process.env.AI_ENGINE_API_KEY ?? "";

  try {
    const res = await fetch(`${coreUrl}/dump-li`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? `AI Engine error: ${res.status}` },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err), ok: false },
      { status: 500 },
    );
  }
}
