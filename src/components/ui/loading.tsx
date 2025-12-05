import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  className?: string;
  variant?: "default" | "dashboard" | "spinner";
  subtitle?: string;
}

export function Loading({ 
  size = "md", 
  text = "Loading...", 
  fullScreen = false,
  className = "",
  variant = "default",
  subtitle
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-16 h-16"
  };

  // Dashboard variant with the custom P logo design
  if (variant === "dashboard") {
    const content = (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-800 border-t-emerald-500 mx-auto mb-4"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2">
            <span className="text-white font-bold text-lg">LP</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">{text}</h2>
        <p className="text-slate-400">{subtitle || "Please wait while we load your content..."}</p>
      </div>
    );

    if (fullScreen) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            {content}
          </div>
        </div>
      );
    }

    return content;
  }

  // Default spinner variant
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-500`} />
      {text && (
        <p className="text-sm text-slate-400 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// Skeleton components for consistent loading states
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-800 rounded-lg" />
        <div className="w-5 h-5 bg-slate-800 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
            <div className="w-16 h-4 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2", 
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}