import { describe, expect, test } from "bun:test";
import { createOpaqueToken, decryptText, encryptText, sha256Hex } from "@/lib/mcp/oauth/crypto";

describe("mcp oauth crypto helpers", () => {
  test("encrypt/decrypt roundtrip", () => {
    const input = "token-value-123";
    const encrypted = encryptText(input);

    expect(encrypted).not.toBe(input);
    expect(decryptText(encrypted)).toBe(input);
  });

  test("sha256 is deterministic", () => {
    const first = sha256Hex("abc");
    const second = sha256Hex("abc");
    const third = sha256Hex("abcd");

    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });

  test("opaque token uses prefix", () => {
    const token = createOpaqueToken("mcp_at");
    expect(token.startsWith("mcp_at_")).toBeTrue();
  });
});
