import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
} from "lucide-react";

import type { SlashCommandItem } from "./slash-command-list";
import {
  SlashCommandList,
  type SlashCommandListHandle,
} from "./slash-command-list";

export type { SlashCommandItem } from "./slash-command-list";

export const slashCommandPluginKey = new PluginKey("issueSlashCommand");

function filterSlashItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const hay = `${item.title} ${item.description ?? ""} ${item.keywords?.join(" ") ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function buildSlashItems(): SlashCommandItem[] {
  return [
    {
      title: "Paragraph",
      description: "Normal text",
      keywords: ["text", "plain"],
      icon: Pilcrow,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      keywords: ["h1", "title"],
      icon: Heading1,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      keywords: ["h2", "subtitle"],
      icon: Heading2,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      keywords: ["h3"],
      icon: Heading3,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
    },
    {
      title: "Bulleted list",
      description: "Create a bullet list",
      keywords: ["unordered", "ul"],
      icon: List,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered list",
      description: "Create a numbered list",
      keywords: ["ordered", "ol"],
      icon: ListOrdered,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "To-do list",
      description: "Track tasks with checkboxes",
      keywords: ["task", "checkbox"],
      icon: ListTodo,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote",
      keywords: ["blockquote", "citation"],
      icon: Quote,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Code block",
      description: "Capture a code snippet",
      keywords: ["pre", "snippet"],
      icon: Code2,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Separate content",
      keywords: ["horizontal", "rule", "hr"],
      icon: Minus,
      execute: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
}

export const SlashCommand = Extension.create({
  name: "issueSlashCommand",

  addProseMirrorPlugins() {
    const slashItems = buildSlashItems();

    let component: ReactRenderer<SlashCommandListHandle> | null = null;
    let cleanupPositionListeners: (() => void) | null = null;

    const updatePosition = (clientRect: (() => DOMRect | null) | null | undefined) => {
      if (!component) return;
      const rect = clientRect?.();
      if (!rect) return;
      const margin = 8;
      const width = 280;
      const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
      Object.assign(component.element.style, {
        position: "fixed",
        left: `${left}px`,
        top: `${rect.bottom + margin}px`,
        width: `${width}px`,
        zIndex: "50",
      });
    };

    return [
      Suggestion({
        pluginKey: slashCommandPluginKey,
        editor: this.editor,
        char: "/",
        allowedPrefixes: null,
        items: ({ query }) => filterSlashItems(slashItems, query),
        command: ({ editor, range, props }) => {
          props.execute({ editor, range });
        },
        render: () => ({
          onStart: (props) => {
            component = new ReactRenderer(SlashCommandList, {
              editor: props.editor,
              props: {
                ...props,
                items: props.items,
              },
              as: "div",
              className: "slash-command-root",
            });

            component.element.style.pointerEvents = "auto";
            document.body.appendChild(component.element);
            updatePosition(props.clientRect ?? null);

            const onScrollOrResize = () => updatePosition(props.clientRect ?? null);
            window.addEventListener("scroll", onScrollOrResize, true);
            window.addEventListener("resize", onScrollOrResize);
            cleanupPositionListeners = () => {
              window.removeEventListener("scroll", onScrollOrResize, true);
              window.removeEventListener("resize", onScrollOrResize);
            };
          },

          onUpdate: (props) => {
            component?.updateProps(props);
            updatePosition(props.clientRect ?? null);
          },

          onKeyDown: (keyDownProps) => {
            if (keyDownProps.event.key === "Escape") {
              keyDownProps.event.preventDefault();
              return true;
            }
            return component?.ref?.onKeyDown(keyDownProps) ?? false;
          },

          onExit: () => {
            cleanupPositionListeners?.();
            cleanupPositionListeners = null;
            component?.destroy();
            component = null;
          },
        }),
      }),
    ];
  },
});
