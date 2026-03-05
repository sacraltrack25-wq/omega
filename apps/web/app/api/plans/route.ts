import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/plans — public list of plans */
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, display_name, description, price_usd, queries_per_day, queries_per_month, networks, features")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
