import { describe, expect, it } from "vitest";

import {
  generateTokenMaterial,
  hashToken,
  parseBearerToken,
} from "@/lib/autoapply/tokens";

describe("generateTokenMaterial", () => {
  it("produces a raw token, matching hash, and prefix", () => {
    const { raw, hash, prefix } = generateTokenMaterial();

    expect(raw.startsWith("aa_live_")).toBe(true);
    expect(prefix).toBe(raw.slice(0, 16));
    // hash is a deterministic sha256 hex digest of the raw token
    expect(hash).toBe(hashToken(raw));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a unique token each call", () => {
    const a = generateTokenMaterial();
    const b = generateTokenMaterial();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashToken roundtrip (verification building block)", () => {
  it("accepts the matching raw token via hash compare", () => {
    const { raw, hash } = generateTokenMaterial();
    // A stored hash matches only the exact raw token that produced it.
    expect(hashToken(raw)).toBe(hash);
  });

  it("rejects a wrong token via hash compare", () => {
    const { hash } = generateTokenMaterial();
    const wrong = generateTokenMaterial();
    expect(hashToken(wrong.raw)).not.toBe(hash);
  });
});

describe("parseBearerToken", () => {
  it("extracts a valid bearer token", () => {
    const { raw } = generateTokenMaterial();
    expect(parseBearerToken(`Bearer ${raw}`)).toBe(raw);
  });

  it("returns null for a missing header", () => {
    expect(parseBearerToken(null)).toBeNull();
  });

  it("returns null when the scheme is not Bearer", () => {
    const { raw } = generateTokenMaterial();
    expect(parseBearerToken(raw)).toBeNull();
    expect(parseBearerToken(`Basic ${raw}`)).toBeNull();
  });

  it("returns null when the token lacks the expected prefix", () => {
    expect(parseBearerToken("Bearer not_a_real_token")).toBeNull();
  });
});
