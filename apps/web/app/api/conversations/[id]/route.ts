import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { id: string; role: string };
type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/conversations/[id] — messages in a conversation */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("omega_queries")
    .select("id, input, answer, confidence, converged, iterations, mirror_agreement, processing_ms, recall_used, recall_score, recall_top_source, knowledge_recall, network_type, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE /api/conversations/[id] — delete conversation + all its queries */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const supabase = createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.from("conversations").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
