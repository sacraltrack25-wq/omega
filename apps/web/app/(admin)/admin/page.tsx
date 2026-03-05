import { createClient } from "@/lib/supabase/server";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Activity, Database, Zap, Users, TrendingUp, CheckCircle } from "lucide-react";

async function getStats(supabase: ReturnType<typeof createClient>) {
  const [queries, users, training, harvesters] = await Promise.all([
    supabase.from("omega_queries").select("id, confidence, converged, network_type", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("training_sessions").select("id, status").eq("status", "running"),
    supabase.from("harvester_jobs").select("id, status").eq("status", "running"),
  ]);

  const q = queries.data ?? [];
  const avgConf    = q.length ? q.reduce((s, r) => s + (r.confidence ?? 0), 0) / q.length : 0;
  const converged  = q.length ? q.filter(r => r.converged).length / q.length : 0;

  return {
    totalQueries:    queries.count ?? 0,
    totalUsers:      users.count ?? 0,
    trainingSessions:training.data?.length ?? 0,
    harvestersActive:harvesters.data?.length ?? 0,
    avgConfidence:   avgConf,
    convergeRate:    converged,
  };
}

const NETWORK_COLORS: Record<string, string> = {
  text:  "text-accent",
  image: "text-success",
  video: "text-info",
  audio: "text-warning",
  game:  "text-danger",
};

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const stats    = await getStats(supabase);

  const { data: recentQueries } = await supabase
    .from("omega_queries")
    .select("id, network_type, confidence, converged, processing_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const CARDS = [
    { label: "Total Queries",       value: formatNumber(stats.totalQueries),          icon: Zap,         color: "text-accent"   },
    { label: "Users",               value: formatNumber(stats.totalUsers),             icon: Users,       color: "text-info"     },
    { label: "Avg Confidence",      value: formatPercent(stats.avgConfidence),         icon: TrendingUp,  color: "text-success"  },
    { label: "Convergence Rate",    value: formatPercent(stats.convergeRate),          icon: CheckCircle, color: "text-success"  },
    { label: "Training Sessions",   value: String(stats.trainingSessions),             icon: Activity,    color: "text-warning"  },
    { label: "Active Harvesters",   value: String(stats.harvestersActive),             icon: Database,    color: "text-info"     },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">System Overview</h1>
        <p className="text-text-secondary text-sm mt-1">OMEGA AI — gX · Li · Ω engine status</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CARDS.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="omega-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-text-secondary text-xs">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent queries */}
      <div className="omega-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="font-medium text-sm">Recent Queries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-text-muted font-medium text-xs">Network</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium text-xs">Confidence</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium text-xs">Converged</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium text-xs">Time</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium text-xs">When</th>
              </tr>
            </thead>
            <tbody>
              {(recentQueries ?? []).map(q => (
                <tr key={q.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-medium capitalize ${NETWORK_COLORS[q.network_type] ?? "text-text-secondary"}`}>
                      {q.network_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{formatPercent(q.confidence ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${q.converged ? "text-success" : "text-warning"}`}>
                      {q.converged ? "✓ yes" : "~ partial"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{q.processing_ms}ms</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(q.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {!recentQueries?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-muted text-sm">No queries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
