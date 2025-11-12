# Performance Monitoring Guide

This document outlines the performance monitoring and testing infrastructure in the LocalPro Super App.

## 🎯 Overview

The application includes comprehensive performance monitoring to track Core Web Vitals, measure component performance, and identify optimization opportunities.

## 📊 Core Web Vitals Tracking

### Implementation

The `WebVitalsReporter` component automatically tracks all Core Web Vitals:

- **LCP (Largest Contentful Paint)**: Measures loading performance
- **FID (First Input Delay)**: Measures interactivity (deprecated, use INP)
- **INP (Interaction to Next Paint)**: Measures interactivity (replacement for FID)
- **CLS (Cumulative Layout Shift)**: Measures visual stability
- **FCP (First Contentful Paint)**: Measures initial render
- **TTFB (Time to First Byte)**: Measures server response time

### Integration

```tsx
// Automatically included in root layout
import { WebVitalsReporter } from '@/components/web-vitals';
```

### Reporting

Metrics are automatically reported to:
- ✅ Vercel Analytics (via Speed Insights)
- ✅ Sentry (error tracking)
- ✅ Custom Analytics (via `webVitals` utilities)
- ✅ Console (development mode)

## 🔧 Performance Testing Utilities

### Measure Function Execution

```typescript
import { measureTime } from '@/lib/performance-test';

const result = measureTime('dataProcessing', () => {
  // Your code here
  return processData();
});
```

### Measure Async Operations

```typescript
import { measureAsync } from '@/lib/performance-test';

const { result, duration } = await measureAsync('apiCall', async () => {
  return await fetch('/api/data');
});
```

### Measure Component Renders

```typescript
import { measureComponentRender } from '@/lib/performance-test';

measureComponentRender('UserCard', () => {
  render(<UserCard user={user} />);
});
```

### Get Navigation Timing

```typescript
import { getNavigationTiming } from '@/lib/performance-test';

const timing = getNavigationTiming();
console.log('DNS:', timing.dns);
console.log('TCP:', timing.tcp);
console.log('Total:', timing.total);
```

### Performance Budgets

```typescript
import { performanceBudget } from '@/lib/performance-test';

const rating = performanceBudget.check('LCP', 2500);
// Returns: 'good' | 'needs-improvement' | 'poor'
```

## 🐛 Performance Debug Component

### Development Mode

The `PerformanceDebug` component provides real-time performance metrics in development:

- **Location**: Bottom-left corner (floating button)
- **Features**:
  - Real-time metric display
  - Color-coded ratings (good/needs-improvement/poor)
  - Last 10 metrics tracked
  - Automatic updates

### Usage

Automatically enabled in development mode. Click the performance icon in the bottom-left corner to view metrics.

## 📈 Performance Budgets

### Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| INP | ≤ 200ms | 200ms - 500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| TTFB | ≤ 800ms | 800ms - 1200ms | > 1200ms |

## 🔍 Monitoring Services

### Vercel Analytics

- **Speed Insights**: Automatic Core Web Vitals tracking
- **Analytics**: Page views and user behavior
- **Integration**: Automatic via `@vercel/analytics` and `@vercel/speed-insights`

### Sentry

- **Error Tracking**: Automatic error capture
- **Performance Monitoring**: Transaction tracking
- **Session Replay**: User session recording (10% sample rate)

### Custom Analytics

- **Web Vitals**: Tracked via `webVitals` utilities
- **Performance Metrics**: Custom performance events
- **Error Tracking**: Error events with context

## 📝 Best Practices

### ✅ DO

- Monitor Core Web Vitals in production
- Set up alerts for poor performance
- Use performance budgets in CI/CD
- Measure critical user flows
- Track component render times
- Monitor API response times

### ❌ DON'T

- Don't measure everything (focus on critical paths)
- Don't ignore poor ratings
- Don't measure in production (use sampling)
- Don't block rendering for metrics

## 🚀 Usage Examples

### Track Custom Performance

```typescript
import { measureAsync } from '@/lib/performance-test';

const { result, duration } = await measureAsync('searchQuery', async () => {
  return await searchServices(query);
});

if (duration > 1000) {
  console.warn('Slow search query detected');
}
```

### Check Performance Budget

```typescript
import { performanceBudget } from '@/lib/performance-test';

function checkLCP(lcpValue: number) {
  const rating = performanceBudget.check('LCP', lcpValue);
  
  if (rating === 'poor') {
    // Alert or log warning
    console.error('Poor LCP detected:', lcpValue);
  }
}
```

### Get All Metrics

```typescript
import { getPerformanceMeasures } from '@/lib/performance-test';

const measures = getPerformanceMeasures();
measures.forEach((measure) => {
  console.log(`${measure.name}: ${measure.duration}ms`);
});
```

## 📊 Monitoring Dashboard

### Development

- Use the Performance Debug component (bottom-left corner)
- Check browser DevTools Performance tab
- Review console logs for performance warnings

### Production

- Vercel Analytics Dashboard
- Sentry Performance Dashboard
- Custom analytics dashboard (if implemented)

## 🔮 Future Enhancements

1. **Real User Monitoring (RUM)**
   - Track actual user performance
   - Identify slow devices/networks
   - Geographic performance analysis

2. **Performance Alerts**
   - Automated alerts for poor metrics
   - Slack/email notifications
   - Performance regression detection

3. **Performance Budgets in CI**
   - Fail builds on poor performance
   - Compare against baseline
   - Performance regression tests

4. **Advanced Analytics**
   - Performance by route
   - Performance by device type
   - Performance trends over time

## 📚 Resources

- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/vitals/#core-web-vitals)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

---

**Last Updated**: 2024
**Next.js Version**: 15.5.5

