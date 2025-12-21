/**
 * Analytics and Monitoring Configuration
 * Centralized analytics tracking, performance monitoring, and error reporting
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger';

// Analytics Event Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  page?: string;
}

// Performance Metric Types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

// Error Tracking Types
export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

// Analytics Service Class
export class AnalyticsService {
  private initialized = false;
  private queue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private errorQueue: ErrorEvent[] = [];

  // Initialize analytics
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        // Google Analytics 4
        this.initialized = true;
        this.flushQueue();
      }

      // Initialize other analytics providers here
      // - Mixpanel, Amplitude, etc.

      this.initialized = true;
      logger.debug('Analytics service initialized');
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
    }
  }

  // Track user events
  track(event: AnalyticsEvent): void {
    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.name, {
          custom_map: event.properties,
          ...event.properties,
        });
      }

      // Send to backend analytics
      this.sendToBackend(event);

      logger.debug('Analytics event tracked', { event: event.name });
    } catch (error) {
      logger.error('Failed to track analytics event', error);
    }
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>): void {
    this.track({
      name: 'page_view',
      properties: {
        page_title: document?.title,
        page_location: window?.location?.href,
        page_path: page,
        ...properties,
      },
    });
  }

  // Track user interactions
  trackClick(element: string, properties?: Record<string, any>): void {
    this.track({
      name: 'click',
      properties: {
        element,
        ...properties,
      },
    });
  }

  // Track conversions
  trackConversion(conversionType: string, value?: number, properties?: Record<string, any>): void {
    this.track({
      name: 'conversion',
      properties: {
        conversion_type: conversionType,
        value,
        ...properties,
      },
    });
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.initialized) {
      this.performanceQueue.push(metric);
      return;
    }

    try {
      // Send performance data to backend
      this.sendPerformanceToBackend(metric);

      // Log for monitoring
      logger.debug('Performance metric tracked', {
        name: metric.name,
        value: metric.value,
        tags: metric.tags
      });
    } catch (error) {
      logger.error('Failed to track performance metric', error);
    }
  }

  // Track errors
  trackError(error: ErrorEvent): void {
    if (!this.initialized) {
      this.errorQueue.push(error);
      return;
    }

    try {
      // Send error to backend
      this.sendErrorToBackend(error);

      // Log error
      logger.error('Error tracked', {
        message: error.message,
        context: error.context,
        url: error.url
      });
    } catch (err) {
      logger.error('Failed to track error', err);
    }
  }

  // Flush queued events
  private flushQueue(): void {
    // Process queued events
    this.queue.forEach(event => this.track(event));
    this.queue = [];

    // Process queued performance metrics
    this.performanceQueue.forEach(metric => this.trackPerformance(metric));
    this.performanceQueue = [];

    // Process queued errors
    this.errorQueue.forEach(error => this.trackError(error));
    this.errorQueue = [];
  }

  // Send analytics to backend
  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        logger.warn('Failed to send analytics to backend', { status: response.status });
      }
    } catch (error) {
      logger.warn('Analytics backend request failed', error);
    }
  }

  // Send performance metrics to backend
  private async sendPerformanceToBackend(metric: PerformanceMetric): Promise<void> {
    try {
      const response = await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });

      if (!response.ok) {
        logger.warn('Failed to send performance metrics to backend', { status: response.status });
      }
    } catch (error) {
      logger.warn('Performance metrics backend request failed', error);
    }
  }

  // Send errors to backend
  private async sendErrorToBackend(error: ErrorEvent): Promise<void> {
    try {
      const response = await fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        logger.warn('Failed to send error to backend', { status: response.status });
      }
    } catch (err) {
      logger.warn('Error backend request failed', err);
    }
  }

  // Get user properties
  getUserProperties(): Record<string, any> {
    return {
      user_agent: navigator?.userAgent,
      language: navigator?.language,
      platform: navigator?.platform,
      screen_resolution: `${screen?.width}x${screen?.height}`,
      viewport: `${window?.innerWidth}x${window?.innerHeight}`,
      timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone,
    };
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Performance Monitoring
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  startMonitoring(): void {
    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor navigation timing
    this.monitorNavigationTiming();

    // Monitor resource loading
    this.monitorResourceTiming();

    // Monitor long tasks
    this.monitorLongTasks();

    logger.debug('Performance monitoring started');
  }

  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private monitorWebVitals(): void {
    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          analytics.trackPerformance({
            name: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            tags: { type: 'web-vital' },
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            analytics.trackPerformance({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              tags: { type: 'web-vital' },
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS on page unload
        window.addEventListener('beforeunload', () => {
          analytics.trackPerformance({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            tags: { type: 'web-vital' },
          });
        });

      } catch (error) {
        logger.warn('Failed to set up Web Vitals monitoring', error);
      }
    }
  }

  private monitorNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceNavigationTiming) => {
            analytics.trackPerformance({
              name: 'navigation_timing',
              value: entry.loadEventEnd - entry.fetchStart,
              timestamp: Date.now(),
              tags: {
                type: 'navigation',
                entry_type: entry.type,
                protocol: entry.nextHopProtocol || '',
              },
            });
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        logger.warn('Failed to set up navigation timing monitoring', error);
      }
    }
  }

  private monitorResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceResourceTiming) => {
            analytics.trackPerformance({
              name: 'resource_timing',
              value: entry.responseEnd - entry.fetchStart,
              timestamp: Date.now(),
              tags: {
                type: 'resource',
                resource_type: this.getResourceType(entry.initiatorType),
                url: entry.name,
              },
            });
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        logger.warn('Failed to set up resource timing monitoring', error);
      }
    }
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEntry) => {
            analytics.trackPerformance({
              name: 'long_task',
              value: entry.duration,
              timestamp: Date.now(),
              tags: { type: 'long-task' },
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logger.warn('Failed to set up long task monitoring', error);
      }
    }
  }

  private getResourceType(initiatorType: string): string {
    const typeMap: Record<string, string> = {
      'img': 'image',
      'script': 'javascript',
      'link': 'stylesheet',
      'xmlhttprequest': 'xhr',
      'fetch': 'fetch',
      'beacon': 'beacon',
    };
    return typeMap[initiatorType] || initiatorType || 'unknown';
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Error Monitoring
export class ErrorMonitor {
  startMonitoring(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackErrorInternal({
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackErrorInternal({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        context: {
          reason: event.reason,
          promise: event.promise?.toString(),
        },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // React error boundary integration
    this.setupReactErrorBoundary();

    logger.debug('Error monitoring started');
  }

  private trackErrorInternal(error: ErrorEvent): void {
    analytics.trackError(error);
  }

  private setupReactErrorBoundary(): void {
    // This would be integrated with React Error Boundaries
    // For now, we'll rely on the global error handlers
  }

  // Manual error tracking
  trackError(error: Error | string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.trackErrorInternal(errorEvent);
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// User Behavior Tracking
export class UserBehaviorTracker {
  private sessionId: string;
  private lastActivity: number = Date.now();

  startTracking(): void {
    this.sessionId = this.generateSessionId();
    this.trackSessionStart();

    // Track user interactions
    this.trackClicks();
    this.trackScrolls();
    this.trackTimeOnPage();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackSessionPause();
      } else {
        this.trackSessionResume();
      }
    });

    logger.debug('User behavior tracking started', { sessionId: this.sessionId });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackSessionStart(): void {
    analytics.track({
      name: 'session_start',
      properties: {
        session_id: this.sessionId,
        referrer: document.referrer,
        user_properties: analytics.getUserProperties(),
      },
    });
  }

  private trackSessionPause(): void {
    analytics.track({
      name: 'session_pause',
      properties: {
        session_id: this.sessionId,
        time_spent: Date.now() - this.lastActivity,
      },
    });
  }

  private trackSessionResume(): void {
    this.lastActivity = Date.now();
    analytics.track({
      name: 'session_resume',
      properties: {
        session_id: this.sessionId,
      },
    });
  }

  private trackClicks(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        const elementInfo = {
          tag: target.tagName.toLowerCase(),
          id: target.id || undefined,
          class: target.className || undefined,
          text: target.textContent?.substring(0, 50) || undefined,
        };

        analytics.track({
          name: 'user_click',
          properties: {
            session_id: this.sessionId,
            element: elementInfo,
            position: { x: event.clientX, y: event.clientY },
          },
        });
      }
    }, { passive: true });
  }

  private trackScrolls(): void {
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        analytics.track({
          name: 'user_scroll',
          properties: {
            session_id: this.sessionId,
            scroll_depth: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
            scroll_position: window.scrollY,
          },
        });
      }, 100);
    }, { passive: true });
  }

  private trackTimeOnPage(): void {
    const interval = setInterval(() => {
      if (!document.hidden) {
        analytics.track({
          name: 'time_on_page',
          properties: {
            session_id: this.sessionId,
            time_spent: Date.now() - this.lastActivity,
            page: window.location.pathname,
          },
        });
      }
    }, 30000); // Every 30 seconds

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      this.trackSessionEnd();
    });
  }

  private trackSessionEnd(): void {
    analytics.track({
      name: 'session_end',
      properties: {
        session_id: this.sessionId,
        total_time: Date.now() - parseInt(this.sessionId.split('_')[1]),
      },
    });
  }
}

// Singleton instance
export const userBehaviorTracker = new UserBehaviorTracker();

// Initialize everything when the module loads
if (typeof window !== 'undefined') {
  // Initialize analytics
  analytics.initialize();

  // Start performance monitoring
  performanceMonitor.startMonitoring();

  // Start error monitoring
  errorMonitor.startMonitoring();

  // Start user behavior tracking
  userBehaviorTracker.startTracking();
}