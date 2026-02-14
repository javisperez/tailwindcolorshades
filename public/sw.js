// This service worker unregisters itself immediately.
// It exists to replace the old PWA service worker so browsers
// that still have the old one cached will pick this up as an update,
// activate it, and then it will self-destruct.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister().then(() => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    });
  });
});
