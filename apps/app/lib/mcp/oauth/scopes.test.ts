import { describe, expect, test } from "bun:test";
import { normalizeScopes } from "@/lib/mcp/oauth/scopes";

describe("normalizeScopes", () => {
  test("returns defaults when scope is missing", () => {
    expect(normalizeScopes()).toEqual(["mcp:read", "workspace:read"]);
  });

  test("parses custom valid scopes", () => {
    expect(normalizeScopes("workspace:write mcp:write workspace:read mcp:read")).toEqual([
      "workspace:write",
      "mcp:write",
      "workspace:read",
      "mcp:read",
    ]);
  });

  test("rejects unsupported scopes", () => {
    expect(() => normalizeScopes("workspace:admin")).toThrow("Unsupported scope");
  });
});
