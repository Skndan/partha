"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@workspace/ui/components/button";

export function OAuthAuthorizeAccountSwitcher({ callbackURL }: { callbackURL: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSwitchAccount() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          const loginUrl = `/login?callbackURL=${encodeURIComponent(callbackURL)}`;
          window.location.assign(loginUrl);
        },
        onError: () => {
          setIsLoading(false);
        },
      },
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleSwitchAccount} disabled={isLoading}>
      <LogOut className="size-4" />
      {isLoading ? "Switching..." : "Use a different account"}
    </Button>
  );
}
