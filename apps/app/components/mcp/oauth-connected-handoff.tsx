"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

type OAuthConnectedHandoffProps = {
  handoffUrl: string;
};

export function OAuthConnectedHandoff({ handoffUrl }: OAuthConnectedHandoffProps) {
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    const launch = window.setTimeout(() => {
      window.location.assign(handoffUrl);
    }, 100);

    const done = window.setTimeout(() => {
      setIsLaunching(false);
      window.close();
    }, 1200);

    return () => {
      window.clearTimeout(launch);
      window.clearTimeout(done);
    };
  }, [handoffUrl]);

  return (
    <div className="space-y-4">
      {isLaunching ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Opening Cursor...
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="size-4" />
          Connected successfully.
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        If this tab does not close automatically, you can close it now and continue in Cursor.
      </p>

      <div className="flex gap-2">
        <Button type="button" onClick={() => window.location.assign(handoffUrl)}>
          Open Cursor Again
        </Button>
        <Button type="button" variant="outline" onClick={() => window.close()}>
          Close Tab
        </Button>
      </div>
    </div>
  );
}
