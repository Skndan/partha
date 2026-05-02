"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@workspace/ui/components/textarea";
import { CreateTeamSchema } from "@/lib/validators/linear";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type CreateTeamFormValues = z.infer<typeof CreateTeamSchema>;

export function CreateTeamForm({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(CreateTeamSchema as never),
    defaultValues: {
      name: "",
      key: "",
      description: "",
    },
  });

  async function onSubmit(values: CreateTeamFormValues) {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${slug}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        key: values.key.toUpperCase(),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data?.error?.key?.[0]) {
        form.setError("key", { message: data.error.key[0] });
      } else {
        toast.error("Unable to create team");
      }
      setLoading(false);
      return;
    }

    toast.success("Team created");
    form.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3 rounded-lg border p-4", className)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Platform" {...field} />
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
                    placeholder="PLT"
                    {...field}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Team mission..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
