/**
 * PWAInstallPrompt Component Tests
 *
 * Tests for PWAInstallPrompt component including:
 * - Showing prompt on beforeinstallprompt event
 * - Installing app when button clicked
 * - Dismissing prompt
 * - Persisting dismissal to localStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

// Mock metrics
vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    pwa: {
      install: vi.fn(),
    },
  },
}));

describe('PWAInstallPrompt', () => {
  let localStorageMock: Record<string, string>;
  let mockPromptEvent: {
    preventDefault: ReturnType<typeof vi.fn>;
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    // Mock beforeinstallprompt event
    mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    };

    // Suppress console.log in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('event handling', () => {
    it('should not show prompt initially', () => {
      render(<PWAInstallPrompt />);
      expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
    });

    it('should show prompt when beforeinstallprompt event fires', async () => {
      render(<PWAInstallPrompt />);

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install Catchup Feed')).toBeInTheDocument();
      });
    });

    it('should prevent default browser install prompt', async () => {
      render(<PWAInstallPrompt />);

      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      expect(mockPromptEvent.preventDefault).toHaveBeenCalled();
    });

    it('should hide prompt when appinstalled event fires', async () => {
      render(<PWAInstallPrompt />);

      // Show prompt
      const promptEvent = new Event('beforeinstallprompt') as any;
      Object.assign(promptEvent, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(promptEvent);
      });

      await waitFor(() => {
        expect(screen.getByText('Install Catchup Feed')).toBeInTheDocument();
      });

      // Trigger app installed
      const installedEvent = new Event('appinstalled');
      await act(async () => {
        window.dispatchEvent(installedEvent);
      });

      await waitFor(() => {
        expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
      });
    });
  });

  describe('install functionality', () => {
    it('should trigger install prompt when Install button clicked', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install App')).toBeInTheDocument();
      });

      const installButton = screen.getByText('Install App');
      await user.click(installButton);

      expect(mockPromptEvent.prompt).toHaveBeenCalled();
    });

    it('should hide prompt after install accepted', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install App')).toBeInTheDocument();
      });

      const installButton = screen.getByText('Install App');
      await user.click(installButton);

      await waitFor(() => {
        expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
      });
    });

    it('should handle install dismissal', async () => {
      const user = userEvent.setup();
      mockPromptEvent.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });

      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install App')).toBeInTheDocument();
      });

      const installButton = screen.getByText('Install App');
      await user.click(installButton);

      await waitFor(() => {
        expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
      });
    });
  });

  describe('dismiss functionality', () => {
    it('should dismiss prompt when close button clicked', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Dismiss install prompt')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Dismiss install prompt');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
      });
    });

    it('should save dismissal time to localStorage', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Dismiss install prompt')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Dismiss install prompt');
      await user.click(closeButton);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pwa-install-prompt-dismissed',
        expect.any(String)
      );
    });

    it('should not show prompt if dismissed recently', async () => {
      // Set dismissal time to 1 day ago
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      localStorageMock['pwa-install-prompt-dismissed'] = oneDayAgo.toString();

      render(<PWAInstallPrompt />);

      // Trigger event
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      // Prompt should not appear
      expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
    });

    it('should show prompt if dismissal expired (>7 days)', async () => {
      // Set dismissal time to 8 days ago
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      localStorageMock['pwa-install-prompt-dismissed'] = eightDaysAgo.toString();

      render(<PWAInstallPrompt />);

      // Trigger event
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install Catchup Feed')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'pwa-install-title');
        expect(dialog).toHaveAttribute('aria-describedby', 'pwa-install-description');
      });
    });

    it('should support keyboard navigation for install button', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('Install App')).toBeInTheDocument();
      });

      const installButton = screen.getByText('Install App');
      installButton.focus();
      await user.keyboard('{Enter}');

      expect(mockPromptEvent.prompt).toHaveBeenCalled();
    });

    it('should support keyboard navigation for dismiss button', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Dismiss install prompt')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Dismiss install prompt');
      closeButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Install Catchup Feed')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing deferred prompt gracefully', async () => {
      const user = userEvent.setup();
      render(<PWAInstallPrompt />);

      // Show prompt but don't trigger beforeinstallprompt event
      const { container } = render(<PWAInstallPrompt />);

      // No error should be thrown
      expect(container).toBeTruthy();
    });
  });
});
