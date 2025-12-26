"use client";

import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonServiceCard, 
  SkeletonTable, 
  SkeletonStatsCard, 
  SkeletonDashboard, 
  SkeletonProfile 
} from "./skeleton";

export function SkeletonShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Loading Skeleton Showcase
          </h1>
          <p className="text-muted-foreground">
            Beautiful loading states for your LocalPro application
          </p>
        </div>

        {/* Basic Skeletons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Basic Skeletons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Default Pulse
              </h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="default" />
                <Skeleton className="h-4 w-3/4" variant="default" />
                <Skeleton className="h-4 w-1/2" variant="default" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Shimmer Effect
              </h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="shimmer" />
                <Skeleton className="h-4 w-3/4" variant="shimmer" />
                <Skeleton className="h-4 w-1/2" variant="shimmer" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Wave Effect
              </h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="wave" />
                <Skeleton className="h-4 w-3/4" variant="wave" />
                <Skeleton className="h-4 w-1/2" variant="wave" />
              </div>
            </div>
          </div>
        </section>

        {/* Card Skeletons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Card Skeletons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonServiceCard />
            <SkeletonStatsCard />
          </div>
        </section>

        {/* Table Skeleton */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Table Skeleton
          </h2>
          <SkeletonTable />
        </section>

        {/* Dashboard Skeleton */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Dashboard Skeleton
          </h2>
          <SkeletonDashboard />
        </section>

        {/* Profile Skeleton */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Profile Skeleton
          </h2>
          <SkeletonProfile />
        </section>
      </div>
    </div>
  );
}
