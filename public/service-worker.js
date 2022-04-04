/**
 * Default service worker unregisters itself and clears all caches. This is to
 * help prevent installed/bad service workers from interfering with the app.
 *
 * Production deploys will generate a custom service worker that will overwrite
 * this file.
 */
console.info('Service worker disabled for development.');

async function unregisterAndClearCaches() {
  const unregisterPromise = self.registration.unregister();

  const allCaches = await caches.keys();
  const cacheDeletionPromises = allCaches.map((cache) => caches.delete(cache));

  await Promise.all([unregisterPromise, ...cacheDeletionPromises]);

  console.info('Service worker unregistered and cache cleared.');
}

unregisterAndClearCaches().catch((error) =>
  console.error(`Error unregistering service worker: ${error}`)
);
