import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createAuthorizationCode, resolveWorkspaceForUser } from "@/lib/mcp/oauth/service";
import { normalizeScopes } from "@/lib/mcp/oauth/scopes";
import { AuthorizeQuerySchema } from "@/lib/validators/mcp";

function buildRedirect(baseUri: string, params: Record<string, string | undefined>) {
  const url = new URL(baseUri);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = Object.fromEntries(requestUrl.searchParams.entries());
  const parsed = AuthorizeQuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (requestUrl.searchParams.get("approve") !== "1") {
    const consentUrl = new URL("/mcp/oauth/authorize", request.url);
    for (const [key, value] of requestUrl.searchParams.entries()) {
      consentUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(consentUrl);
  }

  let scopes: string[];
  try {
    scopes = normalizeScopes(parsed.data.scope);
  } catch (error) {
    return NextResponse.json(
      { error: "invalid_scope", error_description: (error as Error).message },
      { status: 400 },
    );
  }

  const workspaceId = await resolveWorkspaceForUser(
    session.user.id,
    parsed.data.workspace_slug,
  );
  if (parsed.data.workspace_slug && !workspaceId) {
    return NextResponse.json(
      { error: "invalid_target", error_description: "Unknown workspace for user" },
      { status: 400 },
    );
  }

  const code = await createAuthorizationCode({
    userId: session.user.id,
    clientId: parsed.data.client_id,
    redirectUri: parsed.data.redirect_uri,
    codeChallenge: parsed.data.code_challenge,
    codeChallengeMethod: parsed.data.code_challenge_method,
    scopes,
    workspaceId,
  });

  const callbackUrl = buildRedirect(parsed.data.redirect_uri, {
    code,
    state: parsed.data.state,
  });

  if (parsed.data.redirect_uri.startsWith("cursor://")) {
    const handoffUrl = new URL("/mcp/oauth/connected", request.url);
    handoffUrl.searchParams.set("handoff", callbackUrl);
    return NextResponse.redirect(handoffUrl);
  }

  return NextResponse.redirect(callbackUrl);
}
