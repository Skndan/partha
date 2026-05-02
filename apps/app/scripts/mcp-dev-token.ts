import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env" });
config({ path: ".env.local" });

type CliArgs = {
  userId?: string;
  email?: string;
  clientId: string;
  workspaceSlug?: string;
  scope?: string;
};

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    clientId: "local-dev-cli",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value) {
      continue;
    }
    if (value === "--user-id") {
      args.userId = argv[i + 1];
      i += 1;
    } else if (value === "--email") {
      args.email = argv[i + 1];
      i += 1;
    } else if (value === "--client-id") {
      args.clientId = argv[i + 1] || args.clientId;
      i += 1;
    } else if (value === "--workspace-slug") {
      args.workspaceSlug = argv[i + 1];
      i += 1;
    } else if (value === "--scope") {
      args.scope = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

async function resolveUserId(input: CliArgs) {
  if (input.userId) {
    return input.userId;
  }

  if (!input.email) {
    throw new Error("Pass --user-id <id> or --email <email>");
  }

  const { db } = await import("@/lib/db/db");
  const { user } = await import("@/lib/db/schema");
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1);

  if (!row?.id) {
    throw new Error(`No user found for email: ${input.email}`);
  }

  return row.id;
}

async function main() {
  let closeDb: (() => Promise<void>) | null = null;

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "development") {
    throw new Error("mcp:token is available only in development");
  }
  try {
    const args = parseCliArgs(process.argv.slice(2));
    const userId = await resolveUserId(args);
    const redirectUri = "http://localhost:3000/mcp-callback";

    const [
      { generateCodeVerifier, toCodeChallengeS256 },
      { normalizeScopes },
      { createAuthorizationCode, exchangeAuthorizationCode, resolveWorkspaceForUser },
      dbModule,
    ] = await Promise.all([
      import("@/lib/mcp/oauth/pkce"),
      import("@/lib/mcp/oauth/scopes"),
      import("@/lib/mcp/oauth/service"),
      import("@/lib/db/db"),
    ]);
    closeDb = dbModule.closeDb;

    const scopes = normalizeScopes(args.scope);
    const workspaceId = await resolveWorkspaceForUser(userId, args.workspaceSlug);
    if (args.workspaceSlug && !workspaceId) {
      throw new Error(`Workspace not found for this user: ${args.workspaceSlug}`);
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = toCodeChallengeS256(codeVerifier);

    const code = await createAuthorizationCode({
      userId,
      clientId: args.clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: "S256",
      scopes,
      workspaceId,
    });

    const tokenResponse = await exchangeAuthorizationCode({
      clientId: args.clientId,
      code,
      redirectUri,
      codeVerifier,
    });

    if (!tokenResponse) {
      throw new Error("Failed to mint access token");
    }

    console.log(tokenResponse.accessToken);
    console.log(`export MCP_ACCESS_TOKEN="${tokenResponse.accessToken}"`);
  } finally {
    await closeDb?.().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("[mcp-token] failed", error);
  process.exit(1);
});
