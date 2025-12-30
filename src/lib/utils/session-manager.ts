/**
 * Session management utilities
 * Tracks user activity and manages session timeout
 */

import { logger } from '@/lib/logger';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 60 seconds

let sessionStartTime: number | null = null;
let lastActivityTime: number | null = null;
let activityCheckInterval: NodeJS.Timeout | null = null;
let activityListeners: Array<() => void> = [];

/**
 * Track user activity
 */
export function trackActivity(): void {
  lastActivityTime = Date.now();
}

/**
 * Initialize session tracking
 */
export function initializeSession(): void {
  sessionStartTime = Date.now();
  lastActivityTime = Date.now();

  // Set up activity event listeners
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const activityHandler = () => trackActivity();
  
  events.forEach(event => {
    document.addEventListener(event, activityHandler, { passive: true });
    activityListeners.push(() => {
      document.removeEventListener(event, activityHandler);
    });
  });

  // Start activity check interval
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }

  activityCheckInterval = setInterval(() => {
    if (isSessionExpired()) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth?session=expired';
      }
    }
  }, ACTIVITY_CHECK_INTERVAL);

  logger.debug('Session initialized');
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
  if (!lastActivityTime) return true;

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;

  return timeSinceLastActivity > SESSION_TIMEOUT;
}

/**
 * Get session duration in milliseconds
 */
export function getSessionDuration(): number {
  if (!sessionStartTime) return 0;
  return Date.now() - sessionStartTime;
}

/**
 * Clear session data
 */
export function clearSession(): void {
  // Remove activity listeners
  activityListeners.forEach(removeListener => removeListener());
  activityListeners = [];

  // Clear interval
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }

  sessionStartTime = null;
  lastActivityTime = null;

  logger.debug('Session cleared');
}

