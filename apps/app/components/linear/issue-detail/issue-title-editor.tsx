"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormField, FormItem } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@/lib/utils";
import { patchIssue } from "@/lib/linear/patch-issue-client";

const TITLE_MAX = 200;

const TitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(TITLE_MAX),
});

type TitleValues = z.infer<typeof TitleSchema>;

type IssueTitleEditorProps = {
  slug: string;
  issueId: string;
  title: string;
  editorKey: string;
};

export function IssueTitleEditor({ slug, issueId, title, editorKey }: IssueTitleEditorProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef(title);
  const savingRef = useRef(false);
  const saveRef = useRef<() => Promise<void>>(async () => { });

  const [saving, setSaving] = useState(false);

  const form = useForm<TitleValues>({
    resolver: zodResolver(TitleSchema),
    defaultValues: { title },
    mode: "onChange",
  });

  const watchedTitle = form.watch("title");

  const save = useCallback(async () => {
    if (savingRef.current) return;
    const parsed = TitleSchema.safeParse({ title: watchedTitle });
    if (!parsed.success) return;

    const next = parsed.data.title;
    if (next === lastSavedRef.current) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const ok = await patchIssue(
        slug,
        issueId,
        { title: next },
        { silentSuccess: true },
      );
      if (ok) {
        lastSavedRef.current = next;
        router.refresh();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [issueId, router, slug, watchedTitle]);

  saveRef.current = save;

  useEffect(() => {
    lastSavedRef.current = title;
    form.reset({ title });
  }, [title, editorKey, form]);

  useEffect(() => {
    const onDocKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "s") return;
      const root = sectionRef.current;
      if (!root?.contains(document.activeElement)) return;
      event.preventDefault();
      void saveRef.current();
    };
    document.addEventListener("keydown", onDocKeyDown, true);
    return () => document.removeEventListener("keydown", onDocKeyDown, true);
  }, []);

  const titleDirty = watchedTitle !== lastSavedRef.current;
  const titleValid = form.formState.isValid;

  return (
    <Form {...form}>
      <div
        ref={sectionRef}
        className={cn(
          "relative rounded-md border border-border/60 px-2 py-1 transition-colors",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50",
        )}
      >
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className={cn(titleDirty && "pr-29")}>
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Issue title"
                    className={cn(
                      "h-auto min-h-9 border-0 bg-transparent px-0 py-1 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl",
                    )}
                    maxLength={TITLE_MAX}
                    onBlur={(e) => {
                      field.onBlur();
                      void saveRef.current();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveRef.current();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {titleDirty ? (
            <div className="absolute top-1.5 right-2 z-10">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!titleValid || saving}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </Form>
  );
}
