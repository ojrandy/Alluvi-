"use client";

import { useMemo, useState } from "react";
import { formatGBP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RevenueChartLazy } from "./revenue-chart-lazy";
import type { ChartMetric, RevenueChartPoint } from "./revenue-chart";
import { Delta } from "./ui";

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
] as const;
type Range = (typeof RANGES)[number]["days"];

const METRICS: { key: ChartMetric; label: string }[] = [
  { key: "revenuePence", label: "Revenue" },
  { key: "orders", label: "Orders" },
];

/**
 * Revenue panel body. The server sends the full 90-day series plus the 90 days before it once; range
 * and metric switches are pure client state, so they repaint in a single frame (no request).
 */
export function RevenueOverview({ series, previous }: { series: RevenueChartPoint[]; previous: RevenueChartPoint[] }) {
  const [range, setRange] = useState<Range>(30);
  const [metric, setMetric] = useState<ChartMetric>("revenuePence");

  const { data, total, orders, prevTotal, prevOrders } = useMemo(() => {
    const data = series.slice(-range);
    const prev = previous.slice(-range);
    const sum = (pts: RevenueChartPoint[], k: ChartMetric) => pts.reduce((n, p) => n + p[k], 0);
    return {
      data,
      total: sum(data, "revenuePence"),
      orders: sum(data, "orders"),
      prevTotal: sum(prev, "revenuePence"),
      prevOrders: sum(prev, "orders"),
    };
  }, [series, previous, range]);

  const headline = metric === "revenuePence" ? formatGBP(total) : orders.toLocaleString("en-GB");
  const first = data[0]?.label;
  const last = data.at(-1)?.label;

  return (
    <figure className="flex h-full flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-baseline gap-2.5">
            <span className="text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-foreground tabular-nums">{headline}</span>
            <Delta current={metric === "revenuePence" ? total : orders} previous={metric === "revenuePence" ? prevTotal : prevOrders} />
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {metric === "revenuePence" ? `From ${orders} paid ${orders === 1 ? "order" : "orders"}` : `${formatGBP(total)} received`} · vs previous {range} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented label="Metric" options={METRICS.map((m) => ({ value: m.key, label: m.label }))} value={metric} onChange={setMetric} />
          <Segmented label="Date range" options={RANGES.map((r) => ({ value: r.days, label: r.label }))} value={range} onChange={setRange} />
        </div>
      </div>
      <div
        className="mt-5 h-60 shrink-0 sm:h-80"
        role="img"
        aria-label={`Daily ${metric === "orders" ? "paid orders" : "revenue"} chart, ${first} to ${last}. Total ${headline}.`}
      >
        <RevenueChartLazy data={data} metric={metric} />
      </div>
    </figure>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-muted p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-lg px-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "bg-card text-foreground shadow-[0_1px_2px_rgb(16_24_40/0.1)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
