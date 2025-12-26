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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto mb-4"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg mx-auto absolute top-0 left-1/2 transform -translate-x-1/2">
            <span className="text-white font-bold text-lg">LP</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{text}</h2>
        <p className="text-muted-foreground">{subtitle || "Please wait while we load your content..."}</p>
      </div>
    );

    if (fullScreen) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
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
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <p className="text-sm text-muted-foreground font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-muted rounded-lg" />
        <div className="w-5 h-5 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="w-16 h-4 bg-muted rounded" />
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