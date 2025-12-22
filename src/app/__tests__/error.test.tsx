/**
 * Global Error Component Tests
 *
 * Tests for the global error page component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from '../error';

// Helper to create error objects
function createError(message: string): Error & { digest?: string } {
  return new globalThis.Error(message) as Error & { digest?: string };
}

describe('Error Component', () => {
  let mockReset: () => void;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReset = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render error message', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      expect(screen.getByText('Something went wrong!')).toBeDefined();
      expect(
        screen.getByText('We apologize for the inconvenience. An unexpected error occurred.')
      ).toBeDefined();
    });

    it('should render error icon', () => {
      const error = createError('Test error');
      const { container } = render(<ErrorPage error={error} reset={mockReset} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeDefined();
    });

    it('should render Try Again button', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
    });

    it('should render Go Home button', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      expect(screen.getByRole('button', { name: /go home/i })).toBeDefined();
    });
  });

  describe('error logging', () => {
    it('should log error to console on mount', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error);
    });

    it('should log error when error prop changes', () => {
      const error1 = createError('First error');
      const { rerender } = render(<ErrorPage error={error1} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error1);

      consoleErrorSpy.mockClear();

      const error2 = createError('Second error');
      rerender(<ErrorPage error={error2} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error2);
    });
  });

  describe('user interactions', () => {
    it('should call reset when Try Again button clicked', async () => {
      const user = userEvent.setup();
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should navigate to home when Go Home button clicked', async () => {
      const user = userEvent.setup();
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });
  });

  describe('error with digest', () => {
    it('should handle error with digest property', () => {
      const error = createError('Test error');
      error.digest = 'error-digest-123';

      const { container } = render(<ErrorPage error={error} reset={mockReset} />);
      expect(container).toBeTruthy();
    });
  });
});
