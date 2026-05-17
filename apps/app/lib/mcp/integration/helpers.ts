import { describe } from "bun:test";

const BUILD_PLACEHOLDER_DB = "postgresql://build:build@127.0.0.1:5432/build";

export function integrationEnabled() {
  const url = process.env.DATABASE_URL;
  const hasDatabase =
    Boolean(url) && url !== BUILD_PLACEHOLDER_DB && !url.endsWith("/build");

  if (!hasDatabase) {
    return false;
  }

  return process.env.RUN_INTEGRATION_TESTS === "1";
}

export const describeIntegration = integrationEnabled()
  ? describe
  : describe.skip;
