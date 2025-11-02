/**
 * Lazy-loaded Finance Chart Component
 * This component is code-split to reduce initial bundle size
 */

"use client";

import { lazy, Suspense } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the actual chart component
const FinanceChart = lazy(() => import('./finance-chart').then(module => ({ 
  default: module.FinanceChart 
})));

interface FinanceChartLazyProps {
  title: string;
  type: 'bar' | 'pie' | 'line';
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  className?: string;
  height?: string;
}

// Loading skeleton for the chart
function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className={height} />
    </Card>
  );
}

export function FinanceChartLazy(props: FinanceChartLazyProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height} />}>
      <FinanceChart {...props} />
    </Suspense>
  );
}

