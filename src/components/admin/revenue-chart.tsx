"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatGBP } from "@/lib/format";

export type RevenueChartPoint = { day: string; label: string; revenuePence: number; orders: number };
export type ChartMetric = "revenuePence" | "orders";

const compactGBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1 });
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

/**
 * Loaded only on the client via revenue-chart-lazy.tsx (recharts stays out of the server bundle and
 * first paint). Bars for short ranges (each day is readable), a smooth area for 90 days.
 * Animation is off: switching range or metric must feel instant, not tween.
 */
export default function RevenueChart({ data, metric }: { data: RevenueChartPoint[]; metric: ChartMetric }) {
  const bars = data.length <= 31;
  const yFormat = (v: number) => (metric === "revenuePence" ? compactGBP.format(v / 100) : v.toLocaleString("en-GB"));
  const common = {
    data,
    margin: { top: 8, right: 4, bottom: 0, left: 0 },
    accessibilityLayer: true,
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={bars ? 8 : 28} tick={AXIS_TICK} />
      <YAxis width={56} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={yFormat} tick={AXIS_TICK} />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {bars ? (
        <BarChart {...common} barCategoryGap={data.length <= 7 ? "28%" : "18%"}>
          {axes}
          <Tooltip cursor={{ fill: "var(--muted)", radius: 8 }} content={ChartTooltip} />
          <Bar dataKey={metric} name={metric === "orders" ? "Orders" : "Revenue"} fill="var(--chart-1)" radius={[6, 6, 2, 2]} maxBarSize={44} isAnimationActive={false} />
        </BarChart>
      ) : (
        <AreaChart {...common}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {axes}
          <Tooltip cursor={{ stroke: "var(--input)" }} content={ChartTooltip} />
          <Area
            type="monotone"
            dataKey={metric}
            name={metric === "orders" ? "Orders" : "Revenue"}
            stroke="var(--chart-1)"
            strokeWidth={2.25}
            fill="url(#revenue-fill)"
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-1)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

function ChartTooltip({ active, payload }: Pick<TooltipContentProps, "active" | "payload">) {
  const point = payload?.[0]?.payload as RevenueChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-popover px-3 py-2.5 text-xs shadow-lg">
      <p className="font-medium text-muted-foreground">{point.label}</p>
      <p className="mt-1 text-sm font-semibold text-popover-foreground tabular-nums">{formatGBP(point.revenuePence)}</p>
      <p className="text-muted-foreground tabular-nums">
        {point.orders} paid {point.orders === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
