import type { User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import { jsonErr, type ApiErr } from "@/lib/autoapply/api-response";
import { createSupabaseServerClient } from "@/lib/autoapply/supabase-server";
import { isSupabaseConfigured } from "@/lib/autoapply/supabase-admin";

export type ApiSessionResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse<ApiErr> };

export async function requireApiSession(): Promise<ApiSessionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: jsonErr(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        "not_configured",
        503,
      ),
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return {
      ok: false,
      response: jsonErr(
        "Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        "auth_not_configured",
        503,
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: jsonErr("Unauthorized. Sign in first.", "unauthorized", 401),
    };
  }

  return { ok: true, user };
}
