"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { createMarkdownDescriptionExtensions } from "./extensions";
import { markdownDescriptionMirrorTypographyClassNames } from "./typography";

type MarkdownDescriptionPreviewProps = {
  markdown: string | null;
  emptyLabel?: string;
};

export function MarkdownDescriptionPreview({
  markdown,
  emptyLabel = "No description provided.",
}: MarkdownDescriptionPreviewProps) {
  const md = markdown?.trim() ?? "";
  if (!md) {
    return <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return <MarkdownDescriptionPreviewBody markdown={md} />;
}

function MarkdownDescriptionPreviewBody({ markdown }: { markdown: string }) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: createMarkdownDescriptionExtensions({
        slashCommand: false,
      }),
      content: markdown,
      editorProps: {
        attributes: {
          class: "max-w-none outline-none text-sm leading-relaxed text-muted-foreground",
        },
      },
    },
    [markdown],
  );

  return (
    <div
      className={cn(
        "mt-2 text-sm leading-relaxed text-muted-foreground",
        markdownDescriptionMirrorTypographyClassNames(),
      )}
    >
      {editor ? <EditorContent editor={editor} /> : null}
    </div>
  );
}
