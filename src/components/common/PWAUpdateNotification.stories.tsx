import type { Meta, StoryObj } from '@storybook/react';
import { PWAUpdateNotification } from './PWAUpdateNotification';

/**
 * PWAUpdateNotification Component
 *
 * Displays a notification when a new version of the PWA is available.
 * Uses Workbox Window to detect updates and provides a reload button.
 *
 * Note: In Storybook, the component is rendered directly for visualization.
 * In production, it only appears when a service worker update is detected.
 */
const meta = {
  title: 'Common/PWAUpdateNotification',
  component: PWAUpdateNotification,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PWAUpdateNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default PWA update notification
 *
 * Note: This story shows the component's UI. In production, it only appears
 * when a service worker update is detected.
 */
export const Default: Story = {
  render: () => (
    <div className="relative h-96 bg-background">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Application Content</h2>
        <p className="text-muted-foreground">
          This demonstrates how the update notification appears when a new version is available.
        </p>
      </div>
      {/* Simulated notification - actual component relies on service worker events */}
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="alert"
        aria-labelledby="pwa-update-title"
        aria-describedby="pwa-update-description"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-800 dark:bg-blue-900/20">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-800 dark:hover:text-blue-300"
            aria-label="Dismiss update notification"
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-6">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <h3 id="pwa-update-title" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Update Available
              </h3>
            </div>
            <p id="pwa-update-description" className="mb-4 text-sm text-blue-700 dark:text-blue-300">
              A new version of Catchup Feed is available. Reload to get the latest features and improvements.
            </p>
            <button
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              type="button"
            >
              Reload Now
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="relative h-96 bg-background">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Mobile View</h2>
        <p className="text-muted-foreground">
          On mobile, the notification takes full width with proper spacing.
        </p>
      </div>
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="alert"
        aria-labelledby="pwa-update-title"
        aria-describedby="pwa-update-description"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-800 dark:bg-blue-900/20">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-800 dark:hover:text-blue-300"
            aria-label="Dismiss update notification"
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-6">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <h3 id="pwa-update-title" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Update Available
              </h3>
            </div>
            <p id="pwa-update-description" className="mb-4 text-sm text-blue-700 dark:text-blue-300">
              A new version of Catchup Feed is available. Reload to get the latest features and improvements.
            </p>
            <button
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              type="button"
            >
              Reload Now
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Desktop view
 */
export const DesktopView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <div className="relative h-96 bg-background">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Desktop View</h2>
        <p className="text-muted-foreground max-w-2xl">
          On desktop, the notification appears in the bottom-right corner as a fixed-width card.
        </p>
      </div>
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="alert"
        aria-labelledby="pwa-update-title"
        aria-describedby="pwa-update-description"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-800 dark:bg-blue-900/20">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-800 dark:hover:text-blue-300"
            aria-label="Dismiss update notification"
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-6">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <h3 id="pwa-update-title" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Update Available
              </h3>
            </div>
            <p id="pwa-update-description" className="mb-4 text-sm text-blue-700 dark:text-blue-300">
              A new version of Catchup Feed is available. Reload to get the latest features and improvements.
            </p>
            <button
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              type="button"
            >
              Reload Now
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Both notifications comparison
 */
export const ComparisonWithInstallPrompt: Story = {
  render: () => (
    <div className="relative h-96 bg-background">
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Side-by-Side Comparison</h2>
        <p className="text-muted-foreground max-w-2xl mb-4">
          Update notification uses blue theme to differentiate from install prompt.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Install Prompt (Sky Blue)</h3>
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-sm font-semibold">Install Catchup Feed</span>
              </div>
              <button className="w-full rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">
                Install App
              </button>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Update Notification (Blue)</h3>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 shadow dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Update Available</span>
              </div>
              <button className="w-full rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white">
                Reload Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
