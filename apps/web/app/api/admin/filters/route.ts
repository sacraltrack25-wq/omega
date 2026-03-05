import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionUser = { role: string };

function isAdmin(session: { user?: unknown } | null) {
  const u = session?.user as SessionUser | undefined;
  return u?.role === "admin" || process.env.ADMIN_BYPASS === "true";
}

/** GET /api/admin/filters — list all filters */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("filters")
    .select("*")
    .order("priority");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST /api/admin/filters — create filter */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user    = session?.user as ({ id?: string } | undefined);
  const body    = await request.json() as {
    name: string;
    description?: string;
    type: string;
    config: Record<string, unknown>;
    network_type?: string;
    priority?: number;
    is_active?: boolean;
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("filters")
    .insert({
      name:         body.name,
      description:  body.description ?? "",
      type:         body.type,
      config:       body.config,
      network_type: body.network_type ?? null,
      priority:     body.priority ?? 100,
      is_active:    body.is_active ?? true,
      created_by:   user?.id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hot-reload filters in AI Engine
  await reloadEngineFilters();

  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/admin/filters — update filter */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as { id: string } & Record<string, unknown>;
  const { id, ...updates } = body;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("filters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await reloadEngineFilters();
  return NextResponse.json(data);
}

/** DELETE /api/admin/filters?id=... — delete filter */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase.from("filters").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await reloadEngineFilters();
  return NextResponse.json({ ok: true });
}

async function reloadEngineFilters() {
  try {
    const url    = process.env.AI_ENGINE_URL ?? "http://localhost:4000";
    const apiKey = process.env.AI_ENGINE_API_KEY ?? "";
    await fetch(`${url}/filters/reload`, {
      method:  "POST",
      headers: { "x-api-key": apiKey },
    });
  } catch {
    // Non-critical — filters will reload on next TTL expiry
  }
}
