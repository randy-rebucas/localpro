import { SkeletonProfile, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-lg" variant="shimmer" />
              <Skeleton className="ml-3 w-32 h-6" variant="shimmer" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded" variant="shimmer" />
              <Skeleton className="w-8 h-8 rounded" variant="shimmer" />
              <Skeleton className="w-8 h-8 rounded" variant="shimmer" />
              <Skeleton className="w-24 h-8 rounded-lg" variant="shimmer" />
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonProfile />
      </main>
    </div>
  );
}
