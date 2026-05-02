import { NextResponse } from "next/server";
import { MCP_OAUTH_SCOPES } from "@/lib/mcp/constants";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: MCP_OAUTH_SCOPES,
  });
}
