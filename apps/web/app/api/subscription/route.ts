import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { id: string; role: string };

/** GET /api/subscription — current user's active subscription + usage */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as SessionUser;
  const supabase = createClient();

  const [{ data: sub }, { data: limit }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, started_at, expires_at, plans(name, display_name, price_usd, queries_per_day, queries_per_month, networks, features)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase.rpc("check_rate_limit", { p_user_id: user.id }),
  ]);

  return NextResponse.json({
    subscription: sub ?? null,
    usage:        limit ?? null,
  });
}

/** POST /api/subscription — admin: assign plan to user */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as (SessionUser | undefined);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    target_user_id: string;
    plan_name: string;
    expires_at?: string;
  };

  const supabase = createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("name", body.plan_name)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Deactivate existing subscriptions
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("user_id", body.target_user_id)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id:    body.target_user_id,
      plan_id:    plan.id,
      status:     "active",
      expires_at: body.expires_at ?? null,
      payment_provider: "manual",
      notes:      `Assigned by admin ${user.id}`,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
