importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
// Note: We can't use import.meta.env here since it's a service worker, 
// so we'll rely on a URL parameter or hardcode the config if needed.
// For this applet, we'll fetch the config from the same place the main app does if possible,
// but since it's a static file, we need to provide the config directly or via a script tag injection.
// Assuming the config is available or we can fetch it:

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// We need to fetch the config from the json file since we can't use Vite env vars here
fetch('/firebase-applet-config.json')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || 'Loop Tailor';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/icon-192x192.svg',
        badge: '/favicon.svg',
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => {
    console.error('Failed to load firebase config in service worker', err);
  });
