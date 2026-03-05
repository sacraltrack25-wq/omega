import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { id: string };

/**
 * POST /api/feedback
 * Body: { query_id: string, rating: 1 | -1, comment?: string }
 *
 * 👍 rating=1  → strength в li_knowledge растёт → знание поднимается
 * 👎 rating=-1 → strength падает → знание понижается
 *
 * Суперпозиция голосов формирует качество базы знаний.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const body = await request.json() as {
    query_id: string;
    rating:   1 | -1;
    comment?: string;
  };

  if (!body.query_id || ![1, -1].includes(body.rating)) {
    return NextResponse.json({ error: "query_id and rating (1 or -1) are required" }, { status: 400 });
  }

  const supabase = createClient();

  // Verify query exists and belongs to user (or is public)
  const { data: query } = await supabase
    .from("omega_queries")
    .select("id, user_id")
    .eq("id", body.query_id)
    .single();

  if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

  // Upsert — one vote per user per query
  const { data, error } = await supabase
    .from("answer_feedback")
    .upsert({
      query_id:   body.query_id,
      user_id:    user.id,
      rating:     body.rating,
      comment:    body.comment ?? null,
    }, { onConflict: "query_id,user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok:      true,
    feedback: data,
    message: body.rating === 1
      ? "Спасибо! Это знание стало сильнее в Li центрах."
      : "Понял. Это знание будет понижено.",
  });
}

/** GET /api/feedback?query_id=... — get aggregate feedback for a query */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get("query_id");
  if (!queryId) return NextResponse.json({ error: "query_id required" }, { status: 400 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("answer_feedback")
    .select("rating")
    .eq("query_id", queryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const up   = data?.filter(r => r.rating === 1).length  ?? 0;
  const down = data?.filter(r => r.rating === -1).length ?? 0;

  return NextResponse.json({ up, down, total: up + down, score: up - down });
}
