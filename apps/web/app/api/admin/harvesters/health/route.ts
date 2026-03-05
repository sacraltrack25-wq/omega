import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = { role: string };

/** GET /api/admin/harvesters/health — проверка доступности Harvesters */
export async function GET() {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as (SessionUser | undefined);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const harvesterUrl = process.env.HARVESTER_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${harvesterUrl}/health`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data.detail ?? "Harvesters error" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Harvesters недоступны" },
      { status: 503 },
    );
  }
}
