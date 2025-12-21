"use client";

/**
 * Error Boundary Component
 * Catches React errors and reports them to analytics service
 */

import React, { Component, ReactNode } from 'react';
import { analytics, errorMonitor } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state
    this.setState({ errorInfo });

    // Log error
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
    });

    // Report to analytics
    errorMonitor.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-md p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">Error Details (Development Only)</h3>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex space-x-3 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    errorMonitor.trackError(error, {
      componentStack: errorInfo?.componentStack,
      hookError: true,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  };
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Global error handler for non-React errors
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return;

  // Global error handler
  window.addEventListener('error', (event) => {
    errorMonitor.trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      globalError: true,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.trackError(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      {
        unhandledRejection: true,
        promise: event.promise?.toString(),
      }
    );
  });

  logger.debug('Global error handling set up');
}

// Performance error boundary for critical components
export class PerformanceErrorBoundary extends Component<Props, State> {
  private startTime: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.startTime = performance.now();
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const renderTime = performance.now() - this.startTime;

    // Track performance impact of error
    analytics.trackPerformance({
      name: 'error_boundary_triggered',
      value: renderTime,
      timestamp: Date.now(),
      tags: {
        type: 'error',
        component: 'PerformanceErrorBoundary',
        renderTime: renderTime.toString(),
      },
    });

    // Report error with performance context
    errorMonitor.trackError(error, {
      componentStack: errorInfo.componentStack,
      renderTime,
      performanceBoundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              This component encountered an error and has been disabled for performance.
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;