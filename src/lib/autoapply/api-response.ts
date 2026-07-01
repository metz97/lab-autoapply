import { NextResponse } from "next/server";

import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/autoapply/cors";

export { extensionOptionsResponse };

export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error: string; code?: string };

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json({ ok: true, ...data } satisfies ApiOk<T>, init);
}

export function jsonErr(
  error: string,
  code: string,
  status: number,
  init?: ResponseInit,
): NextResponse<ApiErr> {
  return NextResponse.json({ ok: false, error, code } satisfies ApiErr, {
    status,
    ...init,
  });
}

export function extensionJsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
): NextResponse {
  return withExtensionCors(jsonOk(data, init));
}

export function extensionJsonErr(
  error: string,
  code: string,
  status: number,
  init?: ResponseInit,
): NextResponse<ApiErr> {
  return withExtensionCors(jsonErr(error, code, status, init));
}
