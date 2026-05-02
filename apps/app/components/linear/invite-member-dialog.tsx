"use client";

import { PlusIcon } from "lucide-react";

import { InviteMemberForm } from "@/components/linear/invite-member-form";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

export function InviteMemberDialog({ slug }: { slug: string }) {
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
        </DialogHeader>
        <InviteMemberForm slug={slug} className="border-0 p-0 shadow-none" />
      </DialogContent>
    </Dialog>
  );
}
