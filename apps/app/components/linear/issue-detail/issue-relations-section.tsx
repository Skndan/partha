"use client";

import { useState } from "react";
import { Loader2, Unlink2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";

export type IssueRelationItem = {
  id: string;
  direction: "incoming" | "outgoing";
  type: "blocks" | "blocked_by" | "relates_to" | "duplicate_of";
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
};

function relationLabel(relation: IssueRelationItem) {
  const type = relation.type.replaceAll("_", " ");
  return relation.direction === "outgoing" ? type : `is ${type}`;
}

export function IssueRelationsSection({
  slug,
  issueId,
  relations,
}: {
  slug: string;
  issueId: string;
  relations: IssueRelationItem[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function removeRelation(relationId: string) {
    setLoadingId(relationId);
    try {
      const res = await fetch(`/api/workspaces/${slug}/issues/${issueId}/relations?relationId=${relationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Unable to remove relation");
        return;
      }
      toast.success("Relation removed");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/50 p-3 text-sm font-medium">Relations</div>
      <div className="divide-y">
        {relations.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No relations yet.</p>
        ) : (
          relations.map((relation) => (
            <div key={relation.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{relationLabel(relation)}</p>
                <Link
                  href={`/${slug}/issues/${encodeURIComponent(relation.issueId)}`}
                  className="truncate text-sm font-medium underline-offset-4 hover:underline"
                >
                  {relation.issueIdentifier} — {relation.issueTitle}
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => void removeRelation(relation.id)}
                disabled={loadingId === relation.id}
                aria-label="Remove relation"
              >
                {loadingId === relation.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Unlink2 className="size-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
