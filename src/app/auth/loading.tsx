import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 px-4">
        {/* Logo Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="w-16 h-16 rounded-lg" variant="shimmer" />
        </div>
        
        {/* Title Skeletons */}
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" variant="shimmer" />
          <Skeleton className="h-5 w-80 mx-auto" variant="shimmer" />
        </div>
        
        {/* Form Skeleton */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" variant="shimmer" />
              <Skeleton className="h-12 w-full rounded-lg" variant="shimmer" />
            </div>
          </div>
          
          <Skeleton className="h-12 w-full rounded-lg" variant="shimmer" />
        </div>
        
        {/* Additional Info Skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" variant="shimmer" />
          <Skeleton className="h-4 w-32 mx-auto" variant="shimmer" />
        </div>
      </div>
    </div>
  );
}
