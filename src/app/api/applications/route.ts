import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  extensionJsonErr,
  extensionJsonOk,
  extensionOptionsResponse,
  jsonErr,
  jsonOk,
} from "@/lib/autoapply/api-response";
import { countApplicationsForUser } from "@/lib/autoapply/db";
import { checkExtensionRateLimit } from "@/lib/autoapply/rate-limit";
import {
  applicationRowToApi,
  ApplicationCreateSchema,
} from "@/lib/autoapply/schemas";
import { requireApiSession } from "@/lib/autoapply/session-api";
import {
  captureAutoApplyApiError,
  setAutoApplySentryUser,
} from "@/lib/autoapply/sentry";
import { getSupabaseAdmin } from "@/lib/autoapply/supabase-admin";
import { verifyBearerToken } from "@/lib/autoapply/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

export async function OPTIONS(): Promise<NextResponse> {
  return extensionOptionsResponse();
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const url = new URL(req.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(
      1,
      Number.parseInt(url.searchParams.get("pageSize") ?? String(PAGE_SIZE_DEFAULT), 10) ||
        PAGE_SIZE_DEFAULT,
    ),
  );
  const status = url.searchParams.get("status")?.trim();
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("autoapply_applications")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    query = query.or(
      `company.ilike.${pattern},job_title.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return jsonErr(error.message, "db_error", 500);
  }

  const rows = data ?? [];

  return jsonOk({
    applications: rows.map(applicationRowToApi),
    page,
    pageSize,
    total: count ?? rows.length,
    hasMore: (count ?? 0) > page * pageSize,
  });
}

/** Extension: report a new application attempt */
export async function POST(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const verified = await verifyBearerToken(authHeader);

  if (!verified) {
    return extensionJsonErr("Invalid or revoked API token", "unauthorized", 401);
  }

  setAutoApplySentryUser(verified.userId);

  const rate = await checkExtensionRateLimit(verified.userId);
  if (!rate.allowed) {
    return extensionJsonErr(
      `Rate limit exceeded. Retry in ${rate.retryAfterSeconds} seconds.`,
      "rate_limited",
      429,
      { headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return extensionJsonErr("Invalid JSON body", "bad_request", 400);
  }

  try {
    const parsed = ApplicationCreateSchema.parse(body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("autoapply_applications")
      .insert({
        user_id: verified.userId,
        source: parsed.source,
        external_job_id: parsed.externalJobId ?? null,
        job_title: parsed.jobTitle,
        company: parsed.company,
        location: parsed.location ?? null,
        job_url: parsed.jobUrl ?? null,
        status: parsed.status,
        error_message: parsed.errorMessage ?? null,
        applied_at: parsed.appliedAt ?? null,
        screening_answers: parsed.screeningAnswers ?? null,
      })
      .select("*")
      .single();

    if (error) {
      captureAutoApplyApiError(error, { route: "applications:POST" });
      return extensionJsonErr(error.message, "db_error", 500);
    }

    const totalBefore = await countApplicationsForUser(verified.userId);
    const isFirst = totalBefore <= 1;

    return extensionJsonOk({
      application: applicationRowToApi(data),
      isFirstApplication: isFirst,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return extensionJsonErr(e.message, "validation_error", 400);
    }
    captureAutoApplyApiError(e, { route: "applications:POST" });
    const message = e instanceof Error ? e.message : "Failed to create application";
    return extensionJsonErr(message, "upstream_error", 500);
  }
}
