/**
 * Performance Testing Utilities
 * 
 * Provides utilities for measuring and testing performance in development
 */

/**
 * Measure the time taken to execute a function
 * 
 * @param name - Name of the measurement
 * @param fn - Function to measure
 * @returns The duration in milliseconds
 * 
 * @example
 * const duration = measureTime('dataFetch', () => {
 *   fetchData();
 * });
 */
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Measure async function execution time
 * 
 * @param name - Name of the measurement
 * @param fn - Async function to measure
 * @returns The result and duration
 * 
 * @example
 * const { result, duration } = await measureAsync('apiCall', async () => {
 *   return await fetch('/api/data');
 * });
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Get all performance measurements
 * 
 * @returns Array of performance measurements
 */
export function getPerformanceMeasures(): PerformanceEntry[] {
  if (typeof window === 'undefined') return [];
  
  return performance.getEntriesByType('measure');
}

/**
 * Clear all performance measurements
 */
export function clearPerformanceMeasures(): void {
  if (typeof window === 'undefined') return;
  
  performance.clearMeasures();
  performance.clearMarks();
}

/**
 * Get navigation timing metrics
 * 
 * @returns Navigation timing data
 */
export function getNavigationTiming() {
  if (typeof window === 'undefined') return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;
  
  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    domProcessing: navigation.domComplete - navigation.domInteractive,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Get resource timing metrics
 * 
 * @returns Array of resource timing entries
 */
export function getResourceTiming() {
  if (typeof window === 'undefined') return [];
  
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

/**
 * Measure component render time
 * 
 * @param componentName - Name of the component
 * @param renderFn - Function that renders the component
 * @returns The duration in milliseconds
 * 
 * @example
 * const duration = measureComponentRender('UserCard', () => {
 *   render(<UserCard user={user} />);
 * });
 */
export function measureComponentRender(
  componentName: string,
  renderFn: () => void
): number {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  const duration = end - start;
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    performance.mark(`${componentName}-render-start`);
    performance.mark(`${componentName}-render-end`);
    performance.measure(`render-${componentName}`, `${componentName}-render-start`, `${componentName}-render-end`);
    
    console.log(`⏱️  render-${componentName}: ${duration.toFixed(2)}ms`);
  }
  
  return duration;
}

/**
 * Performance budget checker
 * Checks if metrics are within acceptable thresholds
 */
export const performanceBudget = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1200 },
  
  /**
   * Check if a metric is within budget
   */
  check(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const budget = this[metric as keyof typeof this] as { good: number; poor: number } | undefined;
    if (!budget) return 'good';
    
    if (value <= budget.good) return 'good';
    if (value >= budget.poor) return 'poor';
    return 'needs-improvement';
  },
};

