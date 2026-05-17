import { describe, expect, test } from "bun:test";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, closeDb } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  revokeAccessToken,
  verifyAccessToken,
} from "@/lib/mcp/oauth/service";
import { generateCodeVerifier, toCodeChallengeS256 } from "@/lib/mcp/oauth/pkce";
import { describeIntegration } from "@/lib/mcp/integration/helpers";

describeIntegration("mcp oauth integration", () => {
  test("authorization code exchange and revoke", async () => {
    const userId = randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: "OAuth Integration",
      email: `oauth-${userId}@test.local`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    const clientId = "oauth-integration";
    const redirectUri = "http://127.0.0.1:3000/callback";
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = toCodeChallengeS256(codeVerifier);

    const code = await createAuthorizationCode({
      userId,
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: "S256",
      scopes: ["mcp:read", "workspace:read"],
    });

    const wrongExchange = await exchangeAuthorizationCode({
      clientId,
      code,
      redirectUri,
      codeVerifier: generateCodeVerifier(),
    });
    expect(wrongExchange).toBeNull();

    const tokenResponse = await exchangeAuthorizationCode({
      clientId,
      code,
      redirectUri,
      codeVerifier,
    });
    expect(tokenResponse?.accessToken).toBeTruthy();

    const principal = await verifyAccessToken(tokenResponse!.accessToken);
    expect(principal?.userId).toBe(userId);

    await revokeAccessToken(tokenResponse!.accessToken);
    expect(await verifyAccessToken(tokenResponse!.accessToken)).toBeNull();

    await db.delete(user).where(eq(user.id, userId));
    await closeDb();
  });
});
