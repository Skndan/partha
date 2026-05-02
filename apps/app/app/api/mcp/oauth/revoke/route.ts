import { NextResponse } from "next/server";
import { revokeAccessToken } from "@/lib/mcp/oauth/service";
import { RevokeRequestSchema } from "@/lib/validators/mcp";

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

  const parsed = RevokeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await revokeAccessToken(parsed.data.token);
  return new NextResponse(null, { status: 200 });
}
