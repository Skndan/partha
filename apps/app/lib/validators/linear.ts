import { z } from "zod";

import { DESCRIPTION_MARKDOWN_MAX } from "@/lib/constants/description-markdown";

const keyRegex = /^[A-Z0-9]+$/;
const acceptanceCriteriaItemSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().trim().min(1).max(500),
  checked: z.boolean(),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(80),
  key: z.string().min(2).max(8).regex(keyRegex, "Use uppercase letters/numbers"),
  description: z.string().max(500).optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(80),
  key: z.string().min(2).max(8).regex(keyRegex, "Use uppercase letters/numbers"),
  description: z.string().max(DESCRIPTION_MARKDOWN_MAX).optional(),
  teamId: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "completed", "archived"]),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(DESCRIPTION_MARKDOWN_MAX).optional(),
  teamId: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "completed", "archived"]),
});

export const CreateMilestoneSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["planned", "in_progress", "completed", "archived"]),
});

export const UpdateMilestoneSchema = CreateMilestoneSchema.partial();

export const CreateIssueLabelSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().min(1).max(40),
});

export const CreateIssueSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(DESCRIPTION_MARKDOWN_MAX),
  acceptanceCriteria: z.array(acceptanceCriteriaItemSchema).max(100).optional(),
  statusId: z.string().min(1),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
  teamId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimate: z.number().int().nonnegative().optional().nullable(),
  labelIds: z.array(z.string()),
  parentIssueId: z.string().optional().nullable(),
});

export const UpdateIssueSchema = CreateIssueSchema.partial().extend({
  relationTargetIssueId: z.string().optional().nullable(),
  relationType: z
    .enum(["blocks", "blocked_by", "relates_to", "duplicate_of"])
    .optional()
    .nullable(),
});

export const CreateIssueCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const CreateIssueRelationSchema = z.object({
  targetIssueId: z.string().min(1),
  type: z.enum(["blocks", "blocked_by", "relates_to", "duplicate_of"]),
});
