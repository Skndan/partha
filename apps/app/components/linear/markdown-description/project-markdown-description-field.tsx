"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import { DESCRIPTION_MARKDOWN_MAX } from "@/lib/constants/description-markdown";
import { cn } from "@/lib/utils";

import { createMarkdownDescriptionExtensions } from "./extensions";
import { getMarkdown } from "./get-markdown";
import {
  markdownDescriptionEditableProseClassNames,
  markdownDescriptionMirrorTypographyClassNames,
} from "./typography";

type ProjectMarkdownDescriptionFieldProps = {
  value: string;
  onChange: (markdown: string) => void;
  editorKey: string;
};

export function ProjectMarkdownDescriptionField({
  value,
  onChange,
  editorKey,
}: ProjectMarkdownDescriptionFieldProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: createMarkdownDescriptionExtensions({
        placeholder: "Project context… Type '/' for commands",
      }),
      content: value,
      editorProps: {
        attributes: {
          class: markdownDescriptionEditableProseClassNames(),
        },
      },
      onUpdate: ({ editor: ed }) => {
        let md = getMarkdown(ed);
        if (md.length > DESCRIPTION_MARKDOWN_MAX) {
          const clipped = md.slice(0, DESCRIPTION_MARKDOWN_MAX);
          ed.commands.setContent(clipped);
          md = clipped;
        }
        onChange(md);
      },
    },
    [editorKey],
  );

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 px-2 py-2 text-sm leading-relaxed text-foreground",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50",
        markdownDescriptionMirrorTypographyClassNames(),
      )}
    >
      <div className="min-h-[120px] [&_.ProseMirror]:min-h-[96px] [&_.ProseMirror]:outline-none">
        {editor ? <EditorContent editor={editor} /> : <div className="min-h-[96px]" aria-hidden />}
      </div>
    </div>
  );
}
