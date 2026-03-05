"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Database, Plus, Play, Globe, RefreshCw, BarChart2, Layers, Copy, RotateCcw, Trash2, Eye, CheckCircle, AlertCircle, Cpu } from "lucide-react";

const NETWORK_TYPES = ["text", "image", "video", "audio", "game", "web"];

const NET_COLORS: Record<string, string> = {
  text: "bg-accent", image: "bg-success", video: "bg-info",
  audio: "bg-warning", game: "bg-danger", web: "bg-accent",
};

/** Определяет тип контента по URL и дополнительные рекомендуемые типы */
function detectTypesFromUrl(url: string): { primary: string; suggested: string[] } {
  const u = url.toLowerCase().trim();
  if (!u) return { primary: "text", suggested: [] };

  const videoPatterns = /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|dailymotion\.com|\.mp4|\.webm|\.mov|\.mkv/i;
  const imagePatterns = /\.(jpg|jpeg|png|gif|webp)(\?|$)|imgur\.com|instagram\.com\/p\//i;
  const audioPatterns = /\.(mp3|wav|ogg|flac|m4a)(\?|$)|soundcloud\.com|spotify\.com/i;
  const gamePatterns = /itch\.io|steam|game/i;

  if (videoPatterns.test(u)) return { primary: "video", suggested: ["text"] };
  if (imagePatterns.test(u)) return { primary: "image", suggested: [] };
  if (audioPatterns.test(u)) return { primary: "audio", suggested: ["text"] };
  if (gamePatterns.test(u)) return { primary: "game", suggested: [] };
  if (/wikipedia\.org|\.html?(\?|$)|\.txt(\?|$)/i.test(u)) return { primary: "text", suggested: [] };
  return { primary: "web", suggested: ["text"] };
}

function formatDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function JobProgress({ status, itemsCollected }: { status: string; itemsCollected: number }) {
  if (status === "completed") {
    return (
      <div className="w-20 h-1.5 rounded-full bg-bg-hover overflow-hidden">
        <div className="h-full w-full rounded-full bg-success" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="w-20 h-1.5 rounded-full bg-bg-hover overflow-hidden">
        <div className="h-full w-full rounded-full bg-danger" />
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-20 progress-indeterminate" title={`${itemsCollected} элементов`}>
        <div />
      </div>
    );
  }
  return (
    <div className="w-20 h-1.5 rounded-full bg-bg-hover overflow-hidden">
      <div className="h-full w-1/3 rounded-full bg-text-muted animate-pulse" />
    </div>
  );
}

export default function HarvestersPage() {
  const [url, setUrl]         = useState("");
  const [type, setType]       = useState("text");
  const [launching, setLaunch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [harvesterOk, setHarvesterOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [suggestedTypes, setSuggestedTypes] = useState<string[]>([]);
  const [viewJob, setViewJob] = useState<{ source_url: string; items: Array<{ key: string; raw: string | null; quality: number }> } | null>(null);
  const [encoderOk, setEncoderOk] = useState<boolean | null>(null);
  const [harvestLog, setHarvestLog] = useState<Array<{ job_id: string; source_type: string; source_id: string; items_count: number; status: string; completed_at: string | null }>>([]);
  const [trainLaunching, setTrainLaunching] = useState(false);
  const [trainForm, setTrainForm] = useState({ level: 1, hf_dataset: "", hf_column: "text", limit: 1000, url: "", streaming: false });
  const [data, setData]       = useState<{
    jobs: Array<{ id: string; type: string; source_url: string; status: string; items_collected: number; error: string | null; started_at: string; completed_at: string | null }>;
    stats: { total_jobs: number; total_items: number; completed_jobs: number; failed_jobs: number; running_jobs: number; items_by_network: Record<string, number> };
    knowledge: { total: number; by_network: Record<string, number> };
  } | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [harvestersRes, statusRes, harvestLogRes] = await Promise.all([
        fetch("/api/admin/harvesters?limit=50"),
        fetch("/api/admin/status"),
        fetch("/api/admin/harvest-log?limit=30"),
      ]);
      const json = await harvestersRes.json();
      setData(json);
      if (statusRes.ok) {
        const s = await statusRes.json();
        setEncoderOk(s?.encoder?.ok ?? false);
      }
      if (harvestLogRes.ok) {
        const h = await harvestLogRes.json();
        setHarvestLog(h.entries ?? []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/harvesters/health");
      const data = await res.json().catch(() => ({}));
      setHarvesterOk(res.ok && data.ok);
      return res.ok && data.ok;
    } catch {
      setHarvesterOk(false);
      return false;
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { checkHealth(); }, [checkHealth]);

  const lastDetectedUrl = useRef("");
  function handleUrlChange(newUrl: string) {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setSuggestedTypes([]);
      lastDetectedUrl.current = "";
      return;
    }
    const { primary, suggested } = detectTypesFromUrl(newUrl);
    setType(primary);
    setSuggestedTypes(suggested);
  }
  function handleUrlBlur() {
    const u = url.trim();
    if (!u || u.length < 15 || !/https?:\/\//i.test(u) || u === lastDetectedUrl.current) return;
    lastDetectedUrl.current = u;
    const { primary, suggested } = detectTypesFromUrl(u);
    toast.info(`Определён тип: ${primary}`, { duration: 2000 });
    if (suggested.length > 0) {
      toast.info(`Рекомендуем также: ${suggested.join(", ")}`, { duration: 4000 });
    }
  }

  async function launchHarvester(overrideType?: string) {
    if (!url.trim()) return;
    const harvestType = overrideType ?? type;
    const ok = await checkHealth();
    if (!ok) {
      toast.error("Harvesters не запущен", {
        description: "Запусти: pnpm dev:all или pnpm harvesters:dev",
        duration: 6000,
      });
      setError("Harvesters недоступны. Запусти: pnpm dev:all");
      return;
    }
    setLaunch(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: harvestType }),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg = result.error ?? `Ошибка ${res.status}`;
        setError(msg);
        toast.error("Ошибка запуска", { description: msg });
        return;
      }
      if (result.id ?? result.job_id) {
        toast.success(`Харвестер ${harvestType} запущен`, { description: `Job ${result.id ?? result.job_id} в очереди` });
        const nextSuggested = suggestedTypes.filter((t) => t !== harvestType);
        setSuggestedTypes(nextSuggested);
        if (nextSuggested.length === 0) setUrl("");
        else toast.info(`Запустите также: ${nextSuggested.join(", ")}`, { duration: 3000 });
        await fetchData();
      }
    } catch (e) {
      const msg = "Сеть недоступна. Запусти: pnpm dev:all";
      setError(msg);
      toast.error("Harvesters недоступны", { description: msg });
    } finally {
      setLaunch(false);
    }
  }

  async function rerunJob(j: { id: string; source_url: string; type: string }) {
    const ok = await checkHealth();
    if (!ok) {
      toast.error("Harvesters не запущен", { description: "Запусти: pnpm dev:all" });
      return;
    }
    setUrl(j.source_url);
    setType(j.type);
    setLaunch(true);
    setRerunning(j.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: j.source_url, type: j.type }),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg = result.error ?? `Ошибка ${res.status}`;
        setError(msg);
        toast.error("Ошибка запуска", { description: msg });
        return;
      }
      if (result.id ?? result.job_id) {
        toast.success("Задание перезапущено", { description: `Job ${result.id ?? result.job_id} в очереди` });
        await fetchData();
      }
    } catch (e) {
      const msg = "Сеть недоступна. Проверь, что Harvesters запущен на порту 8000.";
      setError(msg);
      toast.error("Harvesters недоступны", { description: msg });
    } finally {
      setLaunch(false);
      setRerunning(null);
    }
  }

  async function viewCollected(j: { source_url: string }) {
    try {
      const res = await fetch(`/api/admin/harvesters/knowledge?source=${encodeURIComponent(j.source_url)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка загрузки", { description: data.error });
        return;
      }
      setViewJob({ source_url: j.source_url, items: data.items ?? [] });
    } catch (e) {
      toast.error("Не удалось загрузить данные");
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  async function deleteJob(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/harvesters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Ошибка удаления", { description: data.error });
        return;
      }
      toast.success("Задание удалено");
      await fetchData();
    } catch (e) {
      toast.error("Не удалось удалить");
    } finally {
      setDeleting(null);
    }
  }

  const stats = data?.stats;
  const knowledge = data?.knowledge;
  const jobs = data?.jobs ?? [];
  const hasActiveJobs = jobs.some((j) => j.status === "running" || j.status === "queued");

  useEffect(() => {
    if (!hasActiveJobs) return;
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, [hasActiveJobs]);

  return (
    <div className="p-6 space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-xl font-bold">Harvesters</h1>
        <p className="text-text-secondary text-sm mt-1">Сбор данных для Li центров. Статистика обновляется при загрузке.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="omega-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Всего заданий</p>
            <p className="font-mono font-semibold">{loading ? "…" : formatNumber(stats?.total_jobs ?? 0)}</p>
          </div>
        </div>
        <div className="omega-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Собрано элементов</p>
            <p className="font-mono font-semibold">{loading ? "…" : formatNumber(stats?.total_items ?? 0)}</p>
          </div>
        </div>
        <div className="omega-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Знаний в Li</p>
            <p className="font-mono font-semibold">{loading ? "…" : formatNumber(knowledge?.total ?? 0)}</p>
          </div>
        </div>
        <div className="omega-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Активных</p>
            <p className="font-mono font-semibold">{loading ? "…" : (stats?.running_jobs ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Knowledge by network */}
      {knowledge && Object.keys(knowledge.by_network).length > 0 && (
        <div className="omega-card p-4">
          <p className="text-xs text-text-muted mb-2">Знаний по сетям (li_knowledge)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(knowledge.by_network).map(([net, count]) => (
              <span key={net} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-hover text-sm">
                <span className={`w-2 h-2 rounded-full ${NET_COLORS[net] ?? "bg-text-muted"}`} />
                <span className="capitalize">{net}</span>
                <span className="font-mono text-accent">{formatNumber(count)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Launch new harvester */}
      <div className="omega-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Plus className="w-4 h-4 text-accent" />
          Launch New Harvester
          {harvesterOk === true && (
            <span className="inline-flex items-center gap-1.5 text-success text-xs font-normal">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Harvesters запущен
            </span>
          )}
          {harvesterOk === false && (
            <span className="inline-flex items-center gap-1.5 text-danger text-xs font-normal">
              <span className="w-2 h-2 rounded-full bg-danger" />
              Harvesters не запущен
            </span>
          )}
        </div>

        {suggestedTypes.length > 0 && url.trim() && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-muted">Также запустить:</span>
            {suggestedTypes.map((t) => (
              <button
                key={t}
                onClick={() => launchHarvester(t)}
                disabled={launching}
                className="px-2.5 py-1 rounded-lg bg-bg-hover hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://example.com или список URL…"
              className="omega-input pl-9"
            />
          </div>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="omega-input w-36"
          >
            {NETWORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => launchHarvester()} disabled={launching || !url} className="btn-primary flex items-center gap-2">
            {launching ? <div className="omega-spinner" /> : <Play className="w-4 h-4" />}
            Launch
          </button>
        </div>
      </div>

      {/* Job list */}
      <div className="omega-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <span className="font-medium text-sm">История заданий</span>
          </div>
          <button
            onClick={async () => { await checkHealth(); await fetchData(); }}
            disabled={loading}
            className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {loading && jobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-muted text-sm">Загрузка…</div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-muted text-sm">Заданий ещё нет. Запусти харвестер выше.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Тип", "URL", "Статус", "Прогресс", "Собрано", "Начало", "Конец", "Ошибка", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-text-muted font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${NET_COLORS[j.type] ?? "bg-text-muted"}`} />
                      <span className="capitalize">{j.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary truncate max-w-[200px]" title={j.source_url}>{j.source_url}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border ${j.status === "completed" ? "badge-success" : j.status === "running" ? "badge-accent" : j.status === "failed" ? "badge-danger" : "badge-muted"}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <JobProgress status={j.status} itemsCollected={j.items_collected ?? 0} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{formatNumber(j.items_collected ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatDate(j.started_at)}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatDate(j.completed_at)}</td>
                    <td className="px-4 py-3 text-xs text-danger truncate max-w-[120px]" title={j.error ?? ""}>{j.error ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => viewCollected(j)}
                          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                          title="Посмотреть собранные данные"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyLink(j.source_url)}
                          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                          title="Скопировать ссылку"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rerunJob(j)}
                          disabled={rerunning === j.id || launching}
                          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Выполнить ещё раз"
                        >
                          {rerunning === j.id ? <div className="omega-spinner w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        </button>
                        <button
                          data-job-id={j.id}
                          onClick={(e) => {
                            const id = (e.currentTarget as HTMLButtonElement).dataset.jobId;
                            if (id) deleteJob(id);
                          }}
                          disabled={deleting === j.id}
                          className="p-1.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Удалить задание"
                        >
                          {deleting === j.id ? <div className="omega-spinner w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: просмотр собранных данных */}
      {viewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewJob(null)}
        >
          <div
            className="omega-card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <span className="font-medium text-sm">Собранные данные</span>
              </div>
              <button
                onClick={() => setViewJob(null)}
                className="p-1.5 rounded hover:bg-bg-hover text-text-muted"
              >
                ×
              </button>
            </div>
            <div className="p-3 border-b border-border text-xs text-text-muted truncate" title={viewJob.source_url}>
              {viewJob.source_url}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {viewJob.items.length === 0 ? (
                <p className="text-text-muted text-sm">Данные не найдены в li_knowledge. Возможно, харвестер собрал 0 элементов или данные ещё не синхронизированы.</p>
              ) : (
                viewJob.items.map((item, i) => (
                  <div key={item.key} className="p-3 rounded-lg bg-bg-hover text-sm">
                    <div className="flex items-center gap-2 mb-1 text-xs text-text-muted">
                      <span>#{i + 1}</span>
                      <span>key: {item.key.slice(0, 12)}…</span>
                      <span>quality: {item.quality.toFixed(2)}</span>
                    </div>
                    <p className="text-text-secondary whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
                      {item.raw || "(нет текста)"}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-border text-xs text-text-muted">
              {viewJob.items.length} записей
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
