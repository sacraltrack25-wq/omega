import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = { role?: string };

/** POST /api/admin/train — proxy to Harvesters /train */
export async function POST(request: Request) {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const harvesterUrl = process.env.HARVESTER_URL ?? "http://localhost:8000";
  const apiKey = process.env.AI_ENGINE_API_KEY ?? "";

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  try {
    const res = await fetch(`${harvesterUrl}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.message ?? `Harvester error: ${res.status}` },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Harvesters недоступны. Запусти: cd services/harvesters && uvicorn main:app --port 8000" },
      { status: 503 },
    );
  }
}
