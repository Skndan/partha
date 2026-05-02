"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import type { SuggestionKeyDownProps } from "@tiptap/suggestion";

import { cn } from "@/lib/utils";

export type SlashCommandItem = {
  title: string;
  description?: string;
  keywords?: string[];
  icon?: LucideIcon;
  execute: (opts: { editor: Editor; range: Range }) => void;
};

export type SlashCommandListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: Editor;
};

export const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
  function SlashCommandList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(
        `[data-slash-index="${selectedIndex}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedIndex((i) => (items.length === 0 ? 0 : (i + items.length - 1) % items.length));
          return true;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
          No matches
        </div>
      );
    }

    return (
      <div
        ref={scrollRef}
        className={cn(
          "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "max-h-[min(320px,calc(100vh-48px))] overflow-y-auto",
        )}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const selected = index === selectedIndex;
          return (
            <button
              key={item.title}
              type="button"
              data-slash-index={index}
              className={cn(
                "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors",
                selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/80",
              )}
              onClick={() => command(item)}
            >
              {Icon ? (
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                {item.description ? (
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
