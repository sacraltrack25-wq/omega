import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = { role?: string };

/** GET /api/admin/status — core status + Encoder Service health */
export async function GET() {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const coreUrl = process.env.AI_ENGINE_URL ?? "http://localhost:4000";
  const encoderUrl = process.env.ENCODER_URL ?? "http://localhost:5001";
  const apiKey = process.env.AI_ENGINE_API_KEY ?? "";

  const [coreRes, encoderRes] = await Promise.all([
    fetch(`${coreUrl}/status`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    }).catch(() => null),
    fetch(`${encoderUrl}/health`, { cache: "no-store" }).catch(() => null),
  ]);

  const core = coreRes?.ok
    ? await coreRes.json().catch(() => ({}))
    : { error: coreRes?.status ?? "unreachable" };

  const encoder = encoderRes?.ok
    ? await encoderRes.json().catch(() => ({ ok: true }))
    : { ok: false, error: encoderRes?.status ?? "unreachable" };

  return NextResponse.json({ core, encoder });
}
