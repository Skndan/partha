import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AlertCircle, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { OAuthAuthorizeAccountSwitcher } from "@/components/mcp/oauth-authorize-account-switcher";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { normalizeScopes } from "@/lib/mcp/oauth/scopes";
import { AuthorizeQuerySchema } from "@/lib/validators/mcp";

function summarizeRedirectUri(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol === "cursor:") {
      return "Cursor desktop client";
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return raw;
  }
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = Object.fromEntries(
    Object.entries(resolvedSearchParams)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  const parsed = AuthorizeQuerySchema.safeParse(query);

  if (!parsed.success) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Invalid authorization request
            </CardTitle>
            <CardDescription>
              This OAuth request is missing required parameters. Start the flow again from your MCP
              client.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    const callbackUrl = new URL("/mcp/oauth/authorize", "http://localhost");
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value) {
        callbackUrl.searchParams.set(key, value);
      }
    }
    const loginUrl = `/login?callbackURL=${encodeURIComponent(`${callbackUrl.pathname}${callbackUrl.search}`)}`;
    redirect(loginUrl);
  }

  let scopes: string[] = [];
  try {
    scopes = normalizeScopes(parsed.data.scope);
  } catch {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Unsupported scope request
            </CardTitle>
            <CardDescription>
              The requesting client asked for unsupported scopes. Please review the client
              configuration and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const callbackParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value) {
      callbackParams.set(key, value);
    }
  }
  const callbackPath = `/mcp/oauth/authorize?${callbackParams.toString()}`;
  const isCursorDestination = parsed.data.redirect_uri.startsWith("cursor://");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle>Authorize MCP connection</CardTitle>
          <CardDescription>
            Partha is requesting authorization to connect with your MCP client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">{session.user.name || session.user.email}</p>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Client ID:</span> {parsed.data.client_id}
            </p>
            <p>
              <span className="font-medium">Destination:</span>{" "}
              {summarizeRedirectUri(parsed.data.redirect_uri)}
            </p>
            <p>
              <span className="font-medium">Workspace:</span>{" "}
              {parsed.data.workspace_slug ?? "All accessible workspaces"}
            </p>
            <p>
              <span className="font-medium">Scopes:</span> {scopes.join(", ")}
            </p>
          </div>

          <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
            After you click authorize, this page will hand off the OAuth code to your MCP client.
            Your operating system may prompt to open Cursor.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <OAuthAuthorizeAccountSwitcher callbackURL={callbackPath} />

          <form action="/api/mcp/oauth/authorize" method="GET" className="w-full sm:w-auto">
            <input type="hidden" name="response_type" value={parsed.data.response_type} />
            <input type="hidden" name="client_id" value={parsed.data.client_id} />
            <input type="hidden" name="redirect_uri" value={parsed.data.redirect_uri} />
            <input type="hidden" name="code_challenge" value={parsed.data.code_challenge} />
            <input
              type="hidden"
              name="code_challenge_method"
              value={parsed.data.code_challenge_method}
            />
            {parsed.data.scope ? <input type="hidden" name="scope" value={parsed.data.scope} /> : null}
            {parsed.data.workspace_slug ? (
              <input type="hidden" name="workspace_slug" value={parsed.data.workspace_slug} />
            ) : null}
            {parsed.data.state ? <input type="hidden" name="state" value={parsed.data.state} /> : null}
            <input type="hidden" name="approve" value="1" />
            <Button type="submit" className="w-full sm:w-auto">
              {isCursorDestination ? "Authorize and Open Cursor" : "Authorize and Continue"}
              <ExternalLink className="size-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
