import { redirect } from "next/navigation";

import { isSupabaseAuthConfigured } from "@/lib/autoapply/config";
import { createSupabaseServerClient } from "@/lib/autoapply/supabase-server";

export async function getSessionUser() {
  if (!isSupabaseAuthConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireSessionUser(redirectTo = "/login") {
  const user = await getSessionUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}
