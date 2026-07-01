import { createHash, randomBytes } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/autoapply/supabase-admin";

const TOKEN_PREFIX = "aa_live_";

export type IssuedToken = {
  raw: string;
  hash: string;
  prefix: string;
};

export function generateTokenMaterial(): IssuedToken {
  const secret = randomBytes(32).toString("base64url");
  const raw = `${TOKEN_PREFIX}${secret}`;
  const hash = hashToken(raw);
  return { raw, hash, prefix: raw.slice(0, 16) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  return token;
}

export type VerifiedToken = {
  userId: string;
  tokenId: string;
};

export async function verifyBearerToken(
  authHeader: string | null,
): Promise<VerifiedToken | null> {
  const raw = parseBearerToken(authHeader);
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("autoapply_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;

  await supabase
    .from("autoapply_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id, tokenId: data.id };
}
