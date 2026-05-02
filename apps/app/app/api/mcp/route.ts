import { handleMcpHttpRequest } from "@/lib/mcp/transports/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleMcpHttpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpHttpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpHttpRequest(request);
}
