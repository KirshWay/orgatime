self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name !== 'static-assets' && name !== 'html-cache') continue;
        const cache = await caches.open(name);
        const requests = await cache.keys();
        await Promise.all(
          requests.map((request) => {
            const pathname = new URL(request.url).pathname;
            if (/^\/uploads\/(?:tasks|avatars)(?:\/|$)/.test(pathname))
              return cache.delete(request);
            return Promise.resolve(false);
          }),
        );
      }
    })(),
  );
});
