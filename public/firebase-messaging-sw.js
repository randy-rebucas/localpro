// Firebase Messaging Service Worker
// This file prevents 404 errors for Firebase messaging service worker requests
// If you're not using Firebase messaging, this file can be safely ignored

console.log('Firebase messaging service worker loaded (placeholder)');

// Basic service worker functionality
self.addEventListener('install', function() {
  console.log('Service worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service worker activating');
  event.waitUntil(self.clients.claim());
});

// If you plan to use Firebase messaging in the future, 
// replace this placeholder with the actual Firebase messaging service worker code
