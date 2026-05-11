"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@workspace/ui/components/button";
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
import { CreateWorkspaceInviteSchema } from "@/lib/validators/workspace";
import { cn } from "@/lib/utils";

import type { InviteMemberTeamOption } from "@/components/linear/invite-member-dialog";

type FormValues = z.input<typeof CreateWorkspaceInviteSchema>;
type InviteFormOutput = z.output<typeof CreateWorkspaceInviteSchema>;

export function InviteMemberForm({
  slug,
  teams,
  className,
}: {
  slug: string;
  teams: InviteMemberTeamOption[];
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateWorkspaceInviteSchema),
    defaultValues: {
      email: "",
      role: "member",
      teamId: "none",
    },
  });

  async function onSubmit(values: InviteFormOutput) {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${slug}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await res.json().catch(() => null)) as {
      error?: unknown;
      warning?: string;
    } | null;

    if (!res.ok) {
      const message =
        typeof data?.error === "string"
          ? data.error
          : "Unable to send invite";
      toast.error(message);
      setLoading(false);
      return;
    }

    if (data?.warning) {
      toast.warning(data.warning);
    } else {
      toast.success("Invite sent");
    }
    form.reset({ email: "", role: "member", teamId: "none" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3 rounded-lg border p-4", className)}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="teammate@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Workspace role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="teamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default team (optional)</FormLabel>
              <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No default team" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No default team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{" "}
                      <span className="text-muted-foreground">({t.key})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Send invite"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
