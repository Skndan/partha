import { describe, expect, test } from "bun:test";

const BUILD_PLACEHOLDER_DB = "postgresql://build:build@127.0.0.1:5432/build";
const MISSING_INTEGRATION_DB_MESSAGE =
  "RUN_INTEGRATION_TESTS=1 requires a real DATABASE_URL; refusing to silently skip MCP integration tests.";

export function integrationEnabled() {
  const url = process.env.DATABASE_URL;
  const hasDatabase =
    typeof url === "string" && url !== BUILD_PLACEHOLDER_DB && !url.endsWith("/build");

  if (!hasDatabase) {
    return false;
  }

  return process.env.RUN_INTEGRATION_TESTS === "1";
}

export function validateIntegrationEnvironment() {
  if (process.env.RUN_INTEGRATION_TESTS === "1" && !integrationEnabled()) {
    throw new Error(MISSING_INTEGRATION_DB_MESSAGE);
  }
}

const integrationRequested = process.env.RUN_INTEGRATION_TESTS === "1";
const integrationReady = integrationEnabled();

export const describeIntegration = integrationReady
  ? describe
  : integrationRequested
    ? ((name: string, _fn: () => void) =>
      describe(name, () => {
        test("has a real database URL when integration tests are requested", () => {
          expect(MISSING_INTEGRATION_DB_MESSAGE).toBe("");
        });
      }))
    : describe.skip;
