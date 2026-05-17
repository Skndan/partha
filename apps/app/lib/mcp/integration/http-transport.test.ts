import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "crypto";
import {
  handleMcpHttpRequest,
  resetMcpHttpSessionsForTests,
} from "@/lib/mcp/transports/http";
import { describeIntegration } from "@/lib/mcp/integration/helpers";
import {
  cleanupIntegrationSeed,
  mintMcpAccessToken,
  seedIntegrationData,
  type IntegrationSeed,
} from "@/lib/mcp/integration/fixtures";
import { closeDb } from "@/lib/db/db";

const INIT_BODY = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "integration-http", version: "1.0.0" },
  },
};

describeIntegration("mcp http transport integration", () => {
  let seed: IntegrationSeed;
  let accessToken: string;

  beforeAll(async () => {
    resetMcpHttpSessionsForTests();
    seed = await seedIntegrationData(`http-${randomUUID().slice(0, 8)}`);
    accessToken = await mintMcpAccessToken({ userId: seed.userId });
  });

  afterAll(async () => {
    resetMcpHttpSessionsForTests();
    await cleanupIntegrationSeed(seed);
    await closeDb();
  });

  test("initialize accepts a real bearer access token", async () => {
    const response = await handleMcpHttpRequest(
      new Request("http://localhost:4000/api/mcp", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(INIT_BODY),
      }),
    );

    expect(response.status).not.toBe(401);
    expect(response.headers.get("mcp-session-id")).toBeTruthy();
  });

});
