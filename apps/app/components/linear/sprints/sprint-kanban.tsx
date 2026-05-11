"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanColumnProps,
  type KanbanItemProps,
} from "@workspace/ui/components/kibo-ui/kanban";

import { patchIssue } from "@/lib/linear/patch-issue-client";

export type SprintKanbanColumn = KanbanColumnProps;

export type SprintKanbanItem = KanbanItemProps & {
  identifier: string;
  slug: string;
};

export function SprintKanbanBoard({
  slug,
  columns,
  items,
}: {
  slug: string;
  columns: SprintKanbanColumn[];
  items: SprintKanbanItem[];
}) {
  const router = useRouter();
  const [data, setData] = useState(items);

  const columnIds = useMemo(() => new Set(columns.map((c) => c.id)), [columns]);

  return (
    <KanbanProvider
      className="min-h-[420px]"
      columns={columns}
      data={data}
      onDataChange={(next) => {
        const prevById = new Map(data.map((row) => [row.id, row]));
        void (async () => {
          for (const row of next) {
            const prev = prevById.get(row.id);
            if (prev && prev.column !== row.column && columnIds.has(row.column)) {
              const ok = await patchIssue(
                slug,
                row.id,
                { statusId: row.column },
                { silentSuccess: true },
              );
              if (!ok) {
                return;
              }
            }
          }
          setData(next);
          router.refresh();
        })();
      }}
    >
      {(column) => (
        <KanbanBoard className="bg-background" id={column.id} key={column.id}>
          <KanbanHeader>{column.name}</KanbanHeader>
          <KanbanCards id={column.id}>
            {(item) => {
              const sprintItem = item as SprintKanbanItem;
              return (
                <KanbanCard {...item}>
                  <div className="space-y-1">
                    <Link
                      className="font-mono text-muted-foreground text-xs underline-offset-4 hover:underline"
                      href={`/${slug}/issues/${sprintItem.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sprintItem.identifier}
                    </Link>
                    <p className="m-0 font-medium text-sm">{sprintItem.name}</p>
                  </div>
                </KanbanCard>
              );
            }}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
