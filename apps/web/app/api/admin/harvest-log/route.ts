import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role?: string };

/** GET /api/admin/harvest-log — last N harvest_log entries */
export async function GET(req: Request) {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("harvest_log")
    .select("job_id, source_type, source_id, config, items_count, status, started_at, completed_at, error")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}
