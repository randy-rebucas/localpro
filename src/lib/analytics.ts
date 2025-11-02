// Analytics and performance monitoring utilities
import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

class Analytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Track custom events
  track(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      logger.debug('Analytics Event', { eventName: event.name, hasProperties: !!event.properties });
      return;
    }

    // Send to analytics service (e.g., Google Analytics, Mixpanel, etc.)
    try {
      // Example: gtag('event', event.name, event.properties);
      logger.debug('Analytics Event', { eventName: event.name, hasProperties: !!event.properties });
    } catch (error) {
      logger.error('Analytics tracking error', error instanceof Error ? error : new Error(String(error)), { eventName: event.name });
    }
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    this.track({
      name: 'page_view',
      properties: {
        path,
        title: title || document.title,
      },
    });
  }

  // Track user actions
  trackUserAction(action: string, properties?: Record<string, unknown>) {
    this.track({
      name: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, properties?: Record<string, unknown>) {
    this.track({
      name: 'performance_metric',
      properties: {
        metric,
        value,
        ...properties,
      },
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, unknown>) {
    this.track({
      name: 'error',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
    });
  }
}

export const analytics = new Analytics();

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    analytics.trackPerformance(name, end - start);
    return result;
  },

  // Measure async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    analytics.trackPerformance(name, end - start);
    return result;
  },

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    analytics.trackPerformance(`${componentName}_render`, end - start);
  },
};

// Web Vitals monitoring
export const webVitals = {
  trackCLS: (value: number) => {
    analytics.trackPerformance('CLS', value);
  },
  
  trackFID: (value: number) => {
    analytics.trackPerformance('FID', value);
  },
  
  trackFCP: (value: number) => {
    analytics.trackPerformance('FCP', value);
  },
  
  trackLCP: (value: number) => {
    analytics.trackPerformance('LCP', value);
  },
  
  trackTTFB: (value: number) => {
    analytics.trackPerformance('TTFB', value);
  },
};
