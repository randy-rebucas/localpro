"use client";

/**
 * Web Vitals Component
 * 
 * Tracks and reports Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * 
 * Integrates with Vercel Analytics, Sentry, and custom analytics
 */

import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import { trackWebVitals } from './monitoring';
import { webVitals } from '@/lib/analytics';
import { logger } from '@/lib/logger';

/**
 * Web Vitals Reporter
 * Reports Core Web Vitals to analytics services
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Track Largest Contentful Paint
    onLCP((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: LCP', { 
        value: value.toFixed(2), 
        delta: delta.toFixed(2),
        rating 
      });
      
      // Report to analytics
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      // Report to custom analytics
      webVitals.trackLCP(value);
      
      // Log warning if LCP is poor
      if (rating === 'poor' || value > 4000) {
        logger.warn('Poor LCP detected', { value, rating });
      }
    });

    // Track First Input Delay (FID) - deprecated, use INP instead
    onFID((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: FID', { 
        value: value.toFixed(2), 
        delta: delta.toFixed(2),
        rating 
      });
      
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      webVitals.trackFID(value);
      
      if (rating === 'poor' || value > 300) {
        logger.warn('Poor FID detected', { value, rating });
      }
    });

    // Track Interaction to Next Paint (INP) - replacement for FID
    onINP((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: INP', { 
        value: value.toFixed(2), 
        delta: delta.toFixed(2),
        rating 
      });
      
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      // Track as INP
      webVitals.trackFID(value); // Using FID method for now, can add INP later
      
      if (rating === 'poor' || value > 500) {
        logger.warn('Poor INP detected', { value, rating });
      }
    });

    // Track Cumulative Layout Shift
    onCLS((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: CLS', { 
        value: value.toFixed(4), 
        delta: delta.toFixed(4),
        rating 
      });
      
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      webVitals.trackCLS(value);
      
      if (rating === 'poor' || value > 0.25) {
        logger.warn('Poor CLS detected', { value, rating });
      }
    });

    // Track First Contentful Paint
    onFCP((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: FCP', { 
        value: value.toFixed(2), 
        delta: delta.toFixed(2),
        rating 
      });
      
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      webVitals.trackFCP(value);
      
      if (rating === 'poor' || value > 3000) {
        logger.warn('Poor FCP detected', { value, rating });
      }
    });

    // Track Time to First Byte
    onTTFB((metric) => {
      const { name, value, delta, id, rating } = metric;
      
      logger.debug('Web Vital: TTFB', { 
        value: value.toFixed(2), 
        delta: delta.toFixed(2),
        rating 
      });
      
      trackWebVitals({
        name,
        value,
        delta,
        id,
        navigationType: metric.navigationType || 'navigate',
      });
      
      webVitals.trackTTFB(value);
      
      if (rating === 'poor' || value > 800) {
        logger.warn('Poor TTFB detected', { value, rating });
      }
    });
  }, []);

  return null; // This component doesn't render anything
}

