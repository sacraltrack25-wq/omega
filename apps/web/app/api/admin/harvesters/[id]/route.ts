import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

/** DELETE /api/admin/harvesters/[id] — удалить задание из истории */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (process.env.ADMIN_BYPASS !== "true") {
    const session = await getServerSession(authOptions);
    const user = session?.user as (SessionUser | undefined);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase
    .from("harvester_jobs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
