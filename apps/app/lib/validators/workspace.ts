import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(80, "Workspace name must be at most 80 characters")
    .transform((value) => value.trim()),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      slugRegex,
      "Use lowercase letters, numbers, and single hyphens between words",
    ),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export const CreateWorkspaceInviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

export type CreateWorkspaceInviteInput = z.infer<typeof CreateWorkspaceInviteSchema>;

export function slugifyWorkspaceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 50);
}
