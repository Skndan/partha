import { describe, expect, test } from "bun:test";
import { generateCodeVerifier, toCodeChallengeS256 } from "@/lib/mcp/oauth/pkce";
import { createHash } from "crypto";

describe("mcp oauth pkce", () => {
  test("generateCodeVerifier returns base64url string", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThan(40);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("toCodeChallengeS256 matches SHA-256 base64url", () => {
    const verifier = "test-verifier-value";
    const expected = createHash("sha256").update(verifier, "utf8").digest("base64url");
    expect(toCodeChallengeS256(verifier)).toBe(expected);
  });

  test("different verifiers produce different challenges", () => {
    const a = toCodeChallengeS256(generateCodeVerifier());
    const b = toCodeChallengeS256(generateCodeVerifier());
    expect(a).not.toBe(b);
  });
});
