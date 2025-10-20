import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Logo Skeleton */}
        <div className="relative mb-8">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto" variant="shimmer" />
        </div>
        
        {/* Title Skeletons */}
        <div className="space-y-4 mb-12">
          <Skeleton className="h-8 w-80 mx-auto" variant="shimmer" />
          <Skeleton className="h-5 w-96 mx-auto" variant="shimmer" />
        </div>
        
        {/* Admin Modules Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-lg" variant="shimmer" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-24" variant="shimmer" />
                  <Skeleton className="h-4 w-32" variant="shimmer" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" variant="shimmer" />
                <Skeleton className="h-3 w-3/4" variant="shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
