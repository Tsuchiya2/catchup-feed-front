import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

try {
  const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
      // Strategy 1: Google Fonts Stylesheets
      {
        matcher: ({ url }) => url.origin === 'https://fonts.googleapis.com',
        handler: new CacheFirst({
          cacheName: 'google-fonts-cache',
          plugins: [
            new ExpirationPlugin({
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            }),
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
          ],
        }),
      },
      // Strategy 2: Google Static Fonts
      {
        matcher: ({ url }) => url.origin === 'https://fonts.gstatic.com',
        handler: new CacheFirst({
          cacheName: 'gstatic-fonts-cache',
          plugins: [
            new ExpirationPlugin({
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            }),
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
          ],
        }),
      },
      // Strategy 3: Images
      {
        matcher: ({ request }) => request.destination === 'image',
        handler: new CacheFirst({
          cacheName: 'image-cache',
          plugins: [
            new ExpirationPlugin({
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
          ],
        }),
      },
      // Strategy 4: Static Resources (JS, CSS, fonts)
      {
        matcher: ({ request }) =>
          request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'font',
        handler: new StaleWhileRevalidate({
          cacheName: 'static-resources-cache',
          plugins: [
            new ExpirationPlugin({
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60, // 1 day
            }),
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
          ],
        }),
      },
      // Strategy 5: API Requests
      {
        matcher: ({ url }) => url.pathname.startsWith('/api/'),
        handler: new NetworkFirst({
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          plugins: [
            new ExpirationPlugin({
              maxEntries: 100,
              maxAgeSeconds: 60 * 60, // 1 hour
            }),
            new CacheableResponsePlugin({
              statuses: [0, 200],
            }),
          ],
        }),
      },
      ...defaultCache,
    ],
  });

  serwist.addEventListeners();
} catch (error) {
  console.error('[ServiceWorker] Initialization failed', error);
  // Fallback: basic fetch passthrough (app works without caching)
  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
  });
}
