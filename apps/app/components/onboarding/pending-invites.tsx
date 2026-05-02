"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";

type PendingInvite = {
  token: string;
  workspaceName: string;
  role: "owner" | "admin" | "member";
  expiresAt: string;
};

export function PendingInvites({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [loadingToken, setLoadingToken] = useState<string | null>(null);

  async function acceptInvite(token: string) {
    setLoadingToken(token);
    const res = await fetch(`/api/workspace-invites/${token}/accept`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.error ?? "Failed to accept invite");
      setLoadingToken(null);
      return;
    }

    toast.success("Joined workspace");
    if (data?.slug) {
      router.push(`/${data.slug}`);
    } else {
      router.refresh();
    }
  }

  if (!invites.length) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium">Pending invites</h3>
      <div className="mt-3 space-y-3">
        {invites.map((invite) => (
          <div key={invite.token} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="font-medium">{invite.workspaceName}</p>
              <p className="text-xs text-muted-foreground">
                Role: <span className="capitalize">{invite.role}</span> · Expires{" "}
                {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => acceptInvite(invite.token)}
              disabled={loadingToken === invite.token}
            >
              {loadingToken === invite.token ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Joining
                </>
              ) : (
                "Accept invite"
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
