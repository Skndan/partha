import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "crypto";
import { createMcpServer } from "@/lib/mcp/server";
import { describeIntegration } from "@/lib/mcp/integration/helpers";
import {
  cleanupIntegrationSeed,
  createMcpAuthExtra,
  mintMcpAccessToken,
  seedIntegrationData,
  type IntegrationSeed,
} from "@/lib/mcp/integration/fixtures";
import { closeDb } from "@/lib/db/db";

type RegisteredTool = {
  handler: (input: unknown, extra?: unknown) => Promise<unknown>;
};

type McpServerWithTools = ReturnType<typeof createMcpServer> & {
  _registeredTools: Record<string, RegisteredTool>;
};

function getTools() {
  return (createMcpServer() as McpServerWithTools)._registeredTools;
}

function authFor(seed: IntegrationSeed, scopes: string[], workspaceBound = true) {
  return createMcpAuthExtra({
    userId: seed.userId,
    workspaceId: workspaceBound ? seed.workspaceId : null,
    scopes,
  });
}

describeIntegration("mcp tools integration", () => {
  let seed: IntegrationSeed;

  beforeAll(async () => {
    seed = await seedIntegrationData(`tools-${randomUUID().slice(0, 8)}`);
  });

  afterAll(async () => {
    await cleanupIntegrationSeed(seed);
    await closeDb();
  });

  test("all 23 tools respond on happy paths", async () => {
    const tools = getTools();
    const extra = authFor(seed, [
      "mcp:read",
      "mcp:write",
      "workspace:read",
      "workspace:write",
    ]);
    const slug = seed.workspaceSlug;
    const newWorkspaceSlug = `${slug}-new`;
    const newTeamKey = "OPS";
    const newProjectKey = "WEB";
    const newMilestoneName = `Release ${randomUUID().slice(0, 6)}`;

    const ping = await tools.ping!.handler({}, extra);
    expect((ping as { content: Array<{ text: string }> }).content[0]?.text).toBe("pong");

    const whoami = (await tools.whoami!.handler({}, extra)) as {
      structuredContent: { userId: string };
    };
    expect(whoami.structuredContent.userId).toBe(seed.userId);

    const listWorkspaces = (await tools.list_workspaces!.handler({}, extra)) as {
      structuredContent: { workspaces: unknown[] };
    };
    expect(listWorkspaces.structuredContent.workspaces.length).toBeGreaterThan(0);

    await tools.get_workspace!.handler({ workspace_slug: slug }, extra);

    const createdWorkspace = (await tools.create_workspace!.handler(
      { name: "Created Via MCP", slug: newWorkspaceSlug },
      extra,
    )) as { structuredContent?: { workspace?: { slug: string } } };
    expect(createdWorkspace.structuredContent?.workspace?.slug).toBe(newWorkspaceSlug);

    await tools.update_workspace!.handler(
      { workspace_slug: slug, name: "Integration Workspace Updated" },
      extra,
    );

    await tools.list_teams!.handler({ workspace_slug: slug }, extra);
    await tools.get_team!.handler(
      { workspace_slug: slug, team_id: seed.teamId },
      extra,
    );

    const createdTeam = (await tools.create_team!.handler(
      {
        workspace_slug: slug,
        name: "Operations",
        key: newTeamKey,
      },
      extra,
    )) as { structuredContent?: { team?: { id: string } } };
    const createdTeamId = createdTeam.structuredContent?.team?.id;
    expect(createdTeamId).toBeTruthy();

    await tools.update_team!.handler(
      { workspace_slug: slug, team_id: createdTeamId!, name: "Operations Updated" },
      extra,
    );

    await tools.list_projects!.handler({ workspace_slug: slug }, extra);
    await tools.get_project!.handler(
      { workspace_slug: slug, project_id: seed.projectId },
      extra,
    );

    const createdProject = (await tools.create_project!.handler(
      {
        workspace_slug: slug,
        name: "Website",
        key: newProjectKey,
        status: "planned",
        teamId: seed.teamId,
      },
      extra,
    )) as { structuredContent?: { project?: { id: string } } };
    const createdProjectId = createdProject.structuredContent?.project?.id;
    expect(createdProjectId).toBeTruthy();

    await tools.update_project!.handler(
      {
        workspace_slug: slug,
        project_id: createdProjectId!,
        status: "active",
      },
      extra,
    );

    await tools.list_milestones!.handler({ workspace_slug: slug }, extra);
    await tools.get_milestone!.handler(
      { workspace_slug: slug, milestone_id: seed.milestoneId },
      extra,
    );

    const createdMilestone = (await tools.create_milestone!.handler(
      {
        workspace_slug: slug,
        name: newMilestoneName,
        projectId: seed.projectId,
        status: "planned",
      },
      extra,
    )) as { structuredContent?: { milestone?: { id: string } } };
    const createdMilestoneId = createdMilestone.structuredContent?.milestone?.id;
    expect(createdMilestoneId).toBeTruthy();

    await tools.update_milestone!.handler(
      {
        workspace_slug: slug,
        milestone_id: createdMilestoneId!,
        status: "in_progress",
      },
      extra,
    );

    await tools.list_issue_statuses!.handler({ workspace_slug: slug }, extra);
    const listIssues = (await tools.list_issues!.handler({ workspace_slug: slug }, extra)) as {
      structuredContent: { issues: unknown[] };
    };
    expect(listIssues.structuredContent.issues.length).toBeGreaterThan(0);

    await tools.get_issue!.handler(
      { workspace_slug: slug, issue_id: seed.issueId },
      extra,
    );

    const createdIssue = (await tools.create_issue!.handler(
      {
        workspace_slug: slug,
        title: "MCP created issue",
        status: "Todo",
        projectId: seed.projectKey,
        priority: "medium",
      },
      extra,
    )) as { structuredContent?: { issue?: { id: string } } };
    const createdIssueId = createdIssue.structuredContent?.issue?.id;
    expect(createdIssueId).toBeTruthy();

    await tools.update_issue!.handler(
      {
        workspace_slug: slug,
        issue_id: createdIssueId!,
        title: "MCP created issue (updated)",
      },
      extra,
    );
  });

  test("scope denial for issue write without mcp:write", async () => {
    const tools = getTools();
    const extra = authFor(seed, ["mcp:read", "workspace:read", "workspace:write"]);

    await expect(
      tools.create_issue!.handler(
        {
          workspace_slug: seed.workspaceSlug,
          title: "Should fail",
          status: "Todo",
          projectId: seed.projectKey,
          priority: "low",
        },
        extra,
      ),
    ).rejects.toThrow("Missing required scope: mcp:write");
  });

  test("scope denial for team write without workspace:write", async () => {
    const tools = getTools();
    const extra = authFor(seed, ["mcp:read", "mcp:write", "workspace:read"]);

    await expect(
      tools.create_team!.handler(
        {
          workspace_slug: seed.workspaceSlug,
          name: "Denied Team",
          key: "DEN",
        },
        extra,
      ),
    ).rejects.toThrow("Missing required scope: workspace:write");
  });

  test("workspace-bound token rejects other workspace slug", async () => {
    const tools = getTools();
    const token = await mintMcpAccessToken({
      userId: seed.userId,
      workspaceId: seed.workspaceId,
      scopes: ["mcp:read", "workspace:read"],
    });
    const { verifyAccessToken } = await import("@/lib/mcp/oauth/service");
    const principal = await verifyAccessToken(token);
    expect(principal).toBeTruthy();

    const extra = createMcpAuthExtra({
      userId: seed.userId,
      workspaceId: seed.workspaceId,
      scopes: ["mcp:read", "workspace:read"],
      token,
    });

    await expect(
      tools.get_workspace!.handler({ workspace_slug: "other-workspace" }, extra),
    ).rejects.toThrow("Token is restricted to a different workspace.");
  });
});
