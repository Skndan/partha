import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, asc, eq, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { workspace, workspaceInvite, workspaceMember } from "@/lib/db/schema";
import { ModeToggle } from "@workspace/ui/components/mode-toggle";
import { Button } from "@workspace/ui/components/button";
import LogoutButton from "@/components/auth/logout-button-icon";
import { WorkspaceOnboardingForm } from "@/components/onboarding/workspace-onboarding-form";
import { PendingInvites } from "@/components/onboarding/pending-invites";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Layers } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [firstWorkspace] = await db
    .select({
      slug: workspace.slug,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(eq(workspaceMember.userId, session.user.id))
    .orderBy(asc(workspaceMember.joinedAt))
    .limit(1);

  if (firstWorkspace?.slug) {
    redirect(`/${firstWorkspace.slug}`);
  }

  const invites = session.user.email
    ? await db
      .select({
        token: workspaceInvite.token,
        role: workspaceInvite.role,
        expiresAt: workspaceInvite.expiresAt,
        workspaceName: workspace.name,
      })
      .from(workspaceInvite)
      .innerJoin(workspace, eq(workspace.id, workspaceInvite.workspaceId))
      .where(
        and(
          eq(workspaceInvite.email, session.user.email.toLowerCase()),
          isNull(workspaceInvite.acceptedAt),
        ),
      )
    : [];

  const email = session.user.email ?? session.user.id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-semibold"
          >
            <Layers className="h-5 w-5" />
            Partha Linear
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>
              Create a workspace to get your Linear-style issue tracking flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <WorkspaceOnboardingForm email={email} />
              <PendingInvites
                invites={invites.map((invite) => ({
                  token: invite.token,
                  role: invite.role,
                  expiresAt: invite.expiresAt.toISOString(),
                  workspaceName: invite.workspaceName,
                }))}
              />

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/">Back to home</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/login">Switch account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

