import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aiClient } from "@/lib/ai-client";
import type { NetworkType } from "@/types";

type SessionUser = {
  id: string;
  email: string;
  role: string;
  plan: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as SessionUser;
  const supabase = createClient();

  // ── Rate limit check ──────────────────────────────────────────────────────
  const { data: limitData } = await supabase
    .rpc("check_rate_limit", { p_user_id: user.id });

  if (limitData && !limitData.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        plan:          limitData.plan,
        queries_today: limitData.queries_today,
        limit_day:     limitData.limit_day,
        upgrade_url:   "/dashboard/upgrade",
      },
      { status: 429 },
    );
  }

  const body = await request.json() as {
    type: NetworkType;
    input: unknown;
    context?: Record<string, unknown>;
    conversation_id?: string;
    multimodal?: boolean;
  };

  // ── Ensure conversation exists ────────────────────────────────────────────
  let conversationId = body.conversation_id ?? null;
  if (!conversationId) {
    const title = typeof body.input === "string"
      ? body.input.slice(0, 60)
      : `${body.type} query`;

    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, network_type: body.type, title })
      .select("id")
      .single();
    conversationId = conv?.id ?? null;
  }

  // ── AI query ──────────────────────────────────────────────────────────────
  try {
    const truth = await aiClient.query(
      body.type,
      body.input,
      body.context,
      { multimodal: body.multimodal ?? false },
    );

    const bestRecall = truth.knowledgeRecall?.[0];

    // ── Persist full query to Supabase ────────────────────────────────────
    await supabase.from("omega_queries").insert({
      user_id:           user.id,
      conversation_id:   conversationId,
      network_type:      body.type,
      input:             typeof body.input === "string"
                           ? body.input.slice(0, 2000)
                           : JSON.stringify(body.input).slice(0, 2000),
      answer:            truth.answer,
      confidence:        truth.confidence,
      converged:         truth.converged,
      iterations:        truth.iterations,
      participating_li:  truth.participatingLi,
      mirror_agreement:  truth.mirrorAgreement,
      processing_ms:     truth.processingMs,
      recall_used:       truth.recallUsed ?? false,
      recall_score:      bestRecall?.resonanceScore ?? 0,
      recall_top_source: bestRecall?.source ?? null,
      knowledge_recall:  truth.knowledgeRecall ?? [],
      is_admin_query:    false,
      multimodal:       body.multimodal ?? false,
      tokens_estimate:   Math.ceil(
        (typeof body.input === "string" ? body.input.length : 50) / 4,
      ),
    });

    return NextResponse.json({ ...truth, conversation_id: conversationId });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
