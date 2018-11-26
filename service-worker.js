self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', () => {
  caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        return caches.delete(key);
      })).then( () => {

        self.registration.unregister();
        self.clients.matchAll({ type: 'window' }).then(clients => {
          for (const client of clients) {
            client.navigate(client.url);
          }
        });

      });
    })
});