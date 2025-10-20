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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loading Skeleton Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Beautiful loading states for your LocalPro application
          </p>
        </div>

        {/* Basic Skeletons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Basic Skeletons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Default Pulse
              </h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="default" />
                <Skeleton className="h-4 w-3/4" variant="default" />
                <Skeleton className="h-4 w-1/2" variant="default" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Shimmer Effect
              </h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="shimmer" />
                <Skeleton className="h-4 w-3/4" variant="shimmer" />
                <Skeleton className="h-4 w-1/2" variant="shimmer" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Table Skeleton
          </h2>
          <SkeletonTable />
        </section>

        {/* Dashboard Skeleton */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard Skeleton
          </h2>
          <SkeletonDashboard />
        </section>

        {/* Profile Skeleton */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Profile Skeleton
          </h2>
          <SkeletonProfile />
        </section>
      </div>
    </div>
  );
}
