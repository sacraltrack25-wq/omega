import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import { Network } from "lucide-react";

export default async function NeuronsPage() {
  const supabase = createClient();

  const { data: liCenters } = await supabase
    .from("li_centers")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: networks } = await supabase
    .from("networks")
    .select("*");

  const NET_COLORS: Record<string, string> = {
    text: "bg-accent/10 text-accent border-accent/20",
    image: "bg-success/10 text-success border-success/20",
    video: "bg-info/10 text-info border-info/20",
    audio: "bg-warning/10 text-warning border-warning/20",
    game: "bg-danger/10 text-danger border-danger/20",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Neuron Architecture</h1>
        <p className="text-text-secondary text-sm mt-1">gX neurons, Li centers, and mirror pairs</p>
      </div>

      {/* Network summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(networks ?? []).map(net => (
          <div key={net.id} className="omega-card p-4">
            <div className={`badge mb-3 border ${NET_COLORS[net.type] ?? "badge-muted"}`}>
              {net.type}
            </div>
            <div className="text-lg font-bold">{formatNumber(net.total_neurons)}</div>
            <div className="text-text-muted text-xs mt-0.5">neurons</div>
            <div className="mt-2 text-xs text-text-secondary">{formatNumber(net.total_knowledge)} knowledge</div>
            <div className={`mt-2 text-xs ${net.status === "active" ? "text-success" : "text-warning"}`}>
              {net.status}
            </div>
          </div>
        ))}
      </div>

      {/* Li Centers table */}
      <div className="omega-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Network className="w-4 h-4 text-accent" />
          <span className="font-medium text-sm">Li Processing Centers</span>
          <span className="badge badge-muted ml-auto">{(liCenters ?? []).length} centers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Network", "Role", "Layers", "Neurons", "Knowledge", "Avg Resonance", "Mirror"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-text-muted font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(liCenters ?? []).map(li => (
                <tr key={li.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{li.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${NET_COLORS[li.network_type] ?? "badge-muted"} text-xs`}>
                      {li.network_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${li.is_primary ? "text-accent" : "text-text-muted"}`}>
                      {li.is_primary ? "primary" : "mirror"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{li.layer_count}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatNumber(li.neuron_count)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatNumber(li.knowledge_size)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {(li.avg_resonance ?? 0).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted font-mono">
                    {li.mirror_id ? "↔ linked" : "—"}
                  </td>
                </tr>
              ))}
              {!liCenters?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text-muted text-sm">
                    No Li centers yet. Start training to grow the network.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
