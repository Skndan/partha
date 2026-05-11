"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import type { GanttFeature } from "@workspace/ui/components/kibo-ui/gantt";
import {
  GanttFeatureList,
  GanttFeatureRow,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from "@workspace/ui/components/kibo-ui/gantt";

import { patchIssue } from "@/lib/linear/patch-issue-client";

export type SprintGanttIssueInput = {
  id: string;
  identifier: string;
  title: string;
  statusId: string;
  statusName: string;
  statusColor: string;
  startDate: string | null;
  dueDate: string | null;
};

function parseDay(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function buildFeatures(
  rows: SprintGanttIssueInput[],
  sprintStart: string,
  sprintEnd: string,
): GanttFeature[] {
  const sprintStartAt = parseDay(sprintStart);
  const sprintEndAt = parseDay(sprintEnd);

  return rows.map((row) => {
    const startAt = row.startDate ? parseDay(row.startDate) : sprintStartAt;
    let endAt = row.dueDate ? parseDay(row.dueDate) : sprintEndAt;
    if (endAt < startAt) {
      endAt = startAt;
    }
    return {
      id: row.id,
      name: `${row.identifier} · ${row.title}`,
      startAt,
      endAt,
      status: {
        id: row.statusId,
        name: row.statusName,
        color: row.statusColor,
      },
    };
  });
}

export function SprintGanttBoard({
  slug,
  sprintStart,
  sprintEnd,
  sprintStartMarkerLabel,
  sprintEndMarkerLabel,
  issuesFingerprint,
  issues,
}: {
  slug: string;
  sprintStart: string;
  sprintEnd: string;
  sprintStartMarkerLabel: string;
  sprintEndMarkerLabel: string;
  issuesFingerprint: string;
  issues: SprintGanttIssueInput[];
}) {
  const router = useRouter();

  const features = useMemo(
    () => buildFeatures(issues, sprintStart, sprintEnd),
    [issues, sprintStart, sprintEnd],
  );

  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    void (async () => {
      const startDate = format(startAt, "yyyy-MM-dd");
      const dueDate = endAt ? format(endAt, "yyyy-MM-dd") : null;
      const ok = await patchIssue(slug, id, { startDate, dueDate }, { silentSuccess: true });
      if (ok) router.refresh();
    })();
  };

  return (
    <div className="h-[min(720px,calc(100vh-12rem))] w-full min-h-[420px]" key={issuesFingerprint}>
      <GanttProvider className="h-full" range="daily" zoom={100}>
        <GanttSidebar>
          <GanttSidebarGroup name="">
            {features.map((feature) => (
              <GanttSidebarItem feature={feature} key={feature.id} />
            ))}
          </GanttSidebarGroup>
        </GanttSidebar>
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {features.map((feature) => (
              <GanttFeatureRow
                features={[feature]}
                key={feature.id}
                onMove={handleMove}
              >
                {(f) => (
                  <Link
                    className="flex-1 truncate text-primary text-xs underline-offset-4 hover:underline"
                    href={`/${slug}/issues/${f.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {f.name}
                  </Link>
                )}
              </GanttFeatureRow>
            ))}
            <GanttMarker date={parseDay(sprintStart)} id="sprint-start" label={sprintStartMarkerLabel} />
            <GanttMarker date={parseDay(sprintEnd)} id="sprint-end" label={sprintEndMarkerLabel} />
            <GanttToday />
          </GanttFeatureList>
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}
