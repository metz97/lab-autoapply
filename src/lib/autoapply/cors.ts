import { NextResponse } from "next/server";

const EXTENSION_HEADERS = "Authorization, Content-Type";

export function extensionCorsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": EXTENSION_HEADERS,
    "Access-Control-Max-Age": "86400",
  };
}

export function withExtensionCors<T extends NextResponse>(response: T): T {
  const headers = extensionCorsHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function extensionOptionsResponse(): NextResponse {
  return withExtensionCors(new NextResponse(null, { status: 204 }));
}
