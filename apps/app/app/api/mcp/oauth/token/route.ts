import { NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/mcp/oauth/service";
import { TokenRequestSchema } from "@/lib/validators/mcp";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  let payload: Record<string, string> = {};
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    payload = Object.fromEntries(
      Array.from(form.entries()).map(([key, value]) => [key, String(value)]),
    );
  } else {
    const body = await request.json().catch(() => ({}));
    payload = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value ?? ""),
      ]),
    );
  }

  const parsed = TokenRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const tokenResponse = await exchangeAuthorizationCode({
    clientId: parsed.data.client_id,
    code: parsed.data.code,
    redirectUri: parsed.data.redirect_uri,
    codeVerifier: parsed.data.code_verifier,
  });
  if (!tokenResponse) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Code invalid, used, or expired" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    access_token: tokenResponse.accessToken,
    token_type: tokenResponse.tokenType,
    expires_in: tokenResponse.expiresIn,
    scope: tokenResponse.scope,
  });
}
