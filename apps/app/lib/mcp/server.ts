import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  activityEvent,
  issue,
  issueAssignee,
  issueLabel,
  issueLabelLink,
  issueRelation,
  issueStatus,
  milestone,
  project,
  team,
  workspace,
  workspaceMember,
} from "../db/schema";
import {
  CreateIssueSchema,
  CreateMilestoneSchema,
  CreateProjectSchema,
  CreateTeamSchema,
  UpdateIssueSchema,
  UpdateMilestoneSchema,
  UpdateProjectSchema,
} from "../validators/linear";
import { CreateWorkspaceSchema } from "../validators/workspace";
import { listAuthorizedWorkspaces, requireMcpAuth } from "./auth-context";
import { MCP_SERVER_INFO } from "./constants";

function textContent(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

function toolTextResult(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    structuredContent,
  };
}

function hasScope(scopes: string[] | undefined, requiredScope: string) {
  return Boolean(scopes?.includes(requiredScope));
}

function requireScope(scopes: string[] | undefined, requiredScope: string) {
  if (!hasScope(scopes, requiredScope)) {
    throw new Error(`Missing required scope: ${requiredScope}`);
  }
}

const PaginationInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
    cursor: z.string().trim().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    page: z.number().int().min(1).optional(),
  })
  .strict();

const ListWorkspacesInputSchema = z
  .object({
    ...PaginationInputSchema.shape,
    query: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const WorkspaceSlugInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
  })
  .strict();

const GetWorkspaceInputSchema = WorkspaceSlugInputSchema;

const CreateWorkspaceToolInputSchema = CreateWorkspaceSchema.strict();

const UpdateWorkspaceToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    name: CreateWorkspaceSchema.shape.name.optional(),
    slug: CreateWorkspaceSchema.shape.slug.optional(),
  })
  .strict()
  .refine((value) => value.name !== undefined || value.slug !== undefined, {
    message: "At least one update field is required.",
  });

const ListTeamsInputSchema = z
  .object({
    ...PaginationInputSchema.shape,
    workspace_slug: z.string().trim().min(1).optional(),
    query: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const GetTeamInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    team_id: z.string().trim().min(1),
  })
  .strict();

const CreateTeamToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    ...CreateTeamSchema.shape,
  })
  .strict();

const UpdateTeamToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    team_id: z.string().trim().min(1),
    name: CreateTeamSchema.shape.name.optional(),
    key: CreateTeamSchema.shape.key.optional(),
    description: z.string().max(500).optional().nullable(),
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined || value.key !== undefined || value.description !== undefined,
    {
      message: "At least one update field is required.",
    },
  );

const ListProjectsInputSchema = z
  .object({
    ...PaginationInputSchema.shape,
    workspace_slug: z.string().trim().min(1).optional(),
    team_id: z.string().trim().min(1).optional(),
    status: z.enum(["planned", "active", "completed", "archived"]).optional(),
    query: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const GetProjectInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    project_id: z.string().trim().min(1),
  })
  .strict();

const CreateProjectToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    ...CreateProjectSchema.shape,
  })
  .strict();

const UpdateProjectToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    project_id: z.string().trim().min(1),
    ...UpdateProjectSchema.shape,
  })
  .strict();

const ListMilestonesInputSchema = z
  .object({
    ...PaginationInputSchema.shape,
    workspace_slug: z.string().trim().min(1).optional(),
    project_id: z.string().trim().min(1).optional(),
    status: z.enum(["planned", "in_progress", "completed", "archived"]).optional(),
    query: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const GetMilestoneInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    milestone_id: z.string().trim().min(1),
  })
  .strict();

const CreateMilestoneToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    ...CreateMilestoneSchema.shape,
  })
  .strict();

const UpdateMilestoneToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    milestone_id: z.string().trim().min(1),
    ...UpdateMilestoneSchema.shape,
  })
  .strict()
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.projectId !== undefined ||
      value.targetDate !== undefined ||
      value.status !== undefined,
    {
      message: "At least one update field is required.",
    },
  );

const ListIssuesInputSchema = z
  .object({
    ...PaginationInputSchema.shape,
    workspace_slug: z.string().trim().min(1).optional(),
    project_id: z.string().trim().min(1).optional(),
    team_id: z.string().trim().min(1).optional(),
    milestone_id: z.string().trim().min(1).optional(),
    status_id: z.string().trim().min(1).optional(),
    assignee_id: z.string().trim().min(1).optional(),
    priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
    query: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const GetIssueInputSchema = z
  .object({
    issue_id: z.string().trim().min(1),
    workspace_slug: z.string().trim().min(1).optional(),
  })
  .strict();

const CreateIssueToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    title: CreateIssueSchema.shape.title,
    description: CreateIssueSchema.shape.description,
    priority: CreateIssueSchema.shape.priority,
    teamId: CreateIssueSchema.shape.teamId,
    projectId: CreateIssueSchema.shape.projectId,
    milestoneId: CreateIssueSchema.shape.milestoneId,
    assigneeId: CreateIssueSchema.shape.assigneeId,
    startDate: CreateIssueSchema.shape.startDate,
    dueDate: CreateIssueSchema.shape.dueDate,
    estimate: CreateIssueSchema.shape.estimate,
    parentIssueId: CreateIssueSchema.shape.parentIssueId,
    status: z.string().trim().min(1).optional(),
    statusId: z.string().trim().min(1).optional(),
    labels: z.array(z.string().trim().min(1)).optional(),
    labelIds: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.statusId !== undefined, {
    message: "Either status or statusId is required.",
  });

const UpdateIssueToolInputSchema = z
  .object({
    workspace_slug: z.string().trim().min(1).optional(),
    issue_id: z.string().trim().min(1),
    title: UpdateIssueSchema.shape.title,
    description: UpdateIssueSchema.shape.description,
    priority: UpdateIssueSchema.shape.priority,
    teamId: UpdateIssueSchema.shape.teamId,
    projectId: UpdateIssueSchema.shape.projectId,
    milestoneId: UpdateIssueSchema.shape.milestoneId,
    assigneeId: UpdateIssueSchema.shape.assigneeId,
    startDate: UpdateIssueSchema.shape.startDate,
    dueDate: UpdateIssueSchema.shape.dueDate,
    estimate: UpdateIssueSchema.shape.estimate,
    parentIssueId: UpdateIssueSchema.shape.parentIssueId,
    relationTargetIssueId: UpdateIssueSchema.shape.relationTargetIssueId,
    relationType: UpdateIssueSchema.shape.relationType,
    status: z.string().trim().min(1).optional(),
    statusId: z.string().trim().min(1).optional().nullable(),
    labels: z.array(z.string().trim().min(1)).optional(),
    labelIds: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.status !== undefined ||
      value.statusId !== undefined ||
      value.priority !== undefined ||
      value.teamId !== undefined ||
      value.projectId !== undefined ||
      value.milestoneId !== undefined ||
      value.assigneeId !== undefined ||
      value.startDate !== undefined ||
      value.dueDate !== undefined ||
      value.estimate !== undefined ||
      value.labels !== undefined ||
      value.labelIds !== undefined ||
      value.parentIssueId !== undefined ||
      value.relationTargetIssueId !== undefined ||
      value.relationType !== undefined,
    {
      message: "At least one update field is required.",
    },
  );

const ListIssueStatusesInputSchema = WorkspaceSlugInputSchema;

type PaginationMode = "cursor" | "offset";

type PaginationState = {
  mode: PaginationMode;
  limit: number;
  offset: number;
  page: number;
};

function encodeCursor(offset: number) {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      offset?: unknown;
    };
    if (typeof parsed.offset !== "number" || !Number.isInteger(parsed.offset) || parsed.offset < 0) {
      throw new Error("Invalid cursor payload");
    }
    return parsed.offset;
  } catch {
    throw new Error("Invalid cursor");
  }
}

function resolvePagination(input: z.infer<typeof PaginationInputSchema>): PaginationState {
  const hasOffsetPaging = input.offset !== undefined || input.page !== undefined;
  if (input.cursor && hasOffsetPaging) {
    throw new Error("Use either cursor pagination or offset/page pagination, not both.");
  }

  const mode: PaginationMode = input.cursor || !hasOffsetPaging ? "cursor" : "offset";
  const offset =
    mode === "cursor"
      ? (input.cursor ? decodeCursor(input.cursor) : 0)
      : (input.offset ?? ((input.page ?? 1) - 1) * input.limit);
  const page = Math.floor(offset / input.limit) + 1;

  return {
    mode,
    limit: input.limit,
    offset,
    page,
  };
}

function buildPageInfo(
  pagination: PaginationState,
  itemCount: number,
  hasMore: boolean,
  total?: number,
) {
  const nextOffset = pagination.offset + itemCount;
  return {
    mode: pagination.mode,
    limit: pagination.limit,
    offset: pagination.offset,
    page: pagination.page,
    hasMore,
    nextCursor: hasMore ? encodeCursor(nextOffset) : null,
    total: pagination.mode === "offset" ? (total ?? itemCount) : undefined,
  };
}

function paginateArray<T>(items: T[], pagination: PaginationState) {
  const pagedItems = items.slice(pagination.offset, pagination.offset + pagination.limit + 1);
  const hasMore = pagedItems.length > pagination.limit;
  const pageItems = pagedItems.slice(0, pagination.limit);
  return {
    items: pageItems,
    pageInfo: buildPageInfo(pagination, pageItems.length, hasMore, items.length),
  };
}

async function resolveWorkspaceScope(
  userId: string,
  tokenWorkspaceId: string | null,
  requestedWorkspaceSlug?: string,
) {
  if (tokenWorkspaceId) {
    const [workspaceRow] = await db
      .select({
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
      })
      .from(workspace)
      .where(eq(workspace.id, tokenWorkspaceId))
      .limit(1);

    if (!workspaceRow) {
      throw new Error("Workspace bound to token is no longer available.");
    }

    if (requestedWorkspaceSlug && requestedWorkspaceSlug !== workspaceRow.slug) {
      throw new Error("Token is restricted to a different workspace.");
    }

    return workspaceRow;
  }

  if (!requestedWorkspaceSlug) {
    throw new Error(
      "workspace_slug is required for tokens not bound to a workspace. Use list_workspaces first.",
    );
  }

  const [workspaceRow] = await db
    .select({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(
      and(eq(workspaceMember.userId, userId), eq(workspace.slug, requestedWorkspaceSlug)),
    )
    .limit(1);

  if (!workspaceRow) {
    throw new Error("Workspace not found or not accessible.");
  }

  return workspaceRow;
}

async function getWorkspaceMemberRole(userId: string, workspaceId: string) {
  const [membership] = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(and(eq(workspaceMember.userId, userId), eq(workspaceMember.workspaceId, workspaceId)))
    .limit(1);

  return membership?.role ?? null;
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    deduped.push(value);
  }
  return deduped;
}

function formatStatusChoices(
  statuses: Array<{ name: string; type: string; position: number }>,
) {
  return statuses
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((status) => `${status.name} (${status.type})`)
    .join(", ");
}

async function resolveIssueStatusId(
  workspaceId: string,
  statusInput?: string,
  legacyStatusId?: string | null,
) {
  const statuses = await db
    .select({
      id: issueStatus.id,
      name: issueStatus.name,
      type: issueStatus.type,
      position: issueStatus.position,
    })
    .from(issueStatus)
    .where(eq(issueStatus.workspaceId, workspaceId));

  if (statuses.length === 0) {
    throw new Error("No issue statuses found for this workspace.");
  }

  const available = formatStatusChoices(statuses);

  let resolvedFromName: string | null = null;
  if (statusInput !== undefined) {
    const normalizedInput = normalizeLookupValue(statusInput);
    const byName = statuses.filter(
      (status) => normalizeLookupValue(status.name) === normalizedInput,
    );

    if (byName.length === 1) {
      resolvedFromName = byName[0]!.id;
    } else if (byName.length > 1) {
      throw new Error(
        `Status "${statusInput}" is ambiguous. Available statuses: ${available}.`,
      );
    } else {
      const byType = statuses.filter(
        (status) => normalizeLookupValue(status.type) === normalizedInput,
      );
      if (byType.length === 1) {
        resolvedFromName = byType[0]!.id;
      } else if (byType.length > 1) {
        const matches = byType.map((status) => status.name).join(", ");
        throw new Error(
          `Status "${statusInput}" matches multiple statuses by type: ${matches}. Use a specific status name. Available statuses: ${available}.`,
        );
      } else {
        throw new Error(`Status "${statusInput}" not found. Available statuses: ${available}.`);
      }
    }
  }

  if (legacyStatusId !== undefined && legacyStatusId !== null) {
    const byId = statuses.find((status) => status.id === legacyStatusId);
    if (!byId) {
      throw new Error(`Invalid statusId "${legacyStatusId}". Available statuses: ${available}.`);
    }

    if (resolvedFromName && resolvedFromName !== byId.id) {
      throw new Error("status and statusId refer to different statuses. Provide only one or make them match.");
    }

    return byId.id;
  }

  if (resolvedFromName) {
    return resolvedFromName;
  }

  throw new Error("Either status or statusId is required.");
}

async function resolveIssueLabelIds(
  workspaceId: string,
  labelsInput?: string[],
  legacyLabelIds?: string[],
) {
  if (labelsInput === undefined && legacyLabelIds === undefined) {
    return undefined;
  }

  const workspaceLabels = await db
    .select({
      id: issueLabel.id,
      name: issueLabel.name,
    })
    .from(issueLabel)
    .where(eq(issueLabel.workspaceId, workspaceId));

  const availableLabelNames = workspaceLabels.map((label) => label.name).sort();
  const labelsByNormalizedName = new Map(
    workspaceLabels.map((label) => [normalizeLookupValue(label.name), label]),
  );

  let resolvedFromNames: string[] | undefined;
  if (labelsInput !== undefined) {
    const normalizedLabels = dedupeStrings(
      labelsInput.map((name) => normalizeLookupValue(name)),
    );
    const missing = normalizedLabels.filter((name) => !labelsByNormalizedName.has(name));
    if (missing.length > 0) {
      throw new Error(
        `Unknown labels: ${missing.join(", ")}. Available labels: ${availableLabelNames.join(", ") || "(none)"}.`,
      );
    }

    resolvedFromNames = normalizedLabels.map(
      (name) => labelsByNormalizedName.get(name)!.id,
    );
  }

  let resolvedFromIds: string[] | undefined;
  if (legacyLabelIds !== undefined) {
    const dedupedIds = dedupeStrings(legacyLabelIds);
    const allowedLabelIds = new Set(workspaceLabels.map((label) => label.id));
    const invalidIds = dedupedIds.filter((id) => !allowedLabelIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid labelIds: ${invalidIds.join(", ")}. Use labels by name when possible.`,
      );
    }
    resolvedFromIds = dedupedIds;
  }

  if (resolvedFromNames && resolvedFromIds) {
    const fromNameSet = new Set(resolvedFromNames);
    const fromIdSet = new Set(resolvedFromIds);
    const sameSize = fromNameSet.size === fromIdSet.size;
    const allMatch = sameSize && [...fromNameSet].every((id) => fromIdSet.has(id));
    if (!allMatch) {
      throw new Error("labels and labelIds do not refer to the same labels. Provide only one or make them match.");
    }
    return resolvedFromIds;
  }

  return resolvedFromNames ?? resolvedFromIds ?? [];
}

async function resolveProjectByIdOrKey(workspaceId: string, projectInput: string) {
  const normalizedInput = normalizeLookupValue(projectInput);
  const normalizedKeyInput = normalizedInput.replace(/\s+/g, "").toUpperCase();

  const [resolvedProject] = await db
    .select({ id: project.id, key: project.key })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, workspaceId),
        or(eq(project.id, projectInput), eq(project.key, normalizedKeyInput)),
      ),
    )
    .limit(1);

  if (!resolvedProject) {
    throw new Error(
      `Invalid project "${projectInput}". Provide a valid project UUID or key.`,
    );
  }

  return resolvedProject;
}

export function createMcpServer() {
  const server = new McpServer(
    {
      name: MCP_SERVER_INFO.name,
      version: MCP_SERVER_INFO.version,
    },
    {
      capabilities: {
        logging: {},
        tools: {},
      },
      instructions:
        "Use this MCP server for authenticated workspace operations, including read/write access to teams, projects, issues, and milestones.",
    },
  );

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check for MCP connectivity.",
    },
    async () => textContent("pong"),
  );

  server.registerTool(
    "whoami",
    {
      title: "Who Am I",
      description: "Returns the authenticated MCP principal context.",
    },
    async (_input, extra) => {
      const auth = requireMcpAuth(extra);
      return {
        content: [
          {
            type: "text",
            text: `Authenticated as user ${auth.userId}`,
          },
        ],
        structuredContent: {
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          scopes: extra?.authInfo?.scopes ?? [],
          sessionId: extra.sessionId ?? null,
        },
      };
    },
  );

  server.registerTool(
    "list_workspaces",
    {
      title: "List Workspaces",
      description: "List workspaces accessible by the authenticated principal.",
      inputSchema: ListWorkspacesInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      const pagination = resolvePagination(ListWorkspacesInputSchema.parse(input));
      const listInput = ListWorkspacesInputSchema.parse(input);
      const workspaces = await listAuthorizedWorkspaces(auth.userId, auth.workspaceId);
      const query = listInput.query?.toLowerCase();
      const filtered = query
        ? workspaces.filter(
          (item) =>
            item.name.toLowerCase().includes(query) || item.slug.toLowerCase().includes(query),
        )
        : workspaces;
      const result = paginateArray(filtered, pagination);

      return toolTextResult(
        result.items.length === 0
          ? "No workspaces available for this token."
          : `Found ${result.items.length} workspace(s).`,
        {
          workspaces: result.items,
          pageInfo: result.pageInfo,
        },
      );
    },
  );

  server.registerTool(
    "get_workspace",
    {
      title: "Get Workspace",
      description: "Get a workspace by slug (or token-bound workspace).",
      inputSchema: GetWorkspaceInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = GetWorkspaceInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );
      const role = await getWorkspaceMemberRole(auth.userId, targetWorkspace.id);

      return toolTextResult(`Workspace: ${targetWorkspace.name}`, {
        workspace: {
          ...targetWorkspace,
          role,
        },
      });
    },
  );

  server.registerTool(
    "create_workspace",
    {
      title: "Create Workspace",
      description: "Create a workspace and initialize default issue statuses.",
      inputSchema: CreateWorkspaceToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = CreateWorkspaceToolInputSchema.parse(input);

      const [slugConflict] = await db
        .select({ id: workspace.id })
        .from(workspace)
        .where(eq(workspace.slug, parsed.slug))
        .limit(1);
      if (slugConflict) {
        throw new Error("Workspace slug is already in use.");
      }

      const [ownerMembershipCount] = await db
        .select({ value: count() })
        .from(workspaceMember)
        .where(
          and(eq(workspaceMember.userId, auth.userId), eq(workspaceMember.role, "owner")),
        );
      if ((ownerMembershipCount?.value ?? 0) >= 10) {
        throw new Error("Workspace limit reached for this account.");
      }

      const now = new Date();
      const workspaceId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(workspace).values({
          id: workspaceId,
          name: parsed.name,
          slug: parsed.slug,
          createdBy: auth.userId,
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(workspaceMember).values({
          id: randomUUID(),
          workspaceId,
          userId: auth.userId,
          role: "owner",
          joinedAt: now,
        });

        await tx.insert(issueStatus).values([
          {
            id: randomUUID(),
            workspaceId,
            name: "Backlog",
            type: "backlog",
            position: 0,
            color: "var(--muted-foreground)",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: randomUUID(),
            workspaceId,
            name: "Todo",
            type: "unstarted",
            position: 1,
            color: "var(--primary)",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: randomUUID(),
            workspaceId,
            name: "In Progress",
            type: "started",
            position: 2,
            color: "var(--chart-2)",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: randomUUID(),
            workspaceId,
            name: "Done",
            type: "completed",
            position: 3,
            color: "var(--chart-4)",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: randomUUID(),
            workspaceId,
            name: "Canceled",
            type: "canceled",
            position: 4,
            color: "var(--destructive)",
            createdAt: now,
            updatedAt: now,
          },
        ]);
      });

      return toolTextResult(`Workspace created: ${parsed.name}`, {
        workspace: {
          id: workspaceId,
          name: parsed.name,
          slug: parsed.slug,
        },
      });
    },
  );

  server.registerTool(
    "update_workspace",
    {
      title: "Update Workspace",
      description: "Update workspace metadata for an accessible workspace.",
      inputSchema: UpdateWorkspaceToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = UpdateWorkspaceToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );
      const role = await getWorkspaceMemberRole(auth.userId, targetWorkspace.id);
      if (role === "member") {
        throw new Error("Forbidden");
      }

      if (parsed.slug && parsed.slug !== targetWorkspace.slug) {
        const [slugConflict] = await db
          .select({ id: workspace.id })
          .from(workspace)
          .where(and(eq(workspace.slug, parsed.slug), ne(workspace.id, targetWorkspace.id)))
          .limit(1);
        if (slugConflict) {
          throw new Error("Workspace slug is already in use.");
        }
      }

      await db
        .update(workspace)
        .set({
          name: parsed.name ?? targetWorkspace.name,
          slug: parsed.slug ?? targetWorkspace.slug,
          updatedAt: new Date(),
        })
        .where(eq(workspace.id, targetWorkspace.id));

      return toolTextResult("Workspace updated.", {
        workspace: {
          id: targetWorkspace.id,
          name: parsed.name ?? targetWorkspace.name,
          slug: parsed.slug ?? targetWorkspace.slug,
        },
      });
    },
  );

  server.registerTool(
    "list_teams",
    {
      title: "List Teams",
      description: "List teams in the selected workspace.",
      inputSchema: ListTeamsInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = ListTeamsInputSchema.parse(input);
      const pagination = resolvePagination(parsed);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const filters = [eq(team.workspaceId, targetWorkspace.id)];
      if (parsed.query) {
        filters.push(
          or(
            ilike(team.name, `%${parsed.query}%`),
            ilike(team.key, `%${parsed.query.toUpperCase()}%`),
          )!,
        );
      }
      const where = and(...filters);
      const rows = await db
        .select({
          id: team.id,
          workspaceId: team.workspaceId,
          name: team.name,
          key: team.key,
          description: team.description,
          createdBy: team.createdBy,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        })
        .from(team)
        .where(where)
        .orderBy(desc(team.updatedAt))
        .offset(pagination.offset)
        .limit(pagination.limit + 1);
      const hasMore = rows.length > pagination.limit;
      const items = rows.slice(0, pagination.limit);
      const total =
        pagination.mode === "offset"
          ? (await db.select({ value: count() }).from(team).where(where))[0]?.value ?? 0
          : undefined;

      return toolTextResult(
        items.length === 0 ? "No teams found." : `Found ${items.length} team(s).`,
        {
          teams: items,
          pageInfo: buildPageInfo(pagination, items.length, hasMore, total),
        },
      );
    },
  );

  server.registerTool(
    "get_team",
    {
      title: "Get Team",
      description: "Get a team by ID within an accessible workspace.",
      inputSchema: GetTeamInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = GetTeamInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [teamRow] = await db
        .select()
        .from(team)
        .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.team_id)))
        .limit(1);
      if (!teamRow) {
        throw new Error("Team not found.");
      }

      return toolTextResult(`Team: ${teamRow.name}`, {
        team: teamRow,
      });
    },
  );

  server.registerTool(
    "create_team",
    {
      title: "Create Team",
      description: "Create a team inside an accessible workspace.",
      inputSchema: CreateTeamToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = CreateTeamToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );
      const role = await getWorkspaceMemberRole(auth.userId, targetWorkspace.id);
      if (role === "member") {
        throw new Error("Forbidden");
      }

      const normalizedKey = parsed.key.toUpperCase();
      const [keyConflict] = await db
        .select({ id: team.id })
        .from(team)
        .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.key, normalizedKey)))
        .limit(1);
      if (keyConflict) {
        throw new Error("Team key already exists.");
      }

      const [nameConflict] = await db
        .select({ id: team.id })
        .from(team)
        .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.name, parsed.name)))
        .limit(1);
      if (nameConflict) {
        throw new Error("Team name already exists.");
      }

      const now = new Date();
      const teamId = randomUUID();
      await db.insert(team).values({
        id: teamId,
        workspaceId: targetWorkspace.id,
        name: parsed.name,
        key: normalizedKey,
        description: parsed.description || null,
        createdBy: auth.userId,
        createdAt: now,
        updatedAt: now,
      });

      return toolTextResult(`Team created: ${parsed.name}`, {
        team: {
          id: teamId,
          workspaceId: targetWorkspace.id,
          name: parsed.name,
          key: normalizedKey,
          description: parsed.description || null,
        },
      });
    },
  );

  server.registerTool(
    "update_team",
    {
      title: "Update Team",
      description: "Update team metadata.",
      inputSchema: UpdateTeamToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = UpdateTeamToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );
      const role = await getWorkspaceMemberRole(auth.userId, targetWorkspace.id);
      if (role === "member") {
        throw new Error("Forbidden");
      }

      const [existingTeam] = await db
        .select({ id: team.id, name: team.name, key: team.key, description: team.description })
        .from(team)
        .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.team_id)))
        .limit(1);
      if (!existingTeam) {
        throw new Error("Team not found.");
      }

      const nextName = parsed.name ?? existingTeam.name;
      const nextKey = parsed.key ? parsed.key.toUpperCase() : existingTeam.key;
      const nextDescription =
        parsed.description !== undefined ? (parsed.description || null) : existingTeam.description;

      const [keyConflict] = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            eq(team.workspaceId, targetWorkspace.id),
            eq(team.key, nextKey),
            ne(team.id, existingTeam.id),
          ),
        )
        .limit(1);
      if (keyConflict) {
        throw new Error("Team key already exists.");
      }

      const [nameConflict] = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            eq(team.workspaceId, targetWorkspace.id),
            eq(team.name, nextName),
            ne(team.id, existingTeam.id),
          ),
        )
        .limit(1);
      if (nameConflict) {
        throw new Error("Team name already exists.");
      }

      await db
        .update(team)
        .set({
          name: nextName,
          key: nextKey,
          description: nextDescription,
          updatedAt: new Date(),
        })
        .where(eq(team.id, existingTeam.id));

      return toolTextResult("Team updated.", {
        team: {
          id: existingTeam.id,
          workspaceId: targetWorkspace.id,
          name: nextName,
          key: nextKey,
          description: nextDescription,
        },
      });
    },
  );

  server.registerTool(
    "list_projects",
    {
      title: "List Projects",
      description: "List projects for the selected workspace.",
      inputSchema: ListProjectsInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = ListProjectsInputSchema.parse(input);
      const pagination = resolvePagination(parsed);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const filters = [eq(project.workspaceId, targetWorkspace.id)];
      if (parsed.team_id) {
        filters.push(eq(project.teamId, parsed.team_id));
      }
      if (parsed.status) {
        filters.push(eq(project.status, parsed.status));
      }
      if (parsed.query) {
        filters.push(
          or(
            ilike(project.name, `%${parsed.query}%`),
            ilike(project.key, `%${parsed.query.toUpperCase()}%`),
          )!,
        );
      }
      const where = and(...filters);

      const rows = await db
        .select()
        .from(project)
        .where(where)
        .orderBy(desc(project.updatedAt))
        .offset(pagination.offset)
        .limit(pagination.limit + 1);
      const hasMore = rows.length > pagination.limit;
      const items = rows.slice(0, pagination.limit);
      const total =
        pagination.mode === "offset"
          ? (await db.select({ value: count() }).from(project).where(where))[0]?.value ?? 0
          : undefined;

      return toolTextResult(
        items.length === 0 ? "No projects found." : `Found ${items.length} project(s).`,
        {
          projects: items,
          pageInfo: buildPageInfo(pagination, items.length, hasMore, total),
        },
      );
    },
  );

  server.registerTool(
    "get_project",
    {
      title: "Get Project",
      description: "Get a project by ID.",
      inputSchema: GetProjectInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = GetProjectInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [projectRow] = await db
        .select()
        .from(project)
        .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.id, parsed.project_id)))
        .limit(1);
      if (!projectRow) {
        throw new Error("Project not found.");
      }

      return toolTextResult(`Project: ${projectRow.name}`, {
        project: projectRow,
      });
    },
  );

  server.registerTool(
    "create_project",
    {
      title: "Create Project",
      description: "Create a project in an accessible workspace.",
      inputSchema: CreateProjectToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = CreateProjectToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );
      const normalizedKey = parsed.key.toUpperCase();

      const [keyConflict] = await db
        .select({ id: project.id })
        .from(project)
        .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.key, normalizedKey)))
        .limit(1);
      if (keyConflict) {
        throw new Error("Project key already exists.");
      }

      if (parsed.teamId) {
        const [selectedTeam] = await db
          .select({ id: team.id })
          .from(team)
          .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.teamId)))
          .limit(1);
        if (!selectedTeam) {
          throw new Error("Invalid team selected.");
        }
      }

      const now = new Date();
      const projectId = randomUUID();
      await db.insert(project).values({
        id: projectId,
        workspaceId: targetWorkspace.id,
        teamId: parsed.teamId || null,
        name: parsed.name,
        key: normalizedKey,
        description: parsed.description || null,
        status: parsed.status,
        targetDate: parsed.targetDate || null,
        createdBy: auth.userId,
        createdAt: now,
        updatedAt: now,
      });

      return toolTextResult(`Project created: ${parsed.name}`, {
        project: {
          id: projectId,
          workspaceId: targetWorkspace.id,
          teamId: parsed.teamId || null,
          name: parsed.name,
          key: normalizedKey,
          status: parsed.status,
        },
      });
    },
  );

  server.registerTool(
    "update_project",
    {
      title: "Update Project",
      description: "Update project fields.",
      inputSchema: UpdateProjectToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = UpdateProjectToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [existingProject] = await db
        .select({ id: project.id })
        .from(project)
        .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.id, parsed.project_id)))
        .limit(1);
      if (!existingProject) {
        throw new Error("Project not found.");
      }

      const [nameConflict] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.workspaceId, targetWorkspace.id),
            eq(project.name, parsed.name),
            ne(project.id, parsed.project_id),
          ),
        )
        .limit(1);
      if (nameConflict) {
        throw new Error("Project name already exists.");
      }

      if (parsed.teamId) {
        const [selectedTeam] = await db
          .select({ id: team.id })
          .from(team)
          .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.teamId)))
          .limit(1);
        if (!selectedTeam) {
          throw new Error("Invalid team selected.");
        }
      }

      await db
        .update(project)
        .set({
          name: parsed.name,
          description: parsed.description || null,
          status: parsed.status,
          targetDate: parsed.targetDate || null,
          teamId: parsed.teamId || null,
          updatedAt: new Date(),
        })
        .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.id, parsed.project_id)));

      return toolTextResult("Project updated.", {
        project: {
          id: parsed.project_id,
          workspaceId: targetWorkspace.id,
          name: parsed.name,
          status: parsed.status,
          teamId: parsed.teamId || null,
        },
      });
    },
  );

  server.registerTool(
    "list_milestones",
    {
      title: "List Milestones",
      description: "List milestones in a workspace.",
      inputSchema: ListMilestonesInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = ListMilestonesInputSchema.parse(input);
      const pagination = resolvePagination(parsed);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const filters = [eq(milestone.workspaceId, targetWorkspace.id)];
      if (parsed.project_id) {
        filters.push(eq(milestone.projectId, parsed.project_id));
      }
      if (parsed.status) {
        filters.push(eq(milestone.status, parsed.status));
      }
      if (parsed.query) {
        filters.push(ilike(milestone.name, `%${parsed.query}%`));
      }
      const where = and(...filters);

      const rows = await db
        .select()
        .from(milestone)
        .where(where)
        .orderBy(desc(milestone.updatedAt))
        .offset(pagination.offset)
        .limit(pagination.limit + 1);
      const hasMore = rows.length > pagination.limit;
      const items = rows.slice(0, pagination.limit);
      const total =
        pagination.mode === "offset"
          ? (await db.select({ value: count() }).from(milestone).where(where))[0]?.value ?? 0
          : undefined;

      return toolTextResult(
        items.length === 0 ? "No milestones found." : `Found ${items.length} milestone(s).`,
        {
          milestones: items,
          pageInfo: buildPageInfo(pagination, items.length, hasMore, total),
        },
      );
    },
  );

  server.registerTool(
    "get_milestone",
    {
      title: "Get Milestone",
      description: "Get a milestone by ID.",
      inputSchema: GetMilestoneInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:read");
      const parsed = GetMilestoneInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [milestoneRow] = await db
        .select()
        .from(milestone)
        .where(
          and(eq(milestone.workspaceId, targetWorkspace.id), eq(milestone.id, parsed.milestone_id)),
        )
        .limit(1);
      if (!milestoneRow) {
        throw new Error("Milestone not found.");
      }

      return toolTextResult(`Milestone: ${milestoneRow.name}`, {
        milestone: milestoneRow,
      });
    },
  );

  server.registerTool(
    "create_milestone",
    {
      title: "Create Milestone",
      description: "Create a milestone in an accessible workspace.",
      inputSchema: CreateMilestoneToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = CreateMilestoneToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [nameConflict] = await db
        .select({ id: milestone.id })
        .from(milestone)
        .where(and(eq(milestone.workspaceId, targetWorkspace.id), eq(milestone.name, parsed.name)))
        .limit(1);
      if (nameConflict) {
        throw new Error("Milestone name already exists.");
      }

      if (parsed.projectId) {
        const [selectedProject] = await db
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.id, parsed.projectId)))
          .limit(1);
        if (!selectedProject) {
          throw new Error("Invalid project selected.");
        }
      }

      const now = new Date();
      const milestoneId = randomUUID();
      await db.insert(milestone).values({
        id: milestoneId,
        workspaceId: targetWorkspace.id,
        projectId: parsed.projectId || null,
        name: parsed.name,
        description: parsed.description || null,
        targetDate: parsed.targetDate || null,
        status: parsed.status,
        createdBy: auth.userId,
        createdAt: now,
        updatedAt: now,
      });

      return toolTextResult(`Milestone created: ${parsed.name}`, {
        milestone: {
          id: milestoneId,
          workspaceId: targetWorkspace.id,
          name: parsed.name,
          projectId: parsed.projectId || null,
          status: parsed.status,
        },
      });
    },
  );

  server.registerTool(
    "update_milestone",
    {
      title: "Update Milestone",
      description: "Update milestone fields.",
      inputSchema: UpdateMilestoneToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "workspace:write");
      const parsed = UpdateMilestoneToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [existingMilestone] = await db
        .select({
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          projectId: milestone.projectId,
          targetDate: milestone.targetDate,
          status: milestone.status,
        })
        .from(milestone)
        .where(
          and(eq(milestone.workspaceId, targetWorkspace.id), eq(milestone.id, parsed.milestone_id)),
        )
        .limit(1);
      if (!existingMilestone) {
        throw new Error("Milestone not found.");
      }

      const nextName = parsed.name ?? existingMilestone.name;
      const nextDescription =
        parsed.description !== undefined
          ? (parsed.description || null)
          : existingMilestone.description;
      const nextProjectId =
        parsed.projectId !== undefined ? (parsed.projectId || null) : existingMilestone.projectId;
      const nextTargetDate =
        parsed.targetDate !== undefined
          ? (parsed.targetDate || null)
          : existingMilestone.targetDate;
      const nextStatus = parsed.status ?? existingMilestone.status;

      const [nameConflict] = await db
        .select({ id: milestone.id })
        .from(milestone)
        .where(
          and(
            eq(milestone.workspaceId, targetWorkspace.id),
            eq(milestone.name, nextName),
            ne(milestone.id, parsed.milestone_id),
          ),
        )
        .limit(1);
      if (nameConflict) {
        throw new Error("Milestone name already exists.");
      }

      if (nextProjectId) {
        const [selectedProject] = await db
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.workspaceId, targetWorkspace.id), eq(project.id, nextProjectId)))
          .limit(1);
        if (!selectedProject) {
          throw new Error("Invalid project selected.");
        }
      }

      await db
        .update(milestone)
        .set({
          name: nextName,
          description: nextDescription,
          projectId: nextProjectId,
          targetDate: nextTargetDate,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(milestone.workspaceId, targetWorkspace.id), eq(milestone.id, parsed.milestone_id)));

      return toolTextResult("Milestone updated.", {
        milestone: {
          id: existingMilestone.id,
          workspaceId: targetWorkspace.id,
          name: nextName,
          projectId: nextProjectId,
          status: nextStatus,
        },
      });
    },
  );

  server.registerTool(
    "list_issue_statuses",
    {
      title: "List Issue Statuses",
      description:
        "List issue statuses in a workspace. Use these status names with create_issue or update_issue.",
      inputSchema: ListIssueStatusesInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "mcp:read");
      const parsed = ListIssueStatusesInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const statuses = await db
        .select({
          id: issueStatus.id,
          name: issueStatus.name,
          type: issueStatus.type,
          position: issueStatus.position,
          color: issueStatus.color,
          createdAt: issueStatus.createdAt,
          updatedAt: issueStatus.updatedAt,
        })
        .from(issueStatus)
        .where(eq(issueStatus.workspaceId, targetWorkspace.id))
        .orderBy(issueStatus.position);

      return toolTextResult(
        statuses.length === 0
          ? "No issue statuses found."
          : `Found ${statuses.length} issue status(es).`,
        {
          statuses,
        },
      );
    },
  );

  server.registerTool(
    "list_issues",
    {
      title: "List Issues",
      description: "List issues in a workspace with filters.",
      inputSchema: ListIssuesInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "mcp:read");
      const parsed = ListIssuesInputSchema.parse(input);
      const pagination = resolvePagination(parsed);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const filters = [eq(issue.workspaceId, targetWorkspace.id)];
      if (parsed.project_id) {
        filters.push(eq(issue.projectId, parsed.project_id));
      }
      if (parsed.team_id) {
        filters.push(eq(issue.teamId, parsed.team_id));
      }
      if (parsed.milestone_id) {
        filters.push(eq(issue.milestoneId, parsed.milestone_id));
      }
      if (parsed.status_id) {
        filters.push(eq(issue.statusId, parsed.status_id));
      }
      if (parsed.assignee_id) {
        filters.push(eq(issue.assigneeId, parsed.assignee_id));
      }
      if (parsed.priority) {
        filters.push(eq(issue.priority, parsed.priority));
      }
      if (parsed.query) {
        filters.push(
          or(
            ilike(issue.title, `%${parsed.query}%`),
            ilike(issue.identifier, `%${parsed.query}%`),
          )!,
        );
      }
      const where = and(...filters);

      const rows = await db
        .select({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          statusId: issue.statusId,
          statusName: issueStatus.name,
          statusType: issueStatus.type,
          priority: issue.priority,
          teamId: issue.teamId,
          projectId: issue.projectId,
          milestoneId: issue.milestoneId,
          assigneeId: issue.assigneeId,
          startDate: issue.startDate,
          dueDate: issue.dueDate,
          estimate: issue.estimate,
          completedAt: issue.completedAt,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        })
        .from(issue)
        .innerJoin(issueStatus, eq(issueStatus.id, issue.statusId))
        .where(where)
        .orderBy(desc(issue.updatedAt))
        .offset(pagination.offset)
        .limit(pagination.limit + 1);
      const hasMore = rows.length > pagination.limit;
      const items = rows.slice(0, pagination.limit);
      const total =
        pagination.mode === "offset"
          ? (await db.select({ value: count() }).from(issue).where(where))[0]?.value ?? 0
          : undefined;

      return toolTextResult(
        items.length === 0 ? "No issues found." : `Found ${items.length} issue(s).`,
        {
          issues: items,
          pageInfo: buildPageInfo(pagination, items.length, hasMore, total),
        },
      );
    },
  );

  server.registerTool(
    "get_issue",
    {
      title: "Get Issue",
      description: "Get issue details by issue ID.",
      inputSchema: GetIssueInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "mcp:read");
      const parsed = GetIssueInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [issueRow] = await db
        .select({
          id: issue.id,
          workspaceId: issue.workspaceId,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          statusId: issue.statusId,
          statusName: issueStatus.name,
          statusType: issueStatus.type,
          priority: issue.priority,
          teamId: issue.teamId,
          projectId: issue.projectId,
          milestoneId: issue.milestoneId,
          parentIssueId: issue.parentIssueId,
          assigneeId: issue.assigneeId,
          creatorId: issue.creatorId,
          startDate: issue.startDate,
          dueDate: issue.dueDate,
          estimate: issue.estimate,
          completedAt: issue.completedAt,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        })
        .from(issue)
        .innerJoin(issueStatus, eq(issueStatus.id, issue.statusId))
        .where(and(eq(issue.workspaceId, targetWorkspace.id), eq(issue.id, parsed.issue_id)))
        .limit(1);
      if (!issueRow) {
        throw new Error("Issue not found.");
      }

      const labels = await db
        .select({
          id: issueLabel.id,
          name: issueLabel.name,
          color: issueLabel.color,
        })
        .from(issueLabelLink)
        .innerJoin(issueLabel, eq(issueLabel.id, issueLabelLink.labelId))
        .where(eq(issueLabelLink.issueId, issueRow.id));

      const relations = await db
        .select({
          id: issueRelation.id,
          sourceIssueId: issueRelation.sourceIssueId,
          targetIssueId: issueRelation.targetIssueId,
          type: issueRelation.type,
          createdAt: issueRelation.createdAt,
        })
        .from(issueRelation)
        .where(
          or(
            eq(issueRelation.sourceIssueId, issueRow.id),
            eq(issueRelation.targetIssueId, issueRow.id),
          ),
        );

      return toolTextResult(`Issue: ${issueRow.identifier}`, {
        issue: issueRow,
        labels,
        relations,
      });
    },
  );

  server.registerTool(
    "create_issue",
    {
      title: "Create Issue",
      description:
        "Create an issue in an accessible workspace. Prefer status and labels by name; statusId and labelIds are legacy fallback fields. projectId accepts project UUID or key.",
      inputSchema: CreateIssueToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "mcp:write");
      const parsed = CreateIssueToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const resolvedStatusId = await resolveIssueStatusId(
        targetWorkspace.id,
        parsed.status,
        parsed.statusId,
      );
      const resolvedLabelIds =
        (await resolveIssueLabelIds(targetWorkspace.id, parsed.labels, parsed.labelIds)) ?? [];

      let projectKey: string | null = null;
      if (parsed.teamId) {
        const [selectedTeam] = await db
          .select({ id: team.id })
          .from(team)
          .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.teamId)))
          .limit(1);
        if (!selectedTeam) {
          throw new Error("Invalid team.");
        }
      }

      if (parsed.projectId) {
        const selectedProject = await resolveProjectByIdOrKey(
          targetWorkspace.id,
          parsed.projectId,
        );
        parsed.projectId = selectedProject.id;
        projectKey = selectedProject.key;
      }

      if (parsed.milestoneId) {
        if (!parsed.projectId) {
          throw new Error("Milestone can only be assigned to a project issue.");
        }

        const [selectedMilestone] = await db
          .select({ id: milestone.id })
          .from(milestone)
          .where(
            and(
              eq(milestone.workspaceId, targetWorkspace.id),
              eq(milestone.id, parsed.milestoneId),
              eq(milestone.projectId, parsed.projectId),
            ),
          )
          .limit(1);
        if (!selectedMilestone) {
          throw new Error("Invalid milestone for the selected project.");
        }
      }

      if (parsed.assigneeId) {
        const [assigneeRow] = await db
          .select({ id: workspaceMember.id })
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, targetWorkspace.id),
              eq(workspaceMember.userId, parsed.assigneeId),
            ),
          )
          .limit(1);
        if (!assigneeRow) {
          throw new Error("Invalid assignee.");
        }
      }

      const [counter] =
        parsed.projectId && projectKey
          ? await db
            .select({ value: count() })
            .from(issue)
            .where(
              and(eq(issue.workspaceId, targetWorkspace.id), eq(issue.projectId, parsed.projectId)),
            )
          : await db
            .select({ value: count() })
            .from(issue)
            .where(eq(issue.workspaceId, targetWorkspace.id));
      const number = (counter?.value ?? 0) + 1;
      const identifier = `${(projectKey ?? targetWorkspace.slug).toUpperCase()}-${number}`;

      const now = new Date();
      const issueId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(issue).values({
          id: issueId,
          workspaceId: targetWorkspace.id,
          teamId: parsed.teamId || null,
          projectId: parsed.projectId || null,
          milestoneId: parsed.milestoneId || null,
          parentIssueId: parsed.parentIssueId || null,
          identifier,
          title: parsed.title,
          description: parsed.description,
          statusId: resolvedStatusId,
          priority: parsed.priority,
          assigneeId: parsed.assigneeId || null,
          creatorId: auth.userId,
          startDate: parsed.startDate || null,
          dueDate: parsed.dueDate || null,
          estimate: parsed.estimate ?? null,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        });

        if (parsed.assigneeId) {
          await tx.insert(issueAssignee).values({
            id: randomUUID(),
            issueId,
            userId: parsed.assigneeId,
            assignedBy: auth.userId,
            assignedAt: now,
          });
        }

        if (resolvedLabelIds.length > 0) {
          await tx.insert(issueLabelLink).values(
            resolvedLabelIds.map((labelId) => ({
              id: randomUUID(),
              issueId,
              labelId,
              createdAt: now,
            })),
          );
        }

        await tx.insert(activityEvent).values({
          id: randomUUID(),
          workspaceId: targetWorkspace.id,
          issueId,
          actorId: auth.userId,
          type: "issue_created",
          payload: {
            title: parsed.title,
            statusId: resolvedStatusId,
            assigneeId: parsed.assigneeId ?? null,
          },
          createdAt: now,
        });
      });

      return toolTextResult(`Issue created: ${identifier}`, {
        issue: {
          id: issueId,
          workspaceId: targetWorkspace.id,
          identifier,
          title: parsed.title,
          statusId: resolvedStatusId,
        },
      });
    },
  );

  server.registerTool(
    "update_issue",
    {
      title: "Update Issue",
      description:
        "Update an existing issue. Prefer status and labels by name; statusId and labelIds are legacy fallback fields. projectId accepts project UUID or key.",
      inputSchema: UpdateIssueToolInputSchema.shape,
    },
    async (input, extra) => {
      const auth = requireMcpAuth(extra);
      requireScope(extra?.authInfo?.scopes, "mcp:write");
      const parsed = UpdateIssueToolInputSchema.parse(input);
      const targetWorkspace = await resolveWorkspaceScope(
        auth.userId,
        auth.workspaceId,
        parsed.workspace_slug,
      );

      const [existingIssue] = await db
        .select({
          id: issue.id,
          projectId: issue.projectId,
          milestoneId: issue.milestoneId,
          identifier: issue.identifier,
        })
        .from(issue)
        .where(and(eq(issue.workspaceId, targetWorkspace.id), eq(issue.id, parsed.issue_id)))
        .limit(1);
      if (!existingIssue) {
        throw new Error("Issue not found.");
      }

      const resolvedStatusId =
        parsed.status !== undefined || parsed.statusId !== undefined
          ? await resolveIssueStatusId(targetWorkspace.id, parsed.status, parsed.statusId)
          : undefined;
      const resolvedLabelIds =
        parsed.labels !== undefined || parsed.labelIds !== undefined
          ? await resolveIssueLabelIds(targetWorkspace.id, parsed.labels, parsed.labelIds)
          : undefined;

      if (parsed.teamId) {
        const [selectedTeam] = await db
          .select({ id: team.id })
          .from(team)
          .where(and(eq(team.workspaceId, targetWorkspace.id), eq(team.id, parsed.teamId)))
          .limit(1);
        if (!selectedTeam) {
          throw new Error("Invalid team.");
        }
      }

      if (parsed.projectId) {
        const selectedProject = await resolveProjectByIdOrKey(
          targetWorkspace.id,
          parsed.projectId,
        );
        parsed.projectId = selectedProject.id;
      }

      const effectiveProjectId =
        parsed.projectId !== undefined ? (parsed.projectId ?? null) : (existingIssue.projectId ?? null);
      const effectiveMilestoneId =
        parsed.milestoneId !== undefined
          ? (parsed.milestoneId ?? null)
          : (existingIssue.milestoneId ?? null);

      if (effectiveMilestoneId) {
        if (!effectiveProjectId) {
          throw new Error("Milestone can only be assigned to a project issue.");
        }

        const [selectedMilestone] = await db
          .select({ id: milestone.id })
          .from(milestone)
          .where(
            and(
              eq(milestone.workspaceId, targetWorkspace.id),
              eq(milestone.id, effectiveMilestoneId),
              eq(milestone.projectId, effectiveProjectId),
            ),
          )
          .limit(1);
        if (!selectedMilestone) {
          throw new Error("Invalid milestone for the selected project.");
        }
      }

      if (parsed.assigneeId) {
        const [assigneeRow] = await db
          .select({ id: workspaceMember.id })
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, targetWorkspace.id),
              eq(workspaceMember.userId, parsed.assigneeId),
            ),
          )
          .limit(1);
        if (!assigneeRow) {
          throw new Error("Invalid assignee.");
        }
      }

      if ((parsed.relationTargetIssueId && !parsed.relationType) || (!parsed.relationTargetIssueId && parsed.relationType)) {
        throw new Error("Both relationTargetIssueId and relationType are required together.");
      }

      const updateInput: Partial<typeof issue.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (parsed.title !== undefined) updateInput.title = parsed.title;
      if (parsed.description !== undefined) updateInput.description = parsed.description;
      if (resolvedStatusId !== undefined) updateInput.statusId = resolvedStatusId;
      if (parsed.priority !== undefined) updateInput.priority = parsed.priority;
      if (parsed.teamId !== undefined) updateInput.teamId = parsed.teamId || null;
      if (parsed.projectId !== undefined) updateInput.projectId = parsed.projectId || null;
      if (parsed.milestoneId !== undefined) updateInput.milestoneId = parsed.milestoneId || null;
      if (parsed.assigneeId !== undefined) updateInput.assigneeId = parsed.assigneeId || null;
      if (parsed.startDate !== undefined) updateInput.startDate = parsed.startDate || null;
      if (parsed.dueDate !== undefined) updateInput.dueDate = parsed.dueDate || null;
      if (parsed.parentIssueId !== undefined) updateInput.parentIssueId = parsed.parentIssueId || null;
      if (parsed.estimate !== undefined) updateInput.estimate = parsed.estimate ?? null;

      await db.transaction(async (tx) => {
        await tx
          .update(issue)
          .set(updateInput)
          .where(and(eq(issue.workspaceId, targetWorkspace.id), eq(issue.id, parsed.issue_id)));

        if (resolvedLabelIds !== undefined) {
          await tx.delete(issueLabelLink).where(eq(issueLabelLink.issueId, parsed.issue_id));
          if (resolvedLabelIds.length > 0) {
            await tx.insert(issueLabelLink).values(
              resolvedLabelIds.map((labelId) => ({
                id: randomUUID(),
                issueId: parsed.issue_id,
                labelId,
                createdAt: new Date(),
              })),
            );
          }
        }

        if (parsed.relationTargetIssueId && parsed.relationType) {
          await tx.insert(issueRelation).values({
            id: randomUUID(),
            workspaceId: targetWorkspace.id,
            sourceIssueId: parsed.issue_id,
            targetIssueId: parsed.relationTargetIssueId,
            type: parsed.relationType,
            createdBy: auth.userId,
            createdAt: new Date(),
          });
        }

        await tx.insert(activityEvent).values({
          id: randomUUID(),
          workspaceId: targetWorkspace.id,
          issueId: parsed.issue_id,
          actorId: auth.userId,
          type: "issue_updated",
          payload: parsed,
          createdAt: new Date(),
        });
      });

      return toolTextResult(`Issue updated: ${existingIssue.identifier}`, {
        issue: {
          id: parsed.issue_id,
        },
      });
    },
  );

  return server;
}
