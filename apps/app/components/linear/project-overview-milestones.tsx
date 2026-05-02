"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { CreateMilestoneForm } from "@/components/linear/create-milestone-form";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

type MilestoneRow = {
  id: string;
  name: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed" | "archived";
  targetDate: string | null;
  projectId: string | null;
};

export function ProjectOverviewMilestones({
  slug,
  project,
  milestones,
}: {
  slug: string;
  project: { id: string; name: string };
  milestones: MilestoneRow[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMilestone, setEditMilestone] = useState<MilestoneRow | null>(null);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-3 border-b p-3">
        <p className="text-sm font-medium">Milestones</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          New milestone
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="p-3 font-medium">Milestone</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Target Date</th>
            <th className="w-24 p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description ?? "-"}</p>
              </td>
              <td className="p-3 capitalize">{item.status.replace("_", " ")}</td>
              <td className="p-3">{item.targetDate ?? "-"}</td>
              <td className="p-3">
                <Button variant="ghost" size="sm" onClick={() => setEditMilestone(item)}>
                  <PencilIcon className="mr-2 size-4" />
                  Edit
                </Button>
              </td>
            </tr>
          ))}
          {!milestones.length ? (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={4}>
                No milestones for this project yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create milestone</DialogTitle>
            <DialogDescription>
              Milestones created here are automatically linked to {project.name}.
            </DialogDescription>
          </DialogHeader>
          <CreateMilestoneForm
            slug={slug}
            projects={[project]}
            lockProjectId={project.id}
            hideProjectField
            title="Details"
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editMilestone)} onOpenChange={(open) => !open && setEditMilestone(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit milestone</DialogTitle>
            <DialogDescription>
              Update milestone details for {project.name}.
            </DialogDescription>
          </DialogHeader>
          {editMilestone ? (
            <CreateMilestoneForm
              slug={slug}
              projects={[project]}
              mode="update"
              milestoneId={editMilestone.id}
              lockProjectId={project.id}
              hideProjectField
              title="Details"
              initialValues={{
                name: editMilestone.name,
                description: editMilestone.description ?? "",
                projectId: editMilestone.projectId,
                status: editMilestone.status,
                targetDate: editMilestone.targetDate,
              }}
              onSuccess={() => setEditMilestone(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
