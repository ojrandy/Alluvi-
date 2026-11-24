"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartMetric, RevenueChartPoint } from "./revenue-chart";

/** recharts is client-only and ~100 kB: load it after hydration, behind a same-size skeleton (no layout shift). */
const RevenueChart = dynamic(() => import("./revenue-chart"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-xl" />,
});

export function RevenueChartLazy({ data, metric = "revenuePence" }: { data: RevenueChartPoint[]; metric?: ChartMetric }) {
  return <RevenueChart data={data} metric={metric} />;
}
