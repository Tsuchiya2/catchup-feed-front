/**
 * Global Error Component Tests
 *
 * Tests for the global error page component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Error from '../error';

describe('Error Component', () => {
  let mockReset: ReturnType<typeof vi.fn>;
  let originalEnv: string | undefined;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReset = vi.fn();
    originalEnv = process.env.NODE_ENV;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    }
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render error message', () => {
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
      expect(
        screen.getByText('We apologize for the inconvenience. An unexpected error occurred.')
      ).toBeInTheDocument();
    });

    it('should render error icon', () => {
      const error = new Error('Test error');
      const { container } = render(<Error error={error} reset={mockReset} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Try Again button', () => {
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should render Go Home button', () => {
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });
  });

  describe('error details in development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should show error message in development', () => {
      const error = new Error('Detailed error message');
      render(<Error error={error} reset={mockReset} />);

      expect(screen.getByText('Detailed error message')).toBeInTheDocument();
    });

    it('should not show error message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Detailed error message');
      render(<Error error={error} reset={mockReset} />);

      expect(screen.queryByText('Detailed error message')).not.toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('should log error to console on mount', () => {
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error);
    });

    it('should log error when error prop changes', () => {
      const error1 = new Error('First error');
      const { rerender } = render(<Error error={error1} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error1);

      consoleErrorSpy.mockClear();

      const error2 = new Error('Second error');
      rerender(<Error error={error2} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error2);
    });
  });

  describe('user interactions', () => {
    it('should call reset when Try Again button clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should navigate to home when Go Home button clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      render(<Error error={error} reset={mockReset} />);

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });
  });

  describe('error with digest', () => {
    it('should handle error with digest property', () => {
      const error = new Error('Test error') as Error & { digest?: string };
      error.digest = 'error-digest-123';

      const { container } = render(<Error error={error} reset={mockReset} />);
      expect(container).toBeTruthy();
    });
  });
});
