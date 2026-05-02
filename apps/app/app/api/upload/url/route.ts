import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { getSignedUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_EXPIRY = 3600;
const MAX_EXPIRY = 86400;

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key || key.trim() === "") {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const prefix = `uploads/${session.user.id}/`;
  if (!key.startsWith(prefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = url.searchParams.get("expiresIn");
  const parsed = raw !== null ? Number(raw) : DEFAULT_EXPIRY;
  const expirySeconds =
    Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_EXPIRY
      ? Math.floor(parsed)
      : DEFAULT_EXPIRY;

  try {
    const signedUrl = await getSignedUrl(key, expirySeconds);
    return NextResponse.json({ url: signedUrl, expiresIn: expirySeconds });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("R2 storage is not configured")) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }
}
