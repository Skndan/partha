import { describe, expect, test } from "bun:test";
import { AuthorizeQuerySchema, TokenRequestSchema } from "@/lib/validators/mcp";

describe("mcp oauth validators", () => {
  test("accepts valid authorize query", () => {
    const parsed = AuthorizeQuerySchema.safeParse({
      response_type: "code",
      client_id: "client-123",
      redirect_uri: "http://127.0.0.1:57123/callback",
      scope: "mcp:read workspace:read",
      code_challenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~a",
      code_challenge_method: "S256",
    });

    expect(parsed.success).toBeTrue();
  });

  test("rejects non-loopback http redirect uri", () => {
    const parsed = AuthorizeQuerySchema.safeParse({
      response_type: "code",
      client_id: "client-123",
      redirect_uri: "http://example.com/callback",
      code_challenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~a",
      code_challenge_method: "S256",
    });

    expect(parsed.success).toBeFalse();
  });

  test("accepts cursor native callback redirect uri", () => {
    const parsed = AuthorizeQuerySchema.safeParse({
      response_type: "code",
      client_id: "client-123",
      redirect_uri: "cursor://anysphere.cursor-mcp/oauth/callback",
      code_challenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~a",
      code_challenge_method: "S256",
    });

    expect(parsed.success).toBeTrue();
  });

  test("accepts token request payload", () => {
    const parsed = TokenRequestSchema.safeParse({
      grant_type: "authorization_code",
      client_id: "client-123",
      code: "auth-code",
      redirect_uri: "https://example.com/callback",
      code_verifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~a",
    });

    expect(parsed.success).toBeTrue();
  });

  test("accepts token request with cursor native callback redirect uri", () => {
    const parsed = TokenRequestSchema.safeParse({
      grant_type: "authorization_code",
      client_id: "client-123",
      code: "auth-code",
      redirect_uri: "cursor://anysphere.cursor-mcp/oauth/callback",
      code_verifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~a",
    });

    expect(parsed.success).toBeTrue();
  });
});
