import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as typeof session.user & { role?: string };
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as { url: string; type: string };
  const harvesterUrl = process.env.HARVESTER_URL ?? "http://localhost:8000";
  const apiKey       = process.env.AI_ENGINE_API_KEY ?? "";

  try {
    const res = await fetch(`${harvesterUrl}/harvest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ source_url: body.url, network_type: body.type }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.message ?? `Harvester error: ${res.status}` },
        { status: res.status },
      );
    }
    return NextResponse.json({ id: data.job_id, job_id: data.job_id, status: data.status, message: data.message });
  } catch (err) {
    return NextResponse.json(
      { error: `Harvesters недоступны. Запусти: cd services/harvesters && uvicorn main:app --port 8000` },
      { status: 503 },
    );
  }
}
