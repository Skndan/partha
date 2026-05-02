"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@workspace/ui/lib/utils";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const chartId = React.useId();
  const domId = `chart-${id || chartId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={config}>
      <div data-slot="chart" data-chart={domId} className={cn("h-[220px] w-full", className)} {...props}>
        <style
          dangerouslySetInnerHTML={{
            __html: Object.entries(config)
              .map(([key, value]) =>
                value.color
                  ? `[data-chart=${domId}]{--color-${key}:${value.color};}[data-chart=${domId}] .color-${key}{color:${value.color};fill:${value.color};}`
                  : "",
              )
              .join(""),
          }}
        />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartTooltip(props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: string | number }>;
  label?: string | number;
}) {
  const config = useChart();
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="border border-border bg-card px-3 py-2 text-xs shadow-sm">
      {label ? <p className="mb-1 text-muted-foreground">{String(label)}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? "");
          const row = config[key];
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{row?.label ?? key}</span>
              <span className={cn("font-medium", `color-${key}`)}>{item.value as React.ReactNode}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
