import type React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";

import { Header } from "@/components/layout/site-header";
import { Main } from "@/components/layout/main";
import { ModeToggle } from "@workspace/ui/components/mode-toggle";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";
import { LayoutProvider } from "@/context/layout-provider";
import { auth } from "@/lib/auth/auth";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceRealtimeListener } from "@/components/linear/workspace-realtime-listener";

import { db } from "@/lib/db/db";
import {
  team,
  workspace,
  workspaceMember,
} from "@/lib/db/schema";

export default async function StateLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const workspaces = await db
    .select({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(eq(workspaceMember.userId, session.user.id))
    .orderBy(asc(workspaceMember.joinedAt));

  if (!workspaces.length) {
    redirect("/onboarding");
  }

  const activeWorkspace = workspaces.find((item) => item.slug === slug);
  if (!activeWorkspace) {
    redirect(`/${workspaces[0]?.slug}`);
  }

  const teams = await db
    .select({
      key: team.key,
      name: team.name,
    })
    .from(team)
    .where(eq(team.workspaceId, activeWorkspace.id))
    .orderBy(asc(team.name));

  const defaultOpen = getCookie("sidebar_state") !== "false";

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? undefined,
          }}
          workspaceMenu={{
            activeSlug: activeWorkspace.slug,
            workspaces: workspaces.map((item) => ({
              slug: item.slug,
              name: item.name,
            })),
            teams,
          }}
        />
        <SidebarInset
          className={cn(
            "@container/content",
            "has-data-[layout=fixed]:h-svh",
          )}
        >
          <Header fixed>
            {/* <Search
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="text-sm text-muted-foreground">{activeWorkspace.name}</div> */}
            <div className="ms-auto flex items-center gap-4">
              <ModeToggle />
            </div>
          </Header>
          <Main fixed>{children}</Main>
          <WorkspaceRealtimeListener slug={activeWorkspace.slug} />
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}

