import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  issue,
  project,
  team,
  workspace,
  workspaceMember,
} from "@/lib/db/schema";

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [memberWorkspace] = await db
    .select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(
      and(eq(workspaceMember.userId, session.user.id), eq(workspace.slug, slug)),
    )
    .limit(1);

  if (!memberWorkspace) {
    redirect("/onboarding");
  }

  const [teamCount, projectCount, issueCount] = await Promise.all([
    db
      .select({ value: count() })
      .from(team)
      .where(eq(team.workspaceId, memberWorkspace.workspaceId)),
    db
      .select({ value: count() })
      .from(project)
      .where(eq(project.workspaceId, memberWorkspace.workspaceId)),
    db
      .select({ value: count() })
      .from(issue)
      .where(eq(issue.workspaceId, memberWorkspace.workspaceId)),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          {/* <p className="mt-2 text-sm text-muted-foreground">
            Workspace:{" "}
            <span className="font-medium text-foreground">{memberWorkspace.workspaceName}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Role: <span className="capitalize">{memberWorkspace.role}</span>
          </p> */}
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-base font-medium">Workspace Overview</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Teams</p>
            <p className="mt-1 text-2xl font-semibold">{teamCount[0]?.value ?? 0}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Projects</p>
            <p className="mt-1 text-2xl font-semibold">{projectCount[0]?.value ?? 0}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Issues</p>
            <p className="mt-1 text-2xl font-semibold">{issueCount[0]?.value ?? 0}</p>
          </div>
        </div>
      </div>
    </>
  );
}

