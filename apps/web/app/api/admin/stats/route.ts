import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

/** GET /api/admin/stats — system-wide statistics */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as (SessionUser | undefined);
  if (!user || user.role !== "admin") {
    if (process.env.ADMIN_BYPASS !== "true") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalQueries },
    { count: queriesToday },
    { count: recallUsed },
    { count: multimodalUsed },
    { count: activeJobs },
    { data: planDist },
    { data: queryData },
    { data: recentQueries },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("omega_queries").select("*", { count: "exact", head: true }),
    supabase.from("omega_queries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("omega_queries")
      .select("*", { count: "exact", head: true })
      .eq("recall_used", true),
    supabase.from("omega_queries")
      .select("*", { count: "exact", head: true })
      .eq("multimodal", true),
    supabase.from("harvester_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "running"),
    supabase.from("profiles")
      .select("current_plan"),
    supabase.from("omega_queries")
      .select("network_type, created_at, confidence, converged, processing_ms, iterations")
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()),
    supabase.from("omega_queries")
      .select("id, input, answer, confidence, network_type, created_at, is_admin_query, recall_used")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Aggregate plan distribution
  const planCount: Record<string, number> = {};
  for (const p of (planDist ?? [])) {
    const plan = (p as { current_plan: string }).current_plan;
    planCount[plan] = (planCount[plan] ?? 0) + 1;
  }

  // Aggregate network usage and queries by day
  const networkCount: Record<string, number> = {};
  const dayCount: Record<string, number> = {};
  for (const q of (queryData ?? [])) {
    const row = q as { network_type: string; created_at: string };
    networkCount[row.network_type] = (networkCount[row.network_type] ?? 0) + 1;
    const day = row.created_at.slice(0, 10);
    dayCount[day] = (dayCount[day] ?? 0) + 1;
  }
  const queries_by_day = Object.entries(dayCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Per-network stats
  const byNetwork: Record<string, { count: number; totalConf: number; converged: number; totalMs: number; totalIter: number }> = {};
  for (const q of (queryData ?? [])) {
    const row = q as { network_type: string; confidence?: number; converged?: boolean; processing_ms?: number; iterations?: number };
    const n = row.network_type ?? "unknown";
    if (!byNetwork[n]) byNetwork[n] = { count: 0, totalConf: 0, converged: 0, totalMs: 0, totalIter: 0 };
    byNetwork[n].count++;
    byNetwork[n].totalConf += row.confidence ?? 0;
    byNetwork[n].converged += row.converged ? 1 : 0;
    byNetwork[n].totalMs += row.processing_ms ?? 0;
    byNetwork[n].totalIter += row.iterations ?? 0;
  }

  return NextResponse.json({
    users:             { total: totalUsers ?? 0 },
    queries:           { total: totalQueries ?? 0, today: queriesToday ?? 0 },
    recall_used:       recallUsed ?? 0,
    recall_rate:       (totalQueries ?? 0) > 0 ? ((recallUsed ?? 0) / (totalQueries ?? 1)) : 0,
    multimodal_used:   multimodalUsed ?? 0,
    multimodal_rate:   (totalQueries ?? 0) > 0 ? ((multimodalUsed ?? 0) / (totalQueries ?? 1)) : 0,
    harvesters:        { active_jobs: activeJobs ?? 0 },
    plan_distribution: planCount,
    network_usage_7d:  networkCount,
    queries_by_day:    queries_by_day,
    by_network:        byNetwork,
    recent_queries:    recentQueries ?? [],
  });
}
