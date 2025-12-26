/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/shared/components' instead.
 */
export * from '@/shared/components/skeleton';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ 
  className = "", 
  width = "w-full", 
  height = "h-4", 
  rounded = true 
}: SkeletonProps) {
  return (
    <div 
      className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${width} ${height} ${rounded ? 'rounded' : ''} ${className}`}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = "" }: CardSkeletonProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center mb-6">
        <Skeleton width="w-16" height="h-16" className="rounded-2xl" />
        <div className="ml-4 flex-1">
          <Skeleton width="w-3/4" height="h-6" className="mb-2" />
          <Skeleton width="w-1/2" height="h-4" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton height="h-4" />
        <Skeleton height="h-4" />
        <Skeleton width="w-2/3" height="h-4" />
      </div>
    </div>
  );
}

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className = "" }: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          width={index === lines - 1 ? "w-2/3" : "w-full"} 
          height="h-4" 
        />
      ))}
    </div>
  );
}

interface ButtonSkeletonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ButtonSkeleton({ className = "", size = "md" }: ButtonSkeletonProps) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24", 
    lg: "h-12 w-32"
  };

  return (
    <Skeleton 
      className={`rounded-lg ${sizeClasses[size]} ${className}`}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className = "" }: TableSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="h-6" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-slate-300 border-t-primary ${sizeClasses[size]} ${className}`} />
  );
}
