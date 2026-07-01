/**
 * No-op error-reporting shim.
 *
 * In the origin portfolio these functions wrapped @sentry/nextjs. This
 * standalone repo has no error-tracking dependency, so the call sites stay
 * unchanged while errors are logged to the console instead.
 */

export function setAutoApplySentryUser(_userId: string | undefined): void {
  // no-op (kept for API compatibility with call sites)
  void _userId;
}

export function captureAutoApplyApiError(
  error: unknown,
  context: Record<string, unknown>,
): void {
  console.error("[autoapply] API error", context, error);
}
