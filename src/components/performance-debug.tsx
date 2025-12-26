"use client";

/**
 * Performance Debug Component
 * 
 * Development-only component for monitoring performance metrics in real-time.
 * Only renders in development mode.
 */

import { useState, useEffect } from 'react';
import { X, Activity, Zap, Clock, TrendingUp } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const RATING_COLORS = {
  good: 'text-accent bg-accent/5',
  'needs-improvement': 'text-yellow-600 bg-yellow-50',
  poor: 'text-red-600 bg-red-50',
};

const RATING_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1200 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = RATING_THRESHOLDS[name];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value >= thresholds.poor) return 'poor';
  return 'needs-improvement';
}

export function PerformanceDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    if (!isDevelopment || !isOpen) return;

    // Listen for performance entries
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
          const metric: PerformanceMetric = {
            name: entry.name,
            value: entry.duration,
            unit: 'ms',
            rating: 'good',
            timestamp: Date.now(),
          };
          
          // Check if it's a known metric
          const knownMetrics = ['LCP', 'FID', 'INP', 'CLS', 'FCP', 'TTFB'];
          if (knownMetrics.includes(entry.name)) {
            metric.rating = getRating(entry.name, entry.duration);
            setMetrics((prev) => {
              const filtered = prev.filter((m) => m.name !== entry.name);
              return [...filtered, metric].slice(-10); // Keep last 10 metrics
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    return () => observer.disconnect();
  }, [isOpen, isDevelopment]);

  if (!isDevelopment) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9999] bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        aria-label="Toggle Performance Debug"
      >
        <Activity className="w-5 h-5" />
        {metrics.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {metrics.length}
          </span>
        )}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-[9998] w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Performance Debug</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {metrics.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No metrics recorded yet</p>
                <p className="text-xs mt-1">Metrics will appear as they&apos;re measured</p>
              </div>
            ) : (
              metrics
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((metric, index) => (
                  <div
                    key={`${metric.name}-${index}`}
                    className={`p-3 rounded-lg border ${RATING_COLORS[metric.rating]}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{metric.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${RATING_COLORS[metric.rating]}`}>
                        {metric.rating.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-lg font-bold">
                        {metric.value.toFixed(metric.name === 'CLS' ? 4 : 2)}
                      </span>
                      <span className="text-xs text-gray-600">{metric.unit}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <p>Development mode only • Metrics update in real-time</p>
          </div>
        </div>
      )}
    </>
  );
}

