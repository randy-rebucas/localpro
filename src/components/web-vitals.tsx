"use client";

/**
 * Web Vitals Reporter Component
 * Reports Core Web Vitals to analytics service
 */

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

interface WebVitalsProps {
  /** Optional callback for custom handling of web vitals */
  onReport?: (metric: WebVitalMetric) => void;
  /** Whether to report to analytics service */
  reportToAnalytics?: boolean;
}

export function WebVitalsReporter({
  onReport,
  reportToAnalytics = true
}: WebVitalsProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if web-vitals library is available
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Report Largest Contentful Paint (LCP)
      getLCP((metric) => {
        const data = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          id: metric.id,
          delta: metric.delta,
        };

        if (reportToAnalytics) {
          analytics.trackPerformance({
            name: 'LCP',
            value: metric.value,
            timestamp: data.timestamp,
            tags: {
              type: 'web-vital',
              rating: metric.rating,
              id: metric.id,
            },
          });
        }

        onReport?.(data);
        logger.debug('LCP reported', data);
      });

      // Report First Input Delay (FID)
      getFID((metric) => {
        const data = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          id: metric.id,
          delta: metric.delta,
        };

        if (reportToAnalytics) {
          analytics.trackPerformance({
            name: 'FID',
            value: metric.value,
            timestamp: data.timestamp,
            tags: {
              type: 'web-vital',
              rating: metric.rating,
              id: metric.id,
            },
          });
        }

        onReport?.(data);
        logger.debug('FID reported', data);
      });

      // Report Cumulative Layout Shift (CLS)
      getCLS((metric) => {
        const data = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          id: metric.id,
          delta: metric.delta,
        };

        if (reportToAnalytics) {
          analytics.trackPerformance({
            name: 'CLS',
            value: metric.value,
            timestamp: data.timestamp,
            tags: {
              type: 'web-vital',
              rating: metric.rating,
              id: metric.id,
            },
          });
        }

        onReport?.(data);
        logger.debug('CLS reported', data);
      });

      // Report First Contentful Paint (FCP)
      getFCP((metric) => {
        const data = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          id: metric.id,
          delta: metric.delta,
        };

        if (reportToAnalytics) {
          analytics.trackPerformance({
            name: 'FCP',
            value: metric.value,
            timestamp: data.timestamp,
            tags: {
              type: 'web-vital',
              rating: metric.rating,
              id: metric.id,
            },
          });
        }

        onReport?.(data);
        logger.debug('FCP reported', data);
      });

      // Report Time to First Byte (TTFB)
      getTTFB((metric) => {
        const data = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          id: metric.id,
          delta: metric.delta,
        };

        if (reportToAnalytics) {
          analytics.trackPerformance({
            name: 'TTFB',
            value: metric.value,
            timestamp: data.timestamp,
            tags: {
              type: 'web-vital',
              rating: metric.rating,
              id: metric.id,
            },
          });
        }

        onReport?.(data);
        logger.debug('TTFB reported', data);
      });

    }).catch((error) => {
      logger.warn('Failed to load web-vitals library', error);
    });
  }, [onReport, reportToAnalytics]);

  // This component doesn't render anything
  return null;
}

// Hook for using Web Vitals in components
export function useWebVitals() {
  const reportWebVital = (metric: WebVitalMetric) => {
    analytics.trackPerformance({
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      tags: {
        type: 'web-vital',
        rating: metric.rating,
        id: metric.id,
      },
    });
  };

  return { reportWebVital };
}

// Higher-order component for Web Vitals reporting
export function withWebVitals<P extends object>(
  Component: React.ComponentType<P>,
  options?: WebVitalsProps
) {
  const WrappedComponent = (props: P) => (
    <>
      <WebVitalsReporter {...options} />
      <Component {...props} />
    </>
  );

  WrappedComponent.displayName = `withWebVitals(${Component.displayName || Component.name})`;

  return WrappedComponent;
}