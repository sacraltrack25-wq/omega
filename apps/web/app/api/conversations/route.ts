import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { id: string };

/** GET /api/conversations — list user's conversations */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, network_type, message_count, last_message_at, created_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
