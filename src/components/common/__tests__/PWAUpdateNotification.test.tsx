/**
 * PWAUpdateNotification Component Tests
 *
 * Tests for PWAUpdateNotification component including:
 * - Showing notification when update available
 * - Reloading app on update button click
 * - Dismissing notification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PWAUpdateNotification } from '../PWAUpdateNotification';

// Mock metrics
vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    pwa: {
      update: vi.fn(),
    },
  },
}));

// Mock workbox-window
const mockWorkbox = {
  addEventListener: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
};

vi.mock('workbox-window', () => ({
  Workbox: vi.fn(() => mockWorkbox),
}));

describe('PWAUpdateNotification', () => {
  let mockServiceWorker: {
    postMessage: ReturnType<typeof vi.fn>;
  };
  let mockRegistration: {
    waiting: ServiceWorker | null;
  };
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Mock service worker
    mockServiceWorker = {
      postMessage: vi.fn(),
    };

    mockRegistration = {
      waiting: null,
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location.reload
    delete (window as any).location;
    window.location = { reload: vi.fn() } as any;

    // Suppress console errors
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear mock calls
    mockWorkbox.addEventListener.mockClear();
    mockWorkbox.register.mockClear();
  });

  afterEach(() => {
    // Restore NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should not show notification initially', () => {
      render(<PWAUpdateNotification />);
      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
    });

    it('should register service worker in production', async () => {
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.register).toHaveBeenCalled();
      });
    });

    it('should not register service worker in development', async () => {
      process.env.NODE_ENV = 'development';
      render(<PWAUpdateNotification />);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockWorkbox.register).not.toHaveBeenCalled();
    });

    it('should handle service worker not supported', () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { container } = render(<PWAUpdateNotification />);
      expect(container).toBeTruthy();
    });
  });

  describe('update detection', () => {
    it('should show notification when waiting event fires', async () => {
      render(<PWAUpdateNotification />);

      // Wait for Workbox to initialize
      await waitFor(() => {
        expect(mockWorkbox.addEventListener).toHaveBeenCalled();
      });

      // Find and call the waiting event handler
      const waitingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'waiting'
      )?.[1];

      if (waitingHandler) {
        waitingHandler({ sw: mockServiceWorker });
      }

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should show notification when registration has waiting worker', async () => {
      mockRegistration.waiting = mockServiceWorker as any;

      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should check for updates on mount', async () => {
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistration).toHaveBeenCalled();
      });
    });
  });

  describe('update functionality', () => {
    beforeEach(async () => {
      // Setup: render component and trigger waiting event
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.addEventListener).toHaveBeenCalled();
      });

      const waitingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'waiting'
      )?.[1];

      if (waitingHandler) {
        waitingHandler({ sw: mockServiceWorker });
      }

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should send SKIP_WAITING message when Reload button clicked', async () => {
      const user = userEvent.setup();

      const reloadButton = screen.getByText('Reload Now');
      await user.click(reloadButton);

      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });

    it('should hide notification after reload clicked', async () => {
      const user = userEvent.setup();

      const reloadButton = screen.getByText('Reload Now');
      await user.click(reloadButton);

      await waitFor(() => {
        expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
      });
    });

    it('should reload page when controlling event fires', async () => {
      // Find and call the controlling event handler
      const controllingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'controlling'
      )?.[1];

      if (controllingHandler) {
        controllingHandler({});
      }

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('dismiss functionality', () => {
    beforeEach(async () => {
      // Setup: render component and trigger waiting event
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.addEventListener).toHaveBeenCalled();
      });

      const waitingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'waiting'
      )?.[1];

      if (waitingHandler) {
        waitingHandler({ sw: mockServiceWorker });
      }

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should dismiss notification when close button clicked', async () => {
      const user = userEvent.setup();

      const closeButton = screen.getByLabelText('Dismiss update notification');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    beforeEach(async () => {
      // Setup: render component and trigger waiting event
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.addEventListener).toHaveBeenCalled();
      });

      const waitingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'waiting'
      )?.[1];

      if (waitingHandler) {
        waitingHandler({ sw: mockServiceWorker });
      }

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes', () => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-labelledby', 'pwa-update-title');
      expect(alert).toHaveAttribute('aria-describedby', 'pwa-update-description');
    });

    it('should support keyboard navigation for reload button', async () => {
      const user = userEvent.setup();

      const reloadButton = screen.getByText('Reload Now');
      reloadButton.focus();
      await user.keyboard('{Enter}');

      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });

    it('should support keyboard navigation for dismiss button', async () => {
      const user = userEvent.setup();

      const closeButton = screen.getByLabelText('Dismiss update notification');
      closeButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle Workbox import failure', async () => {
      vi.doMock('workbox-window', () => {
        throw new Error('Failed to load Workbox');
      });

      const { container } = render(<PWAUpdateNotification />);
      expect(container).toBeTruthy();
    });

    it('should handle service worker registration failure', async () => {
      mockWorkbox.register.mockRejectedValue(new Error('Registration failed'));

      const { container } = render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.register).toHaveBeenCalled();
      });

      expect(container).toBeTruthy();
    });

    it('should handle getRegistration failure', async () => {
      (navigator.serviceWorker.getRegistration as any).mockRejectedValue(
        new Error('Failed to get registration')
      );

      const { container } = render(<PWAUpdateNotification />);
      expect(container).toBeTruthy();
    });

    it('should handle missing waiting worker gracefully', async () => {
      const user = userEvent.setup();
      render(<PWAUpdateNotification />);

      await waitFor(() => {
        expect(mockWorkbox.addEventListener).toHaveBeenCalled();
      });

      // Trigger waiting event without sw
      const waitingHandler = mockWorkbox.addEventListener.mock.calls.find(
        ([event]) => event === 'waiting'
      )?.[1];

      if (waitingHandler) {
        waitingHandler({ sw: null });
      }

      await waitFor(() => {
        expect(screen.getByText('Update Available')).toBeInTheDocument();
      });

      // Try to click reload - should not throw error
      const reloadButton = screen.getByText('Reload Now');
      await user.click(reloadButton);

      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('periodic checks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should check for updates every 5 minutes', async () => {
      render(<PWAUpdateNotification />);

      // Initial check
      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistration).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistration).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistration).toHaveBeenCalledTimes(3);
      });
    });
  });
});
