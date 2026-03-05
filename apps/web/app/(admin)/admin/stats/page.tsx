"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { toast } from "sonner";
import { BarChart2, TrendingUp, Database, Cpu, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const NET_COLORS: Record<string, string> = {
  text: "#3b82f6", image: "#22c55e", video: "#06b6d4",
  audio: "#eab308", game: "#ef4444",
};

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ core?: Record<string, unknown>; encoder?: { ok: boolean } } | null>(null);
  const [harvestLog, setHarvestLog] = useState<Array<{ job_id: string; source_type: string; source_id: string; items_count: number; status: string; completed_at: string | null }>>([]);
  const [stats, setStats] = useState<{
    queries?: { total: number; today: number };
    recall_used?: number;
    recall_rate?: number;
    multimodal_used?: number;
    multimodal_rate?: number;
    by_network?: Record<string, { count: number; totalConf: number; converged: number; totalMs: number; totalIter: number }>;
    queries_by_day?: Array<{ date: string; count: number }>;
    network_usage_7d?: Record<string, number>;
  } | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [statusRes, harvestRes, statsRes] = await Promise.all([
        fetch("/api/admin/status"),
        fetch("/api/admin/harvest-log?limit=50"),
        fetch("/api/admin/stats"),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (harvestRes.ok) {
        const h = await harvestRes.json();
        setHarvestLog(h.entries ?? []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function saveLiToDb() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/dump-li", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        toast.success(`Сохранено ${data.total ?? 0} записей в Supabase`);
        fetchData();
      } else {
        toast.error(data.error ?? "Ошибка сохранения");
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  const core = status?.core as { knowledgeRows?: number; totalQueries?: number; uptime?: number; networks?: Record<string, { totalKnowledge?: number }> } | undefined;
  const encoderOk = status?.encoder?.ok ?? false;
  const byNetwork = stats?.by_network ?? {};
  const queriesByDay = stats?.queries_by_day ?? [];
  const networkUsage = stats?.network_usage_7d ?? {};
  const pieData = Object.entries(networkUsage).map(([name, value]) => ({ name, value }));

  function formatDate(s: string | null) {
    if (!s) return "—";
    return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function formatUptime(ms: number) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-bg-hover rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="omega-card p-4 h-24 rounded-lg bg-bg-hover" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Statistics</h1>
          <p className="text-text-secondary text-sm mt-1">Performance metrics across all networks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveLiToDb}
            disabled={saving || !(core?.knowledgeRows ?? 0)}
            className="btn-outline flex items-center gap-2"
            title="Сохранить Li RAM в Supabase"
          >
            {saving ? "..." : <Database className="w-4 h-4" />}
            {saving ? "Сохранение..." : "Сохранить Li в БД"}
          </button>
          <button onClick={fetchData} className="btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Core status cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="omega-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">Знаний в Li</span>
            <Database className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold">{formatNumber(core?.knowledgeRows ?? 0)}</div>
        </div>
        <div className="omega-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">Запросов</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold">{formatNumber(core?.totalQueries ?? stats?.queries?.total ?? 0)}</div>
        </div>
        <div className="omega-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">Encoder Service</span>
            {encoderOk ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-warning" />}
          </div>
          <div className="text-sm font-medium">{encoderOk ? "Доступен" : "Недоступен"}</div>
        </div>
        <div className="omega-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">Recall Rate</span>
            <BarChart2 className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold">{formatPercent(stats?.recall_rate ?? 0)}</div>
        </div>
        <div className="omega-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs">Multimodal</span>
            <Cpu className="w-4 h-4 text-info" />
          </div>
          <div className="text-xl font-bold">{formatPercent(stats?.multimodal_rate ?? 0)}</div>
          <div className="text-xs text-text-muted mt-0.5">{formatNumber(stats?.multimodal_used ?? 0)} запросов</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="omega-card p-4">
          <div className="font-medium text-sm mb-3">Queries by day</div>
          <div className="h-48">
            {queriesByDay.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={queriesByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c6af7" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">No data</div>
            )}
          </div>
        </div>
        <div className="omega-card p-4">
          <div className="font-medium text-sm mb-3">Knowledge by network</div>
          <div className="h-48">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={NET_COLORS[pieData[i].name] ?? "#888"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Network performance */}
      <div className="omega-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent" />
          <span className="font-medium text-sm">Network Performance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Network", "Queries", "Avg Confidence", "Converge Rate", "Avg Time", "Avg Iterations"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-text-muted font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byNetwork).map(([name, s]) => (
                <tr key={name} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NET_COLORS[name] ?? "#888" }} />
                      <span className="font-medium capitalize">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{formatNumber(s.count)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="text-success">{formatPercent(s.count ? s.totalConf / s.count : 0)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatPercent(s.count ? s.converged / s.count : 0)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {s.count ? Math.round(s.totalMs / s.count) : 0}ms
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {s.count ? (s.totalIter / s.count).toFixed(1) : "0"}
                  </td>
                </tr>
              ))}
              {!Object.keys(byNetwork).length && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted text-sm">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Harvest log */}
      <div className="omega-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          <span className="font-medium text-sm">Harvest Log (HF / LAMA / Training)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Source", "Type", "Items", "Status", "Completed"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-text-muted font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {harvestLog.map(row => (
                <tr key={row.job_id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]" title={row.source_id}>{row.source_id}</td>
                  <td className="px-4 py-3 text-xs capitalize">{row.source_type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatNumber(row.items_count)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${row.status === "completed" ? "badge-success" : row.status === "running" ? "badge-accent" : "badge-muted"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatDate(row.completed_at)}</td>
                </tr>
              ))}
              {!harvestLog.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-text-muted text-sm">No harvest log entries</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
