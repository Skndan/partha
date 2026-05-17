"use client";

import { PlusIcon } from "lucide-react";

import { InviteMemberForm } from "@/components/linear/invite-member-form";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

export type InviteMemberTeamOption = { id: string; name: string; key: string };

export function InviteMemberDialog({
  slug,
  workspaceName,
  teams,
}: {
  slug: string;
  workspaceName: string;
  teams: InviteMemberTeamOption[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            People you invite join <span className="font-medium text-foreground">{workspaceName}</span>{" "}
            only when they accept. They will not get access to other workspaces.
          </DialogDescription>
        </DialogHeader>
        <InviteMemberForm slug={slug} teams={teams} className="border-0 p-0 shadow-none" />
      </DialogContent>
    </Dialog>
  );
}
