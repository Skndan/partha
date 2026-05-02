"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronDown, ChevronsUpDown, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Status, StatusIndicator, StatusLabel } from "@/components/kibo-ui/status";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@/lib/utils";
import { patchIssue } from "@/lib/linear/patch-issue-client";

type PillStatusVariant = "online" | "offline" | "maintenance" | "degraded";

function getIssueStatusVariant(statusName: string): PillStatusVariant {
  const normalizedStatus = statusName.toLowerCase();
  if (normalizedStatus.includes("done") || normalizedStatus.includes("completed")) {
    return "online";
  }
  if (normalizedStatus.includes("cancel") || normalizedStatus.includes("blocked")) {
    return "offline";
  }
  if (
    normalizedStatus.includes("progress") ||
    normalizedStatus.includes("review") ||
    normalizedStatus.includes("test")
  ) {
    return "maintenance";
  }
  return "degraded";
}

function getPriorityVariant(priority: "none" | "low" | "medium" | "high" | "urgent"): PillStatusVariant {
  if (priority === "urgent" || priority === "high") return "offline";
  if (priority === "medium") return "maintenance";
  if (priority === "low") return "degraded";
  return "online";
}

const PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;

const ESTIMATE_PRESETS = [0, 1, 2, 3, 5, 8, 13, 21] as const;

const RELATION_TYPES = [
  { value: "blocks" as const, label: "Blocks" },
  { value: "blocked_by" as const, label: "Blocked by" },
  { value: "relates_to" as const, label: "Relates to" },
  { value: "duplicate_of" as const, label: "Duplicate of" },
];

export type IssuePropertiesPanelProps = {
  slug: string;
  issueId: string;
  statusId: string;
  statusName: string;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  estimate: number | null;
  teamId: string | null;
  teamName: string;
  projectId: string | null;
  projectName: string;
  milestoneId: string | null;
  milestoneName: string;
  assigneeId: string | null;
  assigneeName: string;
  dueDate: string | Date | null;
  labelIds: string[];
  parentIssueId: string | null;
  parentIssueLabel: string;
  statuses: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  milestones: { id: string; name: string; projectId: string | null }[];
  members: { id: string; name: string }[];
  labels: { id: string; name: string; color: string }[];
  issues: { id: string; identifier: string; title: string }[];
};

const PillButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
>(function PillButton({ className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-secondary px-2.5 py-1 text-left text-xs font-medium transition-colors",
        "hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronsUpDown className="size-3 shrink-0 opacity-50" aria-hidden />
    </button>
  );
});

function PropertiesSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-t-lg bg-muted/40 p-3 text-left text-sm font-medium outline-none",
          "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50",
          "[&[data-state=open]>svg]:rotate-180",
        )}
      >
        <span>{title}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 p-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function IssuePropertiesPanel(props: IssuePropertiesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const runPatch = useCallback(
    async (body: Record<string, unknown>) => {
      const ok = await patchIssue(props.slug, props.issueId, body);
      if (ok) {
        startTransition(() => {
          router.refresh();
        });
      }
      return ok;
    },
    [props.issueId, props.slug, router],
  );

  const [labelIds, setLabelIds] = useState(props.labelIds);
  const [relationType, setRelationType] = useState<(typeof RELATION_TYPES)[number]["value"] | null>(
    null,
  );
  const [relationTargetId, setRelationTargetId] = useState<string | null>(null);
  const [duePopoverOpen, setDuePopoverOpen] = useState(false);

  const dueDateIso = useMemo(() => {
    if (props.dueDate == null) return null;
    return typeof props.dueDate === "string"
      ? props.dueDate
      : format(props.dueDate, "yyyy-MM-dd");
  }, [props.dueDate]);

  const relationTargetIssue = useMemo(
    () => (relationTargetId ? props.issues.find((i) => i.id === relationTargetId) ?? null : null),
    [props.issues, relationTargetId],
  );

  useEffect(() => {
    setLabelIds(props.labelIds);
  }, [props.labelIds]);

  const milestonesForProject = useMemo(() => {
    const pid = props.projectId;
    if (!pid) return [];
    return props.milestones.filter((m) => m.projectId === pid);
  }, [props.milestones, props.projectId]);

  const selectedLabels = useMemo(
    () => props.labels.filter((l) => labelIds.includes(l.id)),
    [props.labels, labelIds],
  );

  const dueSelected = dueDateIso ? new Date(`${dueDateIso}T12:00:00`) : undefined;

  async function toggleLabel(id: string) {
    const next = labelIds.includes(id) ? labelIds.filter((x) => x !== id) : [...labelIds, id];
    setLabelIds(next);
    await runPatch({ labelIds: next });
  }

  async function removeLabel(id: string) {
    const next = labelIds.filter((x) => x !== id);
    setLabelIds(next);
    await runPatch({ labelIds: next });
  }

  async function addRelation() {
    if (!relationType || !relationTargetId) return;
    await runPatch({
      relationType,
      relationTargetIssueId: relationTargetId,
    });
    setRelationType(null);
    setRelationTargetId(null);
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        <PropertiesSection title="Team, Milestone, Project">
          {/* Team */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Team</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span className="truncate">{props.teamName}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Team…" />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="none" onSelect={() => void runPatch({ teamId: null })}>
                        <Check className={cn("mr-2 size-4", props.teamId == null ? "opacity-100" : "opacity-0")} />
                        No team
                      </CommandItem>
                      {props.teams.map((t) => (
                        <CommandItem key={t.id} value={t.name} onSelect={() => void runPatch({ teamId: t.id })}>
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.teamId === t.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {t.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Project</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span className="truncate">{props.projectName}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Project…" />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() =>
                          void runPatch({
                            projectId: null,
                            milestoneId: null,
                          })
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            props.projectId == null ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No project
                      </CommandItem>
                      {props.projects.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            const milestoneStillValid =
                              props.milestoneId &&
                              props.milestones.some(
                                (m) => m.id === props.milestoneId && m.projectId === p.id,
                              );
                            if (milestoneStillValid) {
                              void runPatch({ projectId: p.id });
                            } else {
                              void runPatch({
                                projectId: p.id,
                                milestoneId: null,
                              });
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.projectId === p.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Milestone */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Milestone</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending || !props.projectId} className="w-full justify-between">
                  <span className="truncate">{props.milestoneName}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Milestone…" disabled={!props.projectId} />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        disabled={!props.projectId}
                        onSelect={() => void runPatch({ milestoneId: null })}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            props.milestoneId == null ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No milestone
                      </CommandItem>
                      {milestonesForProject.map((m) => (
                        <CommandItem key={m.id} value={m.name} onSelect={() => void runPatch({ milestoneId: m.id })}>
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.milestoneId === m.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {m.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </PropertiesSection>

        <PropertiesSection title="Status, Priority, Estimate, Due date">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Status</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <Status status={getIssueStatusVariant(props.statusName)} className="border-0 bg-transparent px-0 hover:bg-transparent">
                    <StatusIndicator />
                    <StatusLabel className="capitalize">{props.statusName}</StatusLabel>
                  </Status>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search status…" />
                  <CommandList>
                    <CommandEmpty>No status.</CommandEmpty>
                    <CommandGroup>
                      {props.statuses.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => void runPatch({ statusId: s.id })}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.statusId === s.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Priority</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <Status status={getPriorityVariant(props.priority)} className="border-0 bg-transparent px-0 hover:bg-transparent">
                    <StatusIndicator />
                    <StatusLabel className="capitalize">{props.priority}</StatusLabel>
                  </Status>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Priority…" />
                  <CommandList>
                    <CommandGroup>
                      {PRIORITIES.map((p) => (
                        <CommandItem key={p} value={p} onSelect={() => void runPatch({ priority: p })}>
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.priority === p ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {p}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Estimate */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Estimate</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span>{props.estimate != null ? `${props.estimate} pts` : "No estimate"}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Points…" />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="clear" onSelect={() => void runPatch({ estimate: null })}>
                        <Check className={cn("mr-2 size-4", props.estimate == null ? "opacity-100" : "opacity-0")} />
                        Clear
                      </CommandItem>
                      {ESTIMATE_PRESETS.map((n) => (
                        <CommandItem key={n} value={String(n)} onSelect={() => void runPatch({ estimate: n })}>
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.estimate === n ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {n} pts
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Due date</span>
            <Popover open={duePopoverOpen} onOpenChange={setDuePopoverOpen}>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span className="flex items-center gap-2 truncate">
                    <CalendarIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {dueDateIso
                      ? format(new Date(`${dueDateIso}T12:00:00`), "PP")
                      : "No due date"}
                  </span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueSelected}
                  onSelect={(date) => {
                    if (!date) {
                      void runPatch({ dueDate: null });
                      setDuePopoverOpen(false);
                      return;
                    }
                    void runPatch({ dueDate: format(date, "yyyy-MM-dd") });
                    setDuePopoverOpen(false);
                  }}
                />
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      void runPatch({ dueDate: null });
                      setDuePopoverOpen(false);
                    }}
                  >
                    Clear date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </PropertiesSection>

        <PropertiesSection title="Assignee & Labels" defaultOpen={false}>
          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Assignee</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span className="truncate">{props.assigneeName}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Member…" />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="none" onSelect={() => void runPatch({ assigneeId: null })}>
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            props.assigneeId == null ? "opacity-100" : "opacity-0",
                          )}
                        />
                        Unassigned
                      </CommandItem>
                      {props.members.map((m) => (
                        <CommandItem key={m.id} value={m.name} onSelect={() => void runPatch({ assigneeId: m.id })}>
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              props.assigneeId === m.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {m.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* Labels */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Labels</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedLabels.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                  style={{
                    borderColor: `var(--border)`,
                    backgroundColor: `color-mix(in oklab, ${l.color} 18%, transparent)`,
                  }}
                >
                  {l.name}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-background/50"
                    aria-label={`Remove ${l.name}`}
                    onClick={() => void removeLabel(l.id)}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:bg-muted"
                    aria-label="Add label"
                  >
                    <Plus className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Label…" />
                    <CommandList>
                      <CommandEmpty>No labels.</CommandEmpty>
                      <CommandGroup>
                        {props.labels.map((l) => (
                          <CommandItem key={l.id} value={l.name} onSelect={() => void toggleLabel(l.id)}>
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                labelIds.includes(l.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PropertiesSection>

        <PropertiesSection title="Parent issue & Add relation">
          {/* Parent */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Parent issue</span>
            <Popover>
              <PopoverTrigger asChild>
                <PillButton disabled={pending} className="w-full justify-between">
                  <span className="truncate">{props.parentIssueLabel}</span>
                </PillButton>
              </PopoverTrigger>
              <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Issue…" />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="none" onSelect={() => void runPatch({ parentIssueId: null })}>
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            props.parentIssueId == null ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No parent
                      </CommandItem>
                      {props.issues
                        .filter((i) => i.id !== props.issueId)
                        .map((i) => (
                          <CommandItem
                            key={i.id}
                            value={`${i.identifier} ${i.title}`}
                            onSelect={() => void runPatch({ parentIssueId: i.id })}
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                props.parentIssueId === i.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate">
                              {i.identifier} — {i.title}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Add relation */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Add relation</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <PillButton disabled={pending} className="min-w-0 w-full flex-1 justify-between sm:max-w-[140px]">
                    <span className="truncate">
                      {relationType ? RELATION_TYPES.find((r) => r.value === relationType)?.label : "Type"}
                    </span>
                  </PillButton>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {RELATION_TYPES.map((r) => (
                          <CommandItem key={r.value} value={r.label} onSelect={() => setRelationType(r.value)}>
                            <Check
                              className={cn(
                                "mr-2 size-4",
                                relationType === r.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {r.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <PillButton disabled={pending} className="min-w-0 w-full flex-1 justify-between">
                    <span className="truncate">
                      {relationTargetIssue
                        ? `${relationTargetIssue.identifier} — ${relationTargetIssue.title}`
                        : "Target issue"}
                    </span>
                  </PillButton>
                </PopoverTrigger>
                <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search…" />
                    <CommandList>
                      <CommandGroup>
                        {props.issues
                          .filter((i) => i.id !== props.issueId)
                          .map((i) => (
                            <CommandItem
                              key={i.id}
                              value={`${i.identifier} ${i.title}`}
                              onSelect={() => setRelationTargetId(i.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  relationTargetId === i.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="truncate">
                                {i.identifier} — {i.title}
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                size="sm"
                disabled={pending || !relationType || !relationTargetId}
                onClick={() => void addRelation()}
              >
                Add
              </Button>
            </div>
          </div>
        </PropertiesSection>
      </div>
    </>
  );
}
