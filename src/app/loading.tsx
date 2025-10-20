import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo Skeleton */}
        <div className="relative mb-8">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto" variant="shimmer" />
        </div>
        
        {/* Text Skeletons */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" variant="shimmer" />
          <Skeleton className="h-5 w-80 mx-auto" variant="shimmer" />
        </div>
        
        {/* Feature Cards Skeleton */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20 dark:border-gray-700/50">
              <Skeleton className="w-12 h-12 rounded-lg mx-auto mb-4" variant="shimmer" />
              <Skeleton className="h-5 w-24 mx-auto mb-2" variant="shimmer" />
              <Skeleton className="h-4 w-full" variant="shimmer" />
              <Skeleton className="h-4 w-3/4 mx-auto mt-2" variant="shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
