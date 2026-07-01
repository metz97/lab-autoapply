import type { AutoApplyProfileRow } from "@/lib/autoapply/schemas";
import { getSupabaseAdmin } from "@/lib/autoapply/supabase-admin";

export async function getProfileByUserId(
  userId: string,
): Promise<AutoApplyProfileRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("autoapply_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as AutoApplyProfileRow | null;
}

export async function upsertProfile(
  userId: string,
  patch: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin_url?: string | null;
    current_title?: string | null;
    years_experience?: number | null;
    resume_url?: string | null;
    default_answers?: Record<string, string>;
  },
): Promise<AutoApplyProfileRow> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("autoapply_profiles")
    .upsert(
      {
        user_id: userId,
        ...patch,
        updated_at: now,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as AutoApplyProfileRow;
}

export async function countApplicationsForUser(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("autoapply_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
