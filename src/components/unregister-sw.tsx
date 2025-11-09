"use client";

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((success) => {
            if (success) {
              logger.debug('Service worker unregistered successfully');
            }
          }).catch((error) => {
            logger.error('Error unregistering service worker', error instanceof Error ? error : new Error(String(error)));
          });
        });
      }).catch((error) => {
        logger.error('Error getting service worker registrations', error instanceof Error ? error : new Error(String(error)));
      });

      // Clear all caches if available
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        }).catch((error) => {
          logger.error('Error clearing caches', error instanceof Error ? error : new Error(String(error)));
        });
      }
    }
  }, []);

  return null;
}

