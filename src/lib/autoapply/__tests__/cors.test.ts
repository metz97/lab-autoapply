import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";

import {
  extensionCorsHeaders,
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/autoapply/cors";

describe("extensionCorsHeaders", () => {
  it("returns the expected permissive CORS headers", () => {
    const headers = extensionCorsHeaders() as Record<string, string>;
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Methods"]).toBe(
      "GET, POST, PATCH, OPTIONS",
    );
    expect(headers["Access-Control-Allow-Headers"]).toBe(
      "Authorization, Content-Type",
    );
    expect(headers["Access-Control-Max-Age"]).toBe("86400");
  });
});

describe("withExtensionCors", () => {
  it("copies CORS headers onto an existing response", () => {
    const res = withExtensionCors(NextResponse.json({ ok: true }));
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("PATCH");
  });
});

describe("extensionOptionsResponse", () => {
  it("returns a 204 no-content preflight response", () => {
    const res = extensionOptionsResponse();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type",
    );
  });
});
