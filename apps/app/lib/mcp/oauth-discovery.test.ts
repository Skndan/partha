import { describe, expect, test } from "bun:test";

describe("mcp oauth discovery (no database)", () => {
  test("authorization server metadata includes token endpoint", async () => {
    const { GET } = await import("@/app/.well-known/oauth-authorization-server/route");
    const response = await GET(
      new Request("http://localhost:4000/.well-known/oauth-authorization-server"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { token_endpoint?: string; scopes_supported?: string[] };
    expect(body.token_endpoint).toContain("/api/mcp/oauth/token");
    expect(body.scopes_supported).toContain("mcp:read");
  });
});
