"use client";

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function MonitoringProviders() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

// Performance monitoring utilities
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
}

export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
    });
  }
}

// Performance metrics collection
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  
  // Send to analytics if available
  trackEvent('performance_metric', {
    metric_name: name,
    duration: duration,
    timestamp: Date.now()
  });
  
  return duration;
}

// Web Vitals tracking
export function trackWebVitals(metric: { name: string; value: number; delta: number; id: string; navigationType: string }) {
  console.log('Web Vital:', metric);
  
  trackEvent('web_vital', {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType
  });
}

// Error tracking
export function trackError(error: Error, context?: string) {
  console.error('Error tracked:', error, context);
  
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    context: context,
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    url: window.location.href
  });
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
