"use client";

import { PlusIcon } from "lucide-react";

import { CreateTeamForm } from "@/components/linear/create-team-form";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

export function CreateTeamDialog({ slug }: { slug: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          Create team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
        </DialogHeader>
        <CreateTeamForm slug={slug} className="border-0 p-0 shadow-none" />
      </DialogContent>
    </Dialog>
  );
}
