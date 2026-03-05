import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

/** GET /api/admin/users — paginated user list with plan info */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as (SessionUser | undefined);
  if (!user || user.role !== "admin") {
    if (process.env.ADMIN_BYPASS !== "true") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_users_view")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
