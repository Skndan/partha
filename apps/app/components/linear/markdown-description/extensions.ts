import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

import { SlashCommand } from "@/components/linear/issue-detail/slash-command";

export type CreateMarkdownDescriptionExtensionsOptions = {
  slashCommand?: boolean;
  placeholder?: string;
};

export function createMarkdownDescriptionExtensions(
  options: CreateMarkdownDescriptionExtensionsOptions = {},
) {
  const {
    slashCommand = true,
    placeholder = "Write a description… Type '/' for commands",
  } = options;

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder }),
    Markdown.configure({
      html: false,
      breaks: true,
      transformPastedText: true,
    }),
    ...(slashCommand ? [SlashCommand] : []),
  ];
}
