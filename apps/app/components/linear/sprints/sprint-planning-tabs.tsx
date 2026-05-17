"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

import type { SprintGanttIssueInput } from "@/components/linear/sprints/sprint-gantt";
import { SprintGanttBoard } from "@/components/linear/sprints/sprint-gantt";
import type { SprintKanbanColumn, SprintKanbanItem } from "@/components/linear/sprints/sprint-kanban";
import { SprintKanbanBoard } from "@/components/linear/sprints/sprint-kanban";

export function SprintPlanningTabs({
  slug,
  sprintStart,
  sprintEnd,
  sprintStartMarkerLabel,
  sprintEndMarkerLabel,
  issuesFingerprint,
  kanbanColumns,
  kanbanItems,
  ganttIssues,
}: {
  slug: string;
  sprintStart: string;
  sprintEnd: string;
  sprintStartMarkerLabel: string;
  sprintEndMarkerLabel: string;
  issuesFingerprint: string;
  kanbanColumns: SprintKanbanColumn[];
  kanbanItems: SprintKanbanItem[];
  ganttIssues: SprintGanttIssueInput[];
}) {
  return (
    <Tabs className="w-full" defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Kanban</TabsTrigger>
        <TabsTrigger value="gantt">Gantt</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-4 min-h-[480px]" value="kanban">
        <SprintKanbanBoard
          columns={kanbanColumns}
          items={kanbanItems}
          key={`kanban-${issuesFingerprint}`}
          slug={slug}
        />
      </TabsContent>
      <TabsContent className="mt-4 min-h-[480px]" value="gantt">
        <SprintGanttBoard
          issues={ganttIssues}
          issuesFingerprint={issuesFingerprint}
          slug={slug}
          sprintEnd={sprintEnd}
          sprintEndMarkerLabel={sprintEndMarkerLabel}
          sprintStart={sprintStart}
          sprintStartMarkerLabel={sprintStartMarkerLabel}
        />
      </TabsContent>
    </Tabs>
  );
}
