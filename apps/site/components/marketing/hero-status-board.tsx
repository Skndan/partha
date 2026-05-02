"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { coreAppUrl } from "@/lib/core-app-url";
import { Pill } from "@/components/kibo-ui/pill";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@workspace/ui/components/chart";

const projectStatuses = [
  { label: "Backlog", count: 8, variant: "secondary" as const },
  { label: "In progress", count: 14, variant: "default" as const },
  { label: "Completed", count: 22, variant: "outline" as const },
  { label: "Blocked", count: 3, variant: "destructive" as const },
];

const ageingData = [
  { bucket: "<1d", count: 18 },
  { bucket: "1–3d", count: 24 },
  { bucket: "3–7d", count: 11 },
  { bucket: "7d+", count: 6 },
];

const chartConfig = {
  count: { label: "Open issues", color: "var(--chart-2)" },
};

const activity = [
  { title: "Payment webhook retries", meta: "CORE · moved to In progress", time: "12m" },
  { title: "OAuth scope audit", meta: "AUTH · comment", time: "1h" },
  { title: "Milestone Beta cut", meta: "SHIP · date shifted +3d", time: "3h" },
];

export function HeroStatusBoard() {
  return (
    <section className="from-muted/40 to-background bg-linear-to-b px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Plan · Analyze · Reach · Track · Harness · Accelerate
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            One canvas for product status — built for SaaS teams and AI copilots.
          </h1>
          <p className="text-muted-foreground text-lg">
            Partha routes every initiative through workspaces, teams, and delivery lanes so you always
            see ageing, risk, and throughput — today from the app; tomorrow wired to GitHub, billing,
            analytics, and launch channels.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={coreAppUrl("/signup")}>Create a workspace</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/mcp">Connect via MCP</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project throughput</CardTitle>
              <CardDescription>Status mix across active initiatives</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {projectStatuses.map((row) => (
                <Pill key={row.label} variant={row.variant} className="font-normal">
                  <span>{row.label}</span>
                  <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
                    {row.count}
                  </Badge>
                </Pill>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-1">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Issue ageing</CardTitle>
              <CardDescription>Open work by days since last touch</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart accessibilityLayer data={ageingData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-muted-foreground text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live activity</CardTitle>
              <CardDescription>What moved while you were shipping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.map((item) => (
                <div key={item.title} className="border-border flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="bg-muted text-muted-foreground flex h-9 w-14 shrink-0 items-center justify-center rounded-md text-xs font-medium">
                    {item.time}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-foreground truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">{item.meta}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
