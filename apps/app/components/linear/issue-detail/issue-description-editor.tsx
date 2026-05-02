"use client";

import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "tiptap-markdown";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { patchIssue } from "@/lib/linear/patch-issue-client";

import { SlashCommand } from "./slash-command";

const DESC_MAX = 20000;

type IssueDescriptionEditorProps = {
  slug: string;
  issueId: string;
  description: string;
  editorKey: string;
};

function getMarkdown(editor: Editor | null): string {
  if (!editor) return "";
  const storage = editor.storage as unknown as {
    markdown?: { getMarkdown?: () => string };
  };
  return storage.markdown?.getMarkdown?.() ?? "";
}

export function IssueDescriptionEditor({
  slug,
  issueId,
  description,
  editorKey,
}: IssueDescriptionEditorProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef(description);
  const savingRef = useRef(false);
  const saveRef = useRef<() => Promise<void>>(async () => { });

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({
          placeholder: "Write a description… Type '/' for commands",
        }),
        Markdown.configure({
          html: false,
          breaks: true,
          transformPastedText: true,
        }),
        SlashCommand,
      ],
      content: description,
      editorProps: {
        attributes: {
          class: cn(
            "min-h-[96px] max-w-none outline-none",
            // Placeholder (TipTap empty node decorations)
            "[&_p.is-empty:first-child]:before:pointer-events-none [&_p.is-empty:first-child]:before:float-left [&_p.is-empty:first-child]:before:h-0 [&_p.is-empty:first-child]:before:text-muted-foreground [&_p.is-empty:first-child]:before:content-[attr(data-placeholder)]",
          ),
        },
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            void saveRef.current();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        let md = getMarkdown(ed);
        if (md.length > DESC_MAX) {
          const clipped = md.slice(0, DESC_MAX);
          ed.commands.setContent(clipped);
          md = clipped;
        }
        setDirty(md !== lastSavedRef.current);
      },
    },
    [editorKey],
  );

  const save = useCallback(async () => {
    if (savingRef.current) return;
    if (!editor) return;
    let md = getMarkdown(editor);
    if (md.length > DESC_MAX) {
      md = md.slice(0, DESC_MAX);
    }
    if (md === lastSavedRef.current) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const ok = await patchIssue(
        slug,
        issueId,
        { description: md },
        { silentSuccess: true },
      );
      if (ok) {
        lastSavedRef.current = md;
        setDirty(false);
        router.refresh();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [editor, issueId, router, slug]);

  saveRef.current = save;

  useEffect(() => {
    lastSavedRef.current = description;
    setDirty(false);
  }, [description]);

  useEffect(() => {
    if (!editor) return;
    lastSavedRef.current = description;
    editor.commands.setContent(description);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from props only when editor/editorKey changes (issue snapshot refresh)
  }, [editor, editorKey]);

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
    <div
      ref={sectionRef}
      className={cn(
        "relative max-w-4xl rounded-md border border-border/60 px-2 py-2 text-sm leading-relaxed text-foreground transition-colors",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50",
        "[&_.ProseMirror]:max-w-none",
        "[&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_strong]:text-foreground",
        "[&_.ProseMirror_b]:font-semibold",
        "[&_.ProseMirror_em]:italic [&_.ProseMirror_i]:italic",
        "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2",
        "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:tracking-tight [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h1]:first:mt-0",
        "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:tracking-tight [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-2",
        "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1.5",
        "[&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:mt-2 [&_.ProseMirror_h4]:mb-1",
        "[&_.ProseMirror_blockquote]:text-muted-foreground",
        "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3",
        "[&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-sm",
        "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1",
        "[&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-1 [&_.ProseMirror_li[data-checked]]:flex [&_.ProseMirror_li[data-checked]]:gap-2",
      )}
    >
      <div
        className={cn(
          "min-h-[120px]",
          dirty && "pb-11",
          "[&_.ProseMirror]:min-h-[96px] [&_.ProseMirror]:outline-none",
        )}
      >
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="min-h-[96px]" aria-hidden />
        )}
      </div>
      {dirty ? (
        <div className="absolute bottom-2 right-2 z-10">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
