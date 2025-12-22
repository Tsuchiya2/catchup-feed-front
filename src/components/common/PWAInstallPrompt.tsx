'use client';

/**
 * PWA Install Prompt Component
 *
 * Displays a custom install prompt when the browser's beforeinstallprompt event fires.
 * Allows users to install the PWA with a single click.
 *
 * Features:
 * - Listens for beforeinstallprompt event
 * - Shows custom install UI
 * - Tracks install events with metrics
 * - Persists dismissal state in localStorage
 * - Accessible with keyboard navigation
 *
 * @module components/common/PWAInstallPrompt
 */

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { metrics } from '@/lib/observability/metrics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'pwa-install-prompt-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * PWA Install Prompt Component
 *
 * Shows a prompt to install the app when the browser supports PWA installation
 * and the user hasn't dismissed it recently.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the prompt was dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION) {
        return; // Don't show prompt if dismissed recently
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault();

      // Save the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      metrics.pwa.install();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      metrics.pwa.install();
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Save dismissal time to localStorage
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          onKeyDown={(e) => handleKeyDown(e, handleDismiss)}
          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Dismiss install prompt"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <div className="mb-2 flex items-center gap-2">
            <Download className="h-5 w-5 text-sky-500" aria-hidden="true" />
            <h3
              id="pwa-install-title"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              Install Catchup Feed
            </h3>
          </div>

          <p id="pwa-install-description" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Install our app for a better experience. Access your feed offline and get quick access
            from your home screen.
          </p>

          {/* Install button */}
          <button
            onClick={handleInstallClick}
            onKeyDown={(e) => handleKeyDown(e, handleInstallClick)}
            className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            type="button"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
