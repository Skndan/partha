"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
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
import { type ProjectTableRow } from "./types";

const formSchema = z.object({
  name: z.string().min(2).max(80),
  key: z.string().min(2).max(8).regex(/^[A-Z0-9]+$/, "Use uppercase letters/numbers"),
  description: z.string().max(2000).optional(),
  teamId: z.string().nullable(),
  targetDate: z.string().nullable(),
  status: z.enum(["planned", "active", "completed", "archived"]),
});

type FormValues = z.infer<typeof formSchema>;

export function ProjectFormDialog({
  slug,
  open,
  mode,
  project,
  onOpenChange,
  teams,
  lockedTeamId,
}: {
  slug: string;
  open: boolean;
  mode: "create" | "update";
  project?: ProjectTableRow;
  onOpenChange: (open: boolean) => void;
  teams: Array<{ id: string; name: string }>;
  lockedTeamId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isUpdate = mode === "update" && !!project;

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: project?.name ?? "",
      key: project?.key ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "planned",
      teamId: lockedTeamId ?? project?.teamId ?? null,
      targetDate: project?.targetDate ?? null,
    }),
    [lockedTeamId, project],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: defaultValues,
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const endpoint = isUpdate
        ? `/api/workspaces/${slug}/projects/${encodeURIComponent(project.id)}`
        : `/api/workspaces/${slug}/projects`;
      const method = isUpdate ? "PATCH" : "POST";
      const body = isUpdate
        ? {
          name: values.name,
          description: values.description ?? "",
          status: values.status,
          teamId: lockedTeamId ?? values.teamId,
          targetDate: values.targetDate,
        }
        : {
          ...values,
          teamId: lockedTeamId ?? values.teamId,
          key: values.key.toUpperCase(),
          description: values.description ?? "",
        };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.error?.key?.[0]) {
          form.setError("key", { message: data.error.key[0] });
        } else if (data?.error?.name?.[0]) {
          form.setError("name", { message: data.error.name[0] });
        } else {
          toast.error(isUpdate ? "Unable to update project" : "Unable to create project");
        }
        return;
      }

      toast.success(isUpdate ? "Project updated" : "Project created");
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isUpdate ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update project details and workflow status."
              : "Add a new project to track delivery for this workspace."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Website redesign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="WEB"
                        readOnly={isUpdate}
                        {...field}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
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
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
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
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target date</FormLabel>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Project context..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isUpdate ? (
                  "Update Project"
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
