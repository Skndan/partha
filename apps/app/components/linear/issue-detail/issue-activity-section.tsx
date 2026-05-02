"use client";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { formatActivityMessage } from "@/lib/linear/activity-format";
import { cn } from "@/lib/utils";

export type IssueActivityEvent = {
  id: string;
  type: string;
  payload?: unknown;
  createdAt: Date | string;
  actorName: string;
};

type IssueActivitySectionProps = {
  events: IssueActivityEvent[];
};

export function IssueActivitySection({ events }: IssueActivitySectionProps) {
  return (
    <Collapsible defaultOpen={false} className="rounded-lg border">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 bg-muted/50 p-3 text-left text-sm font-medium rounded-t-lg outline-none",
          "hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50",
          "[&[data-state=open]>svg]:rotate-180",
        )}
      >
        <span>Activity</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground last:rounded-b-lg"
          >
            <div className="flex gap-2 space-y-1">
              <p className="font-medium">{event.actorName}</p>
              <p>{formatActivityMessage(event.type, event.payload)}</p>
            </div>
            <span title={new Date(event.createdAt).toLocaleString()}>
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
