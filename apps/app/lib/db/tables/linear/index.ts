import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../auth/user";

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
]);

export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "lead",
  "member",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "completed",
  "archived",
]);

export const issuePriorityEnum = pgEnum("issue_priority", [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const issueStatusTypeEnum = pgEnum("issue_status_type", [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "planned",
  "in_progress",
  "completed",
  "archived",
]);

export const sprintStatusEnum = pgEnum("sprint_status", [
  "planned",
  "active",
  "completed",
]);

export const issueRelationTypeEnum = pgEnum("issue_relation_type", [
  "blocks",
  "blocked_by",
  "relates_to",
  "duplicate_of",
]);

export type IssueAcceptanceCriteriaItem = {
  id: string;
  text: string;
  checked: boolean;
};

export const workspace = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("workspace_slug_unique").on(table.slug),
    createdByIndex: index("workspace_created_by_idx").on(table.createdBy),
  }),
);

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceUserUnique: uniqueIndex("workspace_member_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
    workspaceRoleIndex: index("workspace_member_workspace_role_idx").on(
      table.workspaceId,
      table.role,
    ),
    userIndex: index("workspace_member_user_idx").on(table.userId),
  }),
);

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceKeyUnique: uniqueIndex("team_workspace_key_unique").on(
      table.workspaceId,
      table.key,
    ),
    workspaceNameUnique: uniqueIndex("team_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    workspaceIndex: index("team_workspace_idx").on(table.workspaceId),
  }),
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: teamMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    teamUserUnique: uniqueIndex("team_member_team_user_unique").on(
      table.teamId,
      table.userId,
    ),
    userIndex: index("team_member_user_idx").on(table.userId),
  }),
);

export const workspaceInvite = pgTable(
  "workspace_invite",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: workspaceRoleEnum("role").notNull().default("member"),
    token: text("token").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("workspace_invite_token_unique").on(table.token),
    workspaceEmailIndex: index("workspace_invite_workspace_email_idx").on(
      table.workspaceId,
      table.email,
    ),
    expiresAtIndex: index("workspace_invite_expires_at_idx").on(table.expiresAt),
    teamIdIndex: index("workspace_invite_team_id_idx").on(table.teamId),
  }),
);

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("planned"),
    startDate: date("start_date"),
    targetDate: date("target_date"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceKeyUnique: uniqueIndex("project_workspace_key_unique").on(
      table.workspaceId,
      table.key,
    ),
    workspaceNameUnique: uniqueIndex("project_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    workspaceIndex: index("project_workspace_idx").on(table.workspaceId),
    teamIndex: index("project_team_idx").on(table.teamId),
  }),
);

export const milestone = pgTable(
  "milestone",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    targetDate: date("target_date"),
    status: milestoneStatusEnum("status").notNull().default("planned"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceNameUnique: uniqueIndex("milestone_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    workspaceIndex: index("milestone_workspace_idx").on(table.workspaceId),
    projectIndex: index("milestone_project_idx").on(table.projectId),
  }),
);

export const sprint = pgTable(
  "sprint",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: sprintStatusEnum("status").notNull().default("planned"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIndex: index("sprint_project_idx").on(table.projectId),
    workspaceProjectDatesIndex: index("sprint_workspace_project_dates_idx").on(
      table.workspaceId,
      table.projectId,
      table.startDate,
    ),
  }),
);

export const issueStatus = pgTable(
  "issue_status",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: issueStatusTypeEnum("type").notNull().default("backlog"),
    position: integer("position").notNull().default(0),
    color: text("color").notNull().default("var(--primary)"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceNameUnique: uniqueIndex("issue_status_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    workspaceTypePositionUnique: uniqueIndex(
      "issue_status_workspace_type_position_unique",
    ).on(table.workspaceId, table.type, table.position),
    workspaceIndex: index("issue_status_workspace_idx").on(table.workspaceId),
  }),
);

export const issue = pgTable(
  "issue",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    milestoneId: text("milestone_id").references(() => milestone.id, {
      onDelete: "set null",
    }),
    parentIssueId: text("parent_issue_id"),
    identifier: text("identifier").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    acceptanceCriteria: jsonb("acceptance_criteria")
      .$type<IssueAcceptanceCriteriaItem[]>()
      .notNull()
      .default([]),
    statusId: text("status_id")
      .notNull()
      .references(() => issueStatus.id, { onDelete: "restrict" }),
    priority: issuePriorityEnum("priority").notNull().default("none"),
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    estimate: integer("estimate"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdentifierUnique: uniqueIndex("issue_workspace_project_identifier_unique").on(
      table.workspaceId,
      table.projectId,
      table.identifier,
    ),
    workspaceStatusIndex: index("issue_workspace_status_idx").on(
      table.workspaceId,
      table.statusId,
    ),
    workspaceAssigneeIndex: index("issue_workspace_assignee_idx").on(
      table.workspaceId,
      table.assigneeId,
    ),
    projectIndex: index("issue_project_idx").on(table.projectId),
    milestoneIndex: index("issue_milestone_idx").on(table.milestoneId),
    parentIssueIndex: index("issue_parent_issue_idx").on(table.parentIssueId),
  }),
);

export const sprintIssue = pgTable(
  "sprint_issue",
  {
    id: text("id").primaryKey(),
    sprintId: text("sprint_id")
      .notNull()
      .references(() => sprint.id, { onDelete: "cascade" }),
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    sprintIssueUnique: uniqueIndex("sprint_issue_issue_unique").on(table.issueId),
    sprintIndex: index("sprint_issue_sprint_idx").on(table.sprintId),
    sprintPositionIndex: index("sprint_issue_sprint_position_idx").on(
      table.sprintId,
      table.position,
    ),
  }),
);

export const issueLabel = pgTable(
  "issue_label",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("var(--secondary)"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceNameUnique: uniqueIndex("issue_label_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    workspaceIndex: index("issue_label_workspace_idx").on(table.workspaceId),
  }),
);

export const issueLabelLink = pgTable(
  "issue_label_link",
  {
    id: text("id").primaryKey(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => issueLabel.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    issueLabelUnique: uniqueIndex("issue_label_link_issue_label_unique").on(
      table.issueId,
      table.labelId,
    ),
    labelIndex: index("issue_label_link_label_idx").on(table.labelId),
  }),
);

export const issueAssignee = pgTable(
  "issue_assignee",
  {
    id: text("id").primaryKey(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    issueUserUnique: uniqueIndex("issue_assignee_issue_user_unique").on(
      table.issueId,
      table.userId,
    ),
    userIndex: index("issue_assignee_user_idx").on(table.userId),
  }),
);

export const issueRelation = pgTable(
  "issue_relation",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    sourceIssueId: text("source_issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    targetIssueId: text("target_issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    type: issueRelationTypeEnum("type").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    relationUnique: uniqueIndex("issue_relation_source_target_type_unique").on(
      table.sourceIssueId,
      table.targetIssueId,
      table.type,
    ),
    workspaceIndex: index("issue_relation_workspace_idx").on(table.workspaceId),
    targetIndex: index("issue_relation_target_idx").on(table.targetIssueId),
  }),
);

export const issueComment = pgTable(
  "issue_comment",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    issueId: text("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    issueIndex: index("issue_comment_issue_idx").on(table.issueId),
    workspaceCreatedIndex: index("issue_comment_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  }),
);

export const activityEvent = pgTable(
  "activity_event",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issue.id, {
      onDelete: "cascade",
    }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceCreatedIndex: index("activity_event_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    issueIndex: index("activity_event_issue_idx").on(table.issueId),
  }),
);

export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIndex: index("notification_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    workspaceUserReadIndex: index("notification_workspace_user_read_idx").on(
      table.workspaceId,
      table.userId,
      table.readAt,
    ),
  }),
);
