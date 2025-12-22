import type { Meta, StoryObj } from '@storybook/react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

/**
 * PWAInstallPrompt Component
 *
 * Displays a custom install prompt when the browser's beforeinstallprompt event fires.
 * Allows users to install the PWA with a single click.
 *
 * Note: In Storybook, the component is rendered directly for visualization.
 * In production, it only appears when the beforeinstallprompt event is triggered.
 */
const meta = {
  title: 'Common/PWAInstallPrompt',
  component: PWAInstallPrompt,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PWAInstallPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default PWA install prompt
 *
 * Note: This story shows the component's UI. In production, it only appears
 * when the browser supports PWA installation and hasn't been dismissed recently.
 */
export const Default: Story = {
  render: () => (
    <div className="relative h-96 bg-background">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Sample Page Content</h2>
        <p className="text-muted-foreground">
          This demonstrates how the PWA install prompt appears at the bottom of the page.
        </p>
      </div>
      {/* Simulated prompt - actual component relies on browser events */}
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Dismiss install prompt"
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
                className="h-5 w-5 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <h3 id="pwa-install-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Install Catchup Feed
              </h3>
            </div>
            <p id="pwa-install-description" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Install our app for a better experience. Access your feed offline and get quick access from
              your home screen.
            </p>
            <button
              className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
              type="button"
            >
              Install App
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
          On mobile, the prompt takes full width with proper spacing.
        </p>
      </div>
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Dismiss install prompt"
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
                className="h-5 w-5 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <h3 id="pwa-install-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Install Catchup Feed
              </h3>
            </div>
            <p id="pwa-install-description" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Install our app for a better experience. Access your feed offline and get quick access from
              your home screen.
            </p>
            <button
              className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
              type="button"
            >
              Install App
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
          On desktop, the prompt appears in the bottom-right corner as a fixed-width card.
        </p>
      </div>
      <div
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Dismiss install prompt"
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
                className="h-5 w-5 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <h3 id="pwa-install-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Install Catchup Feed
              </h3>
            </div>
            <p id="pwa-install-description" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Install our app for a better experience. Access your feed offline and get quick access from
              your home screen.
            </p>
            <button
              className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
              type="button"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};
