import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "wave";
}

export function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  const baseClasses = "rounded-md relative overflow-hidden";
  
  const variantClasses = {
    default: "animate-pulse bg-gray-200 dark:bg-gray-700",
    shimmer: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
    wave: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// Predefined skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" variant="shimmer" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-3/4" variant="shimmer" />
          <Skeleton className="h-3 w-1/2" variant="shimmer" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3 w-full" variant="shimmer" />
        <Skeleton className="h-3 w-5/6" variant="shimmer" />
        <Skeleton className="h-3 w-4/5" variant="shimmer" />
      </div>
    </div>
  );
}

export function SkeletonServiceCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start space-x-4 mb-4">
        <Skeleton className="h-14 w-14 rounded-xl" variant="shimmer" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-5 w-32" variant="shimmer" />
          <Skeleton className="h-4 w-24" variant="shimmer" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" variant="shimmer" />
        <Skeleton className="h-3 w-4/5" variant="shimmer" />
        <Skeleton className="h-3 w-3/4" variant="shimmer" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" variant="shimmer" />
          ))}
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" variant="shimmer" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <Skeleton className="h-6 w-1/4" variant="shimmer" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" variant="shimmer" />
              <Skeleton className="h-3 w-1/4" variant="shimmer" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" variant="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" variant="shimmer" />
          <Skeleton className="h-8 w-16" variant="shimmer" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" variant="shimmer" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-3 w-12" variant="shimmer" />
        <Skeleton className="h-3 w-16" variant="shimmer" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <Skeleton className="h-8 w-80" variant="shimmer" />
            <Skeleton className="h-5 w-96" variant="shimmer" />
            <div className="flex space-x-4 mt-6">
              <Skeleton className="h-10 w-32 rounded-lg" variant="shimmer" />
              <Skeleton className="h-10 w-28 rounded-lg" variant="shimmer" />
            </div>
          </div>
          <Skeleton className="h-24 w-24 rounded-2xl" variant="shimmer" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Service Modules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" variant="shimmer" />
          <Skeleton className="h-9 w-24 rounded-lg" variant="shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <Skeleton className="h-7 w-40" variant="shimmer" />
        <SkeletonTable />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex items-center space-x-6">
          <Skeleton className="h-32 w-32 rounded-2xl" variant="shimmer" />
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" variant="shimmer" />
              <Skeleton className="h-5 w-48" variant="shimmer" />
              <Skeleton className="h-4 w-32" variant="shimmer" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-28 rounded-lg" variant="shimmer" />
              <Skeleton className="h-10 w-32 rounded-lg" variant="shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" variant="shimmer" />
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" variant="shimmer" />
                <Skeleton className="h-8 w-32 rounded-lg" variant="shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" variant="shimmer" />
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" variant="shimmer" />
                <Skeleton className="h-10 w-full rounded-lg" variant="shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Gallery */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" variant="shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" variant="shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
