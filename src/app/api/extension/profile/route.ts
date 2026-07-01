import { NextResponse } from "next/server";

import {
  extensionJsonErr,
  extensionJsonOk,
  extensionOptionsResponse,
} from "@/lib/autoapply/api-response";
import { getProfileByUserId } from "@/lib/autoapply/db";
import { checkExtensionRateLimit } from "@/lib/autoapply/rate-limit";
import { profileRowToApi } from "@/lib/autoapply/schemas";
import {
  captureAutoApplyApiError,
  setAutoApplySentryUser,
} from "@/lib/autoapply/sentry";
import { verifyBearerToken } from "@/lib/autoapply/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<NextResponse> {
  return extensionOptionsResponse();
}

export async function GET(req: Request): Promise<NextResponse> {
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

  try {
    const row = await getProfileByUserId(verified.userId);
    if (!row) {
      return extensionJsonErr(
        "Profile not configured. Complete your profile in the dashboard settings first.",
        "profile_missing",
        404,
      );
    }

    return extensionJsonOk({ profile: profileRowToApi(row) });
  } catch (e) {
    captureAutoApplyApiError(e, { route: "extension/profile" });
    const message = e instanceof Error ? e.message : "Failed to load profile";
    return extensionJsonErr(message, "upstream_error", 500);
  }
}
