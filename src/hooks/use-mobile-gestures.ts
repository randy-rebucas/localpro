"use client";

import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

interface TapConfig {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
}

interface GestureConfig extends SwipeConfig, TapConfig {
  enabled?: boolean;
}

export function useMobileGestures(config: GestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    longPressDelay = 500,
    enabled = true
  } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress();
        // Prevent default to avoid triggering other events
        e.preventDefault();
      }, longPressDelay);
    }
  }, [enabled, onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    // Clear long press timer if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touch = e.touches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    if (!touchStartRef.current || !touchEndRef.current) return;

    const start = touchStartRef.current;
    const end = touchEndRef.current;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.time - start.time;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if it's a swipe (within time and distance limits)
    if (deltaTime <= maxSwipeTime) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        return;
      }

      // Vertical swipe
      if (absDeltaY > minSwipeDistance && absDeltaY > absDeltaX) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
        return;
      }
    }

    // Check for taps if no swipe occurred
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (absDeltaX < 10 && absDeltaY < 10 && deltaTime < 300) {
      if (timeSinceLastTap < 300) {
        // Double tap
        onDoubleTap?.();
        lastTapRef.current = 0; // Reset
      } else {
        // Single tap
        onTap?.();
        lastTapRef.current = now;
      }
    } else {
      // Reset last tap if it was a drag
      lastTapRef.current = 0;
    }

    // Reset touch refs
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, minSwipeDistance, maxSwipeTime]);

  const bind = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart, { passive: false });
      elementRef.current.removeEventListener('touchmove', handleTouchMove, { passive: false });
      elementRef.current.removeEventListener('touchend', handleTouchEnd, { passive: false });
    }

    elementRef.current = element;

    if (element && enabled) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchmove', handleTouchMove);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { bind };
}

// Higher-level hook for common mobile interactions
export function useSwipeNavigation(onNext?: () => void, onPrevious?: () => void) {
  return useMobileGestures({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    minSwipeDistance: 75,
    maxSwipeTime: 500
  });
}

export function usePullToRefresh(onRefresh: () => void, threshold: number = 100) {
  const pullStartRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  return useMobileGestures({
    onSwipeDown: () => {
      if (!pullStartRef.current) {
        pullStartRef.current = window.scrollY;
      }

      const currentScroll = window.scrollY;
      const pullDistance = pullStartRef.current - currentScroll;

      if (pullDistance > threshold && !isRefreshingRef.current && window.scrollY <= 10) {
        isRefreshingRef.current = true;
        onRefresh();

        // Reset after refresh completes
        setTimeout(() => {
          isRefreshingRef.current = false;
          pullStartRef.current = null;
        }, 1000);
      }
    }
  });
}
