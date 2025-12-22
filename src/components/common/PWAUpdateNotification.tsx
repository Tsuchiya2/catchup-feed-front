'use client';

/**
 * PWA Update Notification Component
 *
 * Displays a notification when a new version of the PWA is available.
 * Uses Workbox Window to detect updates and provides a reload button.
 *
 * Features:
 * - Detects service worker updates
 * - Shows notification when update is available
 * - Allows user to reload and apply update
 * - Tracks update events with metrics
 * - Can be dismissed
 *
 * @module components/common/PWAUpdateNotification
 */

import { useEffect, useState, useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { metrics } from '@/lib/observability/metrics';

/**
 * PWA Update Notification Component
 *
 * Shows a notification when a service worker update is available
 * and allows the user to reload the page to apply the update.
 */
export function PWAUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const hasRecordedUpdate = useRef(false);

  // Helper to record update metric only once
  const recordUpdateMetric = () => {
    if (!hasRecordedUpdate.current) {
      hasRecordedUpdate.current = true;
      metrics.pwa.update();
    }
  };

  useEffect(() => {
    // Only run in browser and when service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let wb: InstanceType<typeof import('workbox-window').Workbox> | null = null;

    // Import Workbox Window dynamically
    import('workbox-window')
      .then(({ Workbox }) => {
        // Check if running in production and PWA is enabled
        if (process.env.NODE_ENV !== 'production') {
          return;
        }

        wb = new Workbox('/sw.js');

        // Listen for waiting event
        wb.addEventListener('waiting', (event) => {
          console.log('New service worker is waiting');
          setWaitingWorker(event.sw ?? null);
          setShowNotification(true);
          recordUpdateMetric();
        });

        // Listen for controlling event (new SW has taken control)
        wb.addEventListener('controlling', () => {
          console.log('New service worker is controlling');
          window.location.reload();
        });

        // Register the service worker
        wb.register().catch((error) => {
          console.error('Service worker registration failed:', error);
        });
      })
      .catch((error) => {
        console.error('Failed to load Workbox:', error);
      });

    // Also listen for updates using native API as fallback
    const checkForUpdates = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration?.waiting) {
            setWaitingWorker(registration.waiting);
            setShowNotification(true);
            recordUpdateMetric();
          }
        })
        .catch((error) => {
          console.error('Failed to check for service worker updates:', error);
        });
    };

    // Check for updates on load
    checkForUpdates();

    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      // Note: Workbox event listeners are automatically cleaned up when the
      // service worker is unregistered or replaced
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) {
      return;
    }

    // Tell the waiting service worker to take control immediately
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // The page will reload when the new service worker takes control
    setShowNotification(false);
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
      role="alert"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-description"
    >
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-800 dark:bg-blue-900/20">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-blue-800 dark:hover:text-blue-300"
          aria-label="Dismiss update notification"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" aria-hidden="true" />
            <h3
              id="pwa-update-title"
              className="text-sm font-semibold text-blue-900 dark:text-blue-100"
            >
              Update Available
            </h3>
          </div>

          <p id="pwa-update-description" className="mb-4 text-sm text-blue-700 dark:text-blue-300">
            A new version of Catchup Feed is available. Reload to get the latest features and
            improvements.
          </p>

          {/* Update button */}
          <button
            onClick={handleUpdate}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            type="button"
          >
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
}
