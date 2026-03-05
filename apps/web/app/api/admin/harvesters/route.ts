import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

/** GET /api/admin/harvesters — jobs list + stats + li_knowledge counts */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as (SessionUser | undefined);
  if (!user || user.role !== "admin") {
    if (process.env.ADMIN_BYPASS !== "true") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const [
    { data: jobs },
    { data: jobCounts },
    { data: knowledgeByNetwork },
    { count: totalKnowledge },
  ] = await Promise.all([
    supabase
      .from("harvester_jobs")
      .select("id, type, source_url, status, items_collected, error, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(limit),
    supabase
      .from("harvester_jobs")
      .select("type, status, items_collected"),
    supabase
      .from("li_knowledge")
      .select("network_type"),
    supabase
      .from("li_knowledge")
      .select("*", { count: "exact", head: true }),
  ]);

  // Aggregate harvester stats
  let totalItems = 0;
  let completed = 0;
  let failed = 0;
  let running = 0;
  const byNetwork: Record<string, number> = {};

  for (const j of jobCounts ?? []) {
    const row = j as { type: string; status: string; items_collected: number };
    totalItems += row.items_collected ?? 0;
    if (row.status === "completed") completed++;
    else if (row.status === "failed") failed++;
    else if (row.status === "running") running++;
    const t = row.type ?? "unknown";
    byNetwork[t] = (byNetwork[t] ?? 0) + (row.items_collected ?? 0);
  }

  // Aggregate li_knowledge by network
  const knowledgeByNet: Record<string, number> = {};
  for (const k of knowledgeByNetwork ?? []) {
    const net = (k as { network_type: string }).network_type ?? "unknown";
    knowledgeByNet[net] = (knowledgeByNet[net] ?? 0) + 1;
  }

  return NextResponse.json({
    jobs: jobs ?? [],
    stats: {
      total_jobs:        (jobCounts ?? []).length,
      total_items:       totalItems,
      completed_jobs:    completed,
      failed_jobs:       failed,
      running_jobs:      running,
      items_by_network:  byNetwork,
    },
    knowledge: {
      total:             totalKnowledge ?? 0,
      by_network:        knowledgeByNet,
    },
  });
}
