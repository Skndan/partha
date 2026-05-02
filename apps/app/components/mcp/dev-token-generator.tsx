"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";

const DevTokenFormSchema = z.object({
  client_id: z.string().trim().min(1, "Client ID is required"),
  workspace_slug: z.string().trim().optional(),
  scope: z.string().trim().optional(),
});

type DevTokenFormValues = z.infer<typeof DevTokenFormSchema>;

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export function DevTokenGenerator() {
  const tokenTextareaId = useId();
  const exportTextareaId = useId();
  const [result, setResult] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<DevTokenFormValues>({
    resolver: zodResolver(DevTokenFormSchema),
    defaultValues: {
      client_id: "local-dev-ui",
      workspace_slug: "",
      scope: "mcp:read workspace:read",
    },
  });

  async function onSubmit(values: DevTokenFormValues) {
    setResult(null);
    setError(null);
    setCopied(false);

    const response = await fetch("/api/dev/mcp/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error_description ?? payload?.error ?? "Failed to mint token");
      return;
    }

    setResult(payload as TokenResponse);
  }

  const exportCommand = result
    ? `export MCP_ACCESS_TOKEN="${result.access_token}"`
    : "";

  async function copyExportCommand() {
    if (!exportCommand) {
      return;
    }
    await navigator.clipboard.writeText(exportCommand);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Development MCP Token</CardTitle>
        <CardDescription>
          Generates a short-lived OAuth access token for local MCP testing only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input placeholder="local-dev-ui" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workspace_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Slug (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="my-workspace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scopes</FormLabel>
                  <FormControl>
                    <Input placeholder="mcp:read workspace:read" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating
                </>
              ) : (
                "Generate Token"
              )}
            </Button>
          </form>
        </Form>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {result ? (
          <div className="space-y-2">
            <Label htmlFor={tokenTextareaId}>MCP Access Token</Label>
            <Textarea
              id={tokenTextareaId}
              readOnly
              value={result.access_token}
              className="min-h-24"
            />
            <Label htmlFor={exportTextareaId}>Shell Export Command</Label>
            <Textarea
              id={exportTextareaId}
              readOnly
              value={exportCommand}
              className="min-h-16"
            />
            <Button type="button" variant="secondary" onClick={copyExportCommand}>
              {copied ? "Copied" : "Copy Export Command"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
