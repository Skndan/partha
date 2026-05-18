import { afterEach, describe, expect, test } from "bun:test";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS;

async function loadHelpers() {
  const cacheKey = `?case=${Date.now()}-${Math.random()}`;
  return import(`./helpers${cacheKey}`);
}

describe("mcp integration test helpers", () => {
  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.RUN_INTEGRATION_TESTS = originalRunIntegrationTests;
  });

  test("registers a failing environment check when integration tests are explicitly requested without a real database", async () => {
    process.env.RUN_INTEGRATION_TESTS = "1";
    process.env.DATABASE_URL = "postgresql://build:build@127.0.0.1:5432/build";

    const helpers = await loadHelpers();

    expect(helpers.integrationEnabled()).toBeFalse();
    expect(helpers.validateIntegrationEnvironment).toThrow(
      "RUN_INTEGRATION_TESTS=1 requires a real DATABASE_URL",
    );
  });
});
