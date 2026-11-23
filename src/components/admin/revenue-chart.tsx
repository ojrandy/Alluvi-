"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatGBP } from "@/lib/format";

export type RevenueChartPoint = { day: string; label: string; revenuePence: number; orders: number };

const compactGBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1 });

/** Loaded only on the client via revenue-chart-lazy.tsx (recharts stays out of the server bundle and first paint). */
export default function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(pence: number) => compactGBP.format(pence / 100)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip cursor={{ stroke: "var(--border)" }} content={ChartTooltip} />
        <Area
          type="monotone"
          dataKey="revenuePence"
          name="Revenue"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#revenue-fill)"
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-1)" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({ active, payload }: Pick<TooltipContentProps, "active" | "payload">) {
  const point = payload?.[0]?.payload as RevenueChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-popover-foreground">{point.label}</p>
      <p className="mt-1 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{formatGBP(point.revenuePence)}</span> · {point.orders}{" "}
        {point.orders === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
