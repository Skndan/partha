"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import {
  CreateWorkspaceSchema,
  type CreateWorkspaceInput,
  slugifyWorkspaceName,
} from "@/lib/validators/workspace";

type WorkspaceOnboardingFormProps = {
  email: string;
};

export function WorkspaceOnboardingForm({
  email,
}: WorkspaceOnboardingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const workspaceName = useWatch({ control: form.control, name: "name" });
  const generatedSlug = slugifyWorkspaceName(workspaceName ?? "");

  async function onSubmit(values: CreateWorkspaceInput) {
    setSubmitting(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (typeof data?.error === "object" && data.error?.slug?.[0]) {
        form.setError("slug", { message: data.error.slug[0] });
      } else if (typeof data?.error === "string") {
        toast.error(data.error);
      } else {
        toast.error("Unable to create workspace.");
      }
      setSubmitting(false);
      return;
    }

    const slug = data?.workspace?.slug as string | undefined;
    if (!slug) {
      toast.error("Workspace created, but redirect failed.");
      setSubmitting(false);
      return;
    }

    toast.success("Workspace created");
    router.push(`/${slug}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{email}</span>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    if (!slugEdited) {
                      form.setValue(
                        "slug",
                        slugifyWorkspaceName(event.target.value),
                        { shouldValidate: true },
                      );
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="acme"
                  {...field}
                  onChange={(event) => {
                    setSlugEdited(true);
                    field.onChange(event.target.value.toLowerCase());
                  }}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                URL preview: /{field.value || generatedSlug || "workspace-slug"}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating workspace
              </>
            ) : (
              "Create workspace"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
