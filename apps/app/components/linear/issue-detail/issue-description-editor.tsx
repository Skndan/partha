"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { createMarkdownDescriptionExtensions } from "@/components/linear/markdown-description/extensions";
import { getMarkdown } from "@/components/linear/markdown-description/get-markdown";
import {
  markdownDescriptionEditableProseClassNames,
  markdownDescriptionMirrorTypographyClassNames,
} from "@/components/linear/markdown-description/typography";
import { DESCRIPTION_MARKDOWN_MAX } from "@/lib/constants/description-markdown";
import { patchIssue } from "@/lib/linear/patch-issue-client";
import { cn } from "@/lib/utils";

type IssueDescriptionEditorProps = {
  slug: string;
  issueId: string;
  description: string;
  editorKey: string;
};

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
      extensions: createMarkdownDescriptionExtensions(),
      content: description,
      editorProps: {
        attributes: {
          class: markdownDescriptionEditableProseClassNames(),
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
        if (md.length > DESCRIPTION_MARKDOWN_MAX) {
          const clipped = md.slice(0, DESCRIPTION_MARKDOWN_MAX);
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
    if (md.length > DESCRIPTION_MARKDOWN_MAX) {
      md = md.slice(0, DESCRIPTION_MARKDOWN_MAX);
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
        markdownDescriptionMirrorTypographyClassNames(),
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
