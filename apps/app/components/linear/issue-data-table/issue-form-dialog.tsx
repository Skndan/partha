"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { type IssueLabelOption, type IssueOption, type IssueTableRow } from "./types";

const createIssueDialogSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(20000),
  statusId: z.string().min(1),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
  teamId: z.string().nullable(),
  projectId: z.string().nullable(),
  milestoneId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  dueDate: z.string().nullable(),
  estimate: z.number().int().nonnegative().nullable(),
  labelIds: z.array(z.string()),
  parentIssueId: z.string().nullable(),
});

const updateIssueDialogSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(20000),
  statusId: z.string().min(1),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
  teamId: z.string().nullable(),
  projectId: z.string().nullable(),
  milestoneId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  dueDate: z.string().nullable(),
  estimate: z.number().int().nonnegative().nullable(),
});

type CreateValues = z.infer<typeof createIssueDialogSchema>;
type UpdateValues = z.infer<typeof updateIssueDialogSchema>;

/** Prefill for create mode only — omit title/description (always start empty). */
export type IssueCreatePrefill = Partial<
  Pick<
    CreateValues,
    | "statusId"
    | "priority"
    | "teamId"
    | "projectId"
    | "milestoneId"
    | "assigneeId"
    | "dueDate"
    | "estimate"
    | "labelIds"
    | "parentIssueId"
  >
>;

export function IssueFormDialog({
  slug,
  open,
  mode,
  issue,
  createPrefill,
  onOpenChange,
  statuses,
  teams,
  projects,
  milestones,
  members,
  labels,
  lockedTeamId,
  lockedProjectId,
}: {
  slug: string;
  open: boolean;
  mode: "create" | "update";
  issue?: IssueTableRow;
  /** When mode is create, merge these defaults (e.g. copy from parent issue for sub-issues). */
  createPrefill?: IssueCreatePrefill;
  onOpenChange: (open: boolean) => void;
  statuses: IssueOption[];
  teams: IssueOption[];
  projects: IssueOption[];
  milestones: IssueOption[];
  members: IssueOption[];
  labels: IssueLabelOption[];
  lockedTeamId?: string;
  lockedProjectId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isUpdate = mode === "update" && !!issue;

  const createDefaults = useMemo<CreateValues>(
    () => ({
      title: "",
      description: "",
      statusId: statuses[0]?.id ?? "",
      priority: "none",
      teamId: lockedTeamId ?? null,
      projectId: lockedProjectId ?? null,
      milestoneId: null,
      assigneeId: null,
      dueDate: null,
      estimate: null,
      labelIds: [],
      parentIssueId: null,
      ...createPrefill,
    }),
    [createPrefill, lockedProjectId, lockedTeamId, statuses],
  );

  const updateDefaults = useMemo<UpdateValues>(
    () => ({
      title: issue?.title ?? "",
      description: issue?.description ?? "",
      statusId: issue?.statusId ?? statuses[0]?.id ?? "",
      priority: issue?.priority ?? "none",
      teamId: lockedTeamId ?? issue?.teamId ?? null,
      projectId: lockedProjectId ?? issue?.projectId ?? null,
      milestoneId: issue?.milestoneId ?? null,
      assigneeId: issue?.assigneeId ?? null,
      dueDate: issue?.dueDate ?? null,
      estimate: issue?.estimate ?? null,
    }),
    [issue, lockedProjectId, lockedTeamId, statuses],
  );

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createIssueDialogSchema),
    values: createDefaults,
  });
  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateIssueDialogSchema),
    values: updateDefaults,
  });

  async function submitCreate(values: CreateValues) {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          teamId: lockedTeamId ?? values.teamId,
          projectId: lockedProjectId ?? values.projectId,
          parentIssueId: values.parentIssueId,
        }),
      });

      if (!response.ok) {
        toast.error("Unable to create issue");
        return;
      }

      toast.success("Issue created");
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitUpdate(values: UpdateValues) {
    if (!issue) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${slug}/issues/${encodeURIComponent(issue.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          teamId: lockedTeamId ?? values.teamId,
          projectId: lockedProjectId ?? values.projectId,
        }),
      });

      if (!response.ok) {
        toast.error("Unable to update issue");
        return;
      }

      toast.success("Issue updated");
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const selectedLabelIds = createForm.watch("labelIds");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Edit issue" : createPrefill?.parentIssueId ? "Create sub-issue" : "Create issue"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update issue details and assignment."
              : createPrefill?.parentIssueId
                ? "New issue under the current parent; title and description start empty."
                : "Capture a new issue for tracking and planning."}
          </DialogDescription>
        </DialogHeader>

        {!isUpdate ? (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(submitCreate)} className="grid gap-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Fix issue loading state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Detailed markdown description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={createForm.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No priority</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="estimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={createForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select
                        disabled={Boolean(lockedTeamId)}
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        disabled={Boolean(lockedProjectId)}
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="milestoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No milestone</SelectItem>
                          {milestones.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="labelIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Labels</FormLabel>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {labels.map((label) => {
                        const checked = selectedLabelIds.includes(label.id);
                        return (
                          <label key={label.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const nextValue = nextChecked
                                  ? [...selectedLabelIds, label.id]
                                  : selectedLabelIds.filter((id) => id !== label.id);
                                createForm.setValue("labelIds", nextValue, { shouldValidate: true });
                              }}
                            />
                            <span>{label.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Issue"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(submitUpdate)} className="grid gap-4">
              <FormField
                control={updateForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={updateForm.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No priority</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="estimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : null)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={updateForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select
                        disabled={Boolean(lockedTeamId)}
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        disabled={Boolean(lockedProjectId)}
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="milestoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No milestone</SelectItem>
                          {milestones.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={updateForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Update Issue"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
