import { AlertCircle } from "lucide-react";
import { OAuthConnectedHandoff } from "@/components/mcp/oauth-connected-handoff";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export default async function OAuthConnectedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const handoff = resolvedSearchParams.handoff;
  const handoffUrl = Array.isArray(handoff) ? handoff[0] : handoff;

  if (!handoffUrl) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Missing callback details
            </CardTitle>
            <CardDescription>
              We could not complete the OAuth handoff. Start authorization again from your MCP
              client.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connecting to Cursor</CardTitle>
          <CardDescription>
            We are handing authorization back to your MCP client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthConnectedHandoff handoffUrl={handoffUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
