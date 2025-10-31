"use client";

import { useEffect } from 'react';

export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Service worker unregistered successfully');
            }
          }).catch((error) => {
            console.error('Error unregistering service worker:', error);
          });
        });
      }).catch((error) => {
        console.error('Error getting service worker registrations:', error);
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
          console.error('Error clearing caches:', error);
        });
      }
    }
  }, []);

  return null;
}

