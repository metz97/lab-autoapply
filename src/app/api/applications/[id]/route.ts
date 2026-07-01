import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  extensionJsonErr,
  extensionJsonOk,
  extensionOptionsResponse,
} from "@/lib/autoapply/api-response";
import { checkExtensionRateLimit } from "@/lib/autoapply/rate-limit";
import {
  applicationRowToApi,
  ApplicationPatchSchema,
} from "@/lib/autoapply/schemas";
import {
  captureAutoApplyApiError,
  setAutoApplySentryUser,
} from "@/lib/autoapply/sentry";
import { getSupabaseAdmin } from "@/lib/autoapply/supabase-admin";
import { verifyBearerToken } from "@/lib/autoapply/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<NextResponse> {
  return extensionOptionsResponse();
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
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
    const parsed = ApplicationPatchSchema.parse(body);
    const patch: Record<string, unknown> = {};

    if (parsed.status !== undefined) patch.status = parsed.status;
    if (parsed.errorMessage !== undefined) patch.error_message = parsed.errorMessage;
    if (parsed.appliedAt !== undefined) patch.applied_at = parsed.appliedAt;
    if (parsed.screeningAnswers !== undefined) {
      patch.screening_answers = parsed.screeningAnswers;
    }

    if (Object.keys(patch).length === 0) {
      return extensionJsonErr("No fields to update", "bad_request", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("autoapply_applications")
      .update(patch)
      .eq("id", id)
      .eq("user_id", verified.userId)
      .select("*")
      .maybeSingle();

    if (error) {
      captureAutoApplyApiError(error, { route: "applications:PATCH", id });
      return extensionJsonErr(error.message, "db_error", 500);
    }

    if (!data) {
      return extensionJsonErr("Application not found", "not_found", 404);
    }

    return extensionJsonOk({ application: applicationRowToApi(data) });
  } catch (e) {
    if (e instanceof ZodError) {
      return extensionJsonErr(e.message, "validation_error", 400);
    }
    captureAutoApplyApiError(e, { route: "applications:PATCH", id });
    const message = e instanceof Error ? e.message : "Failed to update application";
    return extensionJsonErr(message, "upstream_error", 500);
  }
}
