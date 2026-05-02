"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { patchIssue } from "@/lib/linear/patch-issue-client";
import { cn } from "@/lib/utils";

const acceptanceCriteriaFormSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1).max(64),
      text: z.string().trim().min(1, "Item text is required").max(500),
      checked: z.boolean(),
    }),
  ),
});

type AcceptanceCriteriaValues = z.infer<typeof acceptanceCriteriaFormSchema>;

export type AcceptanceCriteriaItem = AcceptanceCriteriaValues["items"][number];

function createItem(): AcceptanceCriteriaItem {
  return {
    id: crypto.randomUUID(),
    text: "",
    checked: false,
  };
}

type IssueAcceptanceCriteriaSectionProps = {
  slug: string;
  issueId: string;
  items: AcceptanceCriteriaItem[];
};

export function IssueAcceptanceCriteriaSection({
  slug,
  issueId,
  items,
}: IssueAcceptanceCriteriaSectionProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<() => Promise<void>>(async () => { });
  const lastSavedRef = useRef(JSON.stringify(items));
  const savingRef = useRef(false);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<AcceptanceCriteriaValues>({
    resolver: zodResolver(acceptanceCriteriaFormSchema),
    defaultValues: { items },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "fieldId",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });
  const normalized = useMemo(
    () => JSON.stringify((watchedItems ?? []).map((item) => ({ ...item, text: item.text.trim() }))),
    [watchedItems],
  );

  useEffect(() => {
    const next = JSON.stringify(items);
    lastSavedRef.current = next;
    form.reset({ items });
    setDirty(false);
  }, [form, items]);

  useEffect(() => {
    setDirty(normalized !== lastSavedRef.current);
  }, [normalized]);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    const valid = await form.trigger();
    if (!valid) return;

    const payload = form.getValues().items.map((item) => ({
      id: item.id,
      text: item.text.trim(),
      checked: item.checked,
    }));

    const next = JSON.stringify(payload);
    if (next === lastSavedRef.current) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const ok = await patchIssue(
        slug,
        issueId,
        { acceptanceCriteria: payload },
        { silentSuccess: true },
      );
      if (ok) {
        lastSavedRef.current = next;
        setDirty(false);
        router.refresh();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [form, issueId, router, slug]);

  saveRef.current = save;

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

  return (
    <div ref={sectionRef}>
      <Collapsible defaultOpen={false} className="rounded-lg border">
        <CollapsibleTrigger
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-t-lg bg-muted/50 p-3 text-left text-sm font-medium outline-none",
            "hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50",
            "[&[data-state=open]>svg]:rotate-180",
          )}
        >
          <span>Acceptance Criteria</span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-3">
          <Form {...form}>
            <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
              {fields.map((field, index) => (
                <div key={field.fieldId} className="group rounded-md p-2">
                  <div className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.checked`}
                      render={({ field: checkboxField }) => (
                        <FormItem className="pt-2">
                          <FormControl>
                            <Checkbox
                              checked={checkboxField.value}
                              onCheckedChange={(checked) => checkboxField.onChange(checked === true)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.text`}
                      render={({ field: textField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...textField}
                              placeholder={`Criterion ${index + 1}`}
                              value={textField.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-1 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-foreground"
                        onClick={() => remove(index)}
                        aria-label="Remove criterion"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => append(createItem())}>
                  <Plus className="mr-1 size-4" />
                  Add criterion
                </Button>
                {dirty ? (
                  <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void save()}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                ) : null}
              </div>
            </form>
          </Form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
