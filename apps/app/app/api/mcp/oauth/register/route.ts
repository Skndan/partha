import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const ClientRegistrationSchema = z.object({
  client_name: z.string().min(1).optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  redirect_uris: z.array(z.string().url()).min(1),
  scope: z.string().optional(),
  token_endpoint_auth_method: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = ClientRegistrationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);

  return NextResponse.json(
    {
      client_id: `mcp_client_${randomUUID()}`,
      client_id_issued_at: now,
      redirect_uris: parsed.data.redirect_uris,
      grant_types: parsed.data.grant_types ?? ["authorization_code"],
      response_types: parsed.data.response_types ?? ["code"],
      scope: parsed.data.scope ?? "mcp:read workspace:read",
      token_endpoint_auth_method: "none",
      ...(parsed.data.client_name ? { client_name: parsed.data.client_name } : {}),
    },
    { status: 201 },
  );
}
