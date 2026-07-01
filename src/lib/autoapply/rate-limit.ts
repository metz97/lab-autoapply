import { checkRateLimit, isRateLimitConfigured } from "@/lib/rate-limit";

/** No-ops (always allowed) when Upstash Redis env is not configured. */
export async function checkExtensionRateLimit(userId: string) {
  if (!isRateLimitConfigured()) {
    return { allowed: true as const };
  }

  const limit = readEnvInt("AUTOAPPLY_EXTENSION_RATE_LIMIT_MAX", 120);
  const windowMs = readEnvInt(
    "AUTOAPPLY_EXTENSION_RATE_LIMIT_WINDOW_MS",
    3_600_000,
  );

  return checkRateLimit(`autoapply:ext:${userId}`, {
    limit,
    windowMs,
    prefix: "autoapply:ext",
  });
}

function readEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
