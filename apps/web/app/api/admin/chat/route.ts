/**
 * Admin Chat API — direct AI engine access for testing.
 * Saves all admin queries to omega_queries with is_admin_query=true.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aiClient } from "@/lib/ai-client";
import type { NetworkType } from "@/types";

const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"; // sentinel for bypass mode

export async function POST(request: Request) {
  const bypass = process.env.ADMIN_BYPASS === "true";

  let userId = ADMIN_USER_ID;

  if (!bypass) {
    const key = request.headers.get("x-admin-key");
    if (!key || key !== process.env.AI_ENGINE_API_KEY) {
      // Try NextAuth session
      const session = await getServerSession(authOptions);
      const user = session?.user as ({ id: string; role: string }) | undefined;
      if (!user?.id || user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    }
  }

  let body: { type?: NetworkType; input?: unknown; context?: Record<string, unknown>; multimodal?: boolean };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type = "text", input, context, multimodal = false } = body;

  if (input === undefined || input === "") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  try {
    const truth = await aiClient.query(type, input, context, { multimodal });

    // Save all queries (admin + user) for analytics when Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient();
      const bestRecall = truth.knowledgeRecall?.[0];

      await supabase.from("omega_queries").insert({
        user_id:           userId,
        network_type:      type,
        input:             typeof input === "string"
                             ? input.slice(0, 2000)
                             : JSON.stringify(input).slice(0, 2000),
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
        is_admin_query:    true,
        multimodal,
      }).then(() => null, () => null); // non-blocking, don't fail query on DB error
    }

    return NextResponse.json(truth);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
