import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { jsonErr, jsonOk } from "@/lib/autoapply/api-response";
import { getSupabaseAdmin } from "@/lib/autoapply/supabase-admin";
import { requireApiSession } from "@/lib/autoapply/session-api";
import { TokenIssueSchema } from "@/lib/autoapply/schemas";
import { generateTokenMaterial } from "@/lib/autoapply/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenToListItem(row: {
  id: string;
  name: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}) {
  return {
    id: row.id,
    name: row.name,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    active: row.revoked_at === null,
  };
}

export async function GET(): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("autoapply_tokens")
    .select("id, name, last_used_at, revoked_at, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonErr(error.message, "db_error", 500);
  }

  return jsonOk({ tokens: (data ?? []).map(tokenToListItem) });
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  let body: unknown = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      body = await req.json();
    }
  } catch {
    return jsonErr("Invalid JSON body", "bad_request", 400);
  }

  try {
    const { name } = TokenIssueSchema.parse(body);
    const { raw, hash } = generateTokenMaterial();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("autoapply_tokens")
      .insert({
        user_id: session.user.id,
        token_hash: hash,
        name,
      })
      .select("id, name, created_at")
      .single();

    if (error) {
      return jsonErr(error.message, "db_error", 500);
    }

    return jsonOk({
      token: raw,
      tokenId: data.id,
      name: data.name,
      createdAt: data.created_at,
      message:
        "Copy this token now. It will not be shown again. Paste it into the Chrome extension.",
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return jsonErr(e.message, "validation_error", 400);
    }
    const message = e instanceof Error ? e.message : "Failed to issue token";
    return jsonErr(message, "db_error", 500);
  }
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return jsonErr('Missing query parameter "id"', "bad_request", 400);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("autoapply_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .is("revoked_at", null);

  if (error) {
    return jsonErr(error.message, "db_error", 500);
  }

  return jsonOk({ revoked: true, id });
}
