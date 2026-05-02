import { randomUUID } from "crypto";
import { Readable } from "node:stream";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function sanitizeFilename(name: string): string {
  const base = name
    .replace(/[/\\]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);
  return base || "file";
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Missing or empty file" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  const storageKey = `uploads/${session.user.id}/${randomUUID()}-${sanitizeFilename(file.name)}`;

  try {
    const nodeStream = Readable.fromWeb(
      file.stream() as Parameters<typeof Readable.fromWeb>[0]
    );
    await uploadFile(storageKey, nodeStream, mime);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("R2 storage is not configured")) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({ storageKey });
}
