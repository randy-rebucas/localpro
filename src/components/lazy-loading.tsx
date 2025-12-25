/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/shared/components' instead.
 */
export * from '@/shared/components/lazy-loading';

import React, { ComponentType } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/skeleton';

/**
 * Generic lazy loading wrapper using next/dynamic
 * 
 * @deprecated Use next/dynamic directly or import from @/lib/lazy-components
 * This function is kept for backward compatibility
 */
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return dynamic(() => Promise.resolve({ default: Component }), {
    loading: () => (fallback || <Skeleton />) as React.ReactElement,
  });
}

// Lazy load heavy components - these would need to be created or have default exports
// export const LazyChart = lazy(() => import('@/components/admin/finance-chart'));
// export const LazyAnalytics = lazy(() => import('@/components/admin/analytics-dashboard'));
// export const LazyDataTable = lazy(() => import('@/components/ui/data-table'));
// export const LazyImageGallery = lazy(() => import('@/components/portfolio-gallery'));

// Lazy loading with custom fallback - these would need actual components
// export function LazyChartWithFallback() {
//   return (
//     <Suspense fallback={<div className="h-64 bg-gray-200 rounded-lg animate-pulse" />}>
//       <LazyChart />
//     </Suspense>
//   );
// }

// export function LazyAnalyticsWithFallback() {
//   return (
//     <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse" />}>
//       <LazyAnalytics />
//     </Suspense>
//   );
// }

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Lazy image component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onLoad,
  onError 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <Image src={placeholder} alt="" fill className="object-cover opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded" />
          )}
        </div>
      )}
      
      {isInView && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          fill
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

// Lazy component with intersection observer
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyComponent({ 
  children, 
  fallback = <Skeleton />,
  rootMargin = '50px',
  threshold = 0.1
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Preload critical components
export function preloadComponent(componentName: string) {
  const componentMap: Record<string, () => Promise<unknown>> = {
    // 'chart': () => import('@/components/admin/finance-chart'),
    // 'analytics': () => import('@/components/admin/analytics-dashboard'),
    // 'data-table': () => import('@/components/ui/data-table'),
    // 'image-gallery': () => import('@/components/portfolio-gallery'),
  };

  const componentLoader = componentMap[componentName];
  if (componentLoader) {
    componentLoader();
  }
}

// Preload on hover
export function usePreloadOnHover(componentName: string) {
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isHovered) {
      preloadComponent(componentName);
    }
  }, [isHovered, componentName]);

  return {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
}
