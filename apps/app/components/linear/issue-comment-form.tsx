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
import { Textarea } from "@workspace/ui/components/textarea";
import { CreateIssueCommentSchema } from "@/lib/validators/linear";

type FormValues = z.infer<typeof CreateIssueCommentSchema>;

export function IssueCommentForm({
  slug,
  issueId,
}: {
  slug: string;
  issueId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateIssueCommentSchema),
    defaultValues: {
      body: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${slug}/issues/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      toast.error("Unable to post comment");
      setLoading(false);
      return;
    }

    toast.success("Comment posted");
    form.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Add comment (Markdown)</FormLabel> */}
              <FormControl>
                <Textarea rows={4} placeholder="Share details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant={"outline"} disabled={loading} className="self-end">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Post comment"}
        </Button>
      </form>
    </Form>
  );
}
