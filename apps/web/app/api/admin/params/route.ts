import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PARAM_META } from "@omega/core";

type SessionUser = { id?: string; role?: string };

/** GET /api/admin/params — load parameters from network_configs (text) or PARAM_META defaults */
export async function GET() {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("network_configs")
    .select("parameters")
    .eq("network_type", "text")
    .single();

  const stored = (data?.parameters as Record<string, number> | null) ?? {};
  const defaults = Object.fromEntries(
    PARAM_META.map(p => [p.key, typeof stored[p.key] === "number" ? stored[p.key] : p.min]),
  );
  return NextResponse.json(defaults);
}

export async function POST(request: Request) {
  let userId: string | undefined;

  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as typeof session.user & { id?: string; role?: string };
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    userId = user.id;
  }

  const params = await request.json() as Record<string, number | boolean>;
  const supabase = createClient();
  const types = ["text", "image", "video", "audio", "game"];

  await Promise.all(
    types.map(t =>
      supabase.from("network_configs").upsert({
        network_type: t,
        parameters:   params,
        updated_by:   userId ?? null,
        updated_at:   new Date().toISOString(),
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
