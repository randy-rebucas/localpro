import { Activity, RefreshCw } from "lucide-react";

interface ErrorProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  variant?: "default" | "inline" | "card";
}

export function Error({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  fullScreen = false,
  className = "",
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  variant = "default"
}: ErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const content = (
    <div className={`text-center ${className}`}>
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Activity className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-6">{message}</p>
      {(showRetry || showGoHome) && (
        <div className="flex space-x-4 justify-center">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-emerald-500/25"
            >
              Try Again
            </button>
          )}
          {showGoHome && (
            <button
              onClick={handleGoHome}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          {content}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 p-6">
        {content}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Activity className="w-6 h-6 text-red-400 mr-3" />
          <h3 className="text-lg font-semibold text-red-400">{title}</h3>
        </div>
        <p className="text-slate-300 mb-4">{message}</p>
        {showRetry && (
          <button
            onClick={handleRetry}
            className="flex items-center text-red-400 hover:text-red-300 font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
        )}
      </div>
    );
  }

  return content;
}

// Specialized error components for common use cases
export function PageError({ 
  title = "Page Error",
  message = "Something went wrong while loading this page.",
  onRetry,
  onGoHome
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <Error
      title={title}
      message={message}
      fullScreen
      showRetry
      showGoHome
      onRetry={onRetry}
      onGoHome={onGoHome}
    />
  );
}

export function SectionError({ 
  title = "Failed to load",
  message = "This section couldn't be loaded. Please try again.",
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Error
      title={title}
      message={message}
      variant="inline"
      showRetry
      onRetry={onRetry}
    />
  );
}

export function CardError({ 
  title = "Error",
  message = "Something went wrong.",
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Error
      title={title}
      message={message}
      variant="card"
      showRetry
      onRetry={onRetry}
    />
  );
}
