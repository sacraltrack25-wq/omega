import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

/** GET /api/admin/harvesters/knowledge?source=URL — знания из li_knowledge по источнику */
export async function GET(req: Request) {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as (SessionUser | undefined);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");
  if (!source?.trim()) {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("li_knowledge")
    .select("id, key, raw, source, quality, created_at")
    .eq("source", source.trim())
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
