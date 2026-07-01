import { describe, expect, it } from "vitest";

import {
  extensionJsonErr,
  extensionJsonOk,
  extensionOptionsResponse,
  jsonErr,
  jsonOk,
} from "@/lib/autoapply/api-response";

describe("jsonOk", () => {
  it("returns a 200 response with ok:true and merged data", async () => {
    const res = jsonOk({ profile: { id: "1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, profile: { id: "1" } });
  });

  it("honors a custom status via init", async () => {
    const res = jsonOk({ created: true }, { status: 201 });
    expect(res.status).toBe(201);
  });
});

describe("jsonErr", () => {
  it("returns the given status with ok:false, error, and code", async () => {
    const res = jsonErr("Nope", "unauthorized", 401);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "Nope", code: "unauthorized" });
  });
});

describe("extension CORS helpers", () => {
  it("extensionOptionsResponse is a 204 with CORS headers", () => {
    const res = extensionOptionsResponse();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
      "Authorization",
    );
  });

  it("extensionJsonOk sets CORS headers on a success body", async () => {
    const res = extensionJsonOk({ profile: null });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("extensionJsonErr sets CORS headers on an error body", async () => {
    const res = extensionJsonErr("bad", "unauthorized", 401);
    expect(res.status).toBe(401);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "bad", code: "unauthorized" });
  });
});
