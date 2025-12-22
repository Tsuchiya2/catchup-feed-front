/**
 * FeatureErrorBoundary Component Tests
 *
 * Tests for FeatureErrorBoundary including:
 * - Catching errors
 * - Custom error handlers
 * - Custom fallback UI
 * - Logging to Sentry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureErrorBoundary } from '../FeatureErrorBoundary';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>No error</div>;
};

describe('FeatureErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error catching', () => {
    it('should catch errors from child components', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      // Component should not crash the app
      expect(screen.queryByText('Test error from component')).not.toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError shouldThrow={false} />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should hide feature by default when error occurs', () => {
      const { container } = render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      // Should render nothing (null)
      expect(container.firstChild).toBeNull();
    });
  });

  describe('custom fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const fallback = <div>Custom error message</div>;

      render(
        <FeatureErrorBoundary featureName="test-feature" fallback={fallback}>
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should render custom JSX fallback', () => {
      const fallback = (
        <div className="error-container">
          <h1>Error</h1>
          <p>Something went wrong</p>
        </div>
      );

      render(
        <FeatureErrorBoundary featureName="test-feature" fallback={fallback}>
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('logging to Sentry', () => {
    it('should log error to Sentry when caught', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      expect(captureCall[0].message).toBe('Test error from component');
    });

    it('should include feature name in Sentry tags', () => {
      render(
        <FeatureErrorBoundary featureName="pwa-install">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      const options = captureCall[1];

      expect(options.tags).toEqual({
        feature: 'pwa-install',
        errorBoundary: 'FeatureErrorBoundary',
      });
    });

    it('should include component stack in Sentry context', () => {
      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      const options = captureCall[1];

      expect(options.contexts).toHaveProperty('react');
      expect(options.contexts.react).toHaveProperty('componentStack');
    });
  });

  describe('logging to observability system', () => {
    it('should log error to logger', async () => {
      const { logger } = await import('@/lib/logger');

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalled();
      const logCall = (logger.error as any).mock.calls[0];

      expect(logCall[0]).toBe('Feature error: test-feature');
      expect(logCall[1].message).toBe('Test error from component');
    });

    it('should include feature name in log context', async () => {
      const { logger } = await import('@/lib/logger');

      render(
        <FeatureErrorBoundary featureName="dashboard-widget">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalled();
      const logCall = (logger.error as any).mock.calls[0];
      const context = logCall[2];

      expect(context.feature).toBe('dashboard-widget');
    });

    it('should include component stack in log context', async () => {
      const { logger } = await import('@/lib/logger');

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalled();
      const logCall = (logger.error as any).mock.calls[0];
      const context = logCall[2];

      expect(context).toHaveProperty('componentStack');
      expect(context.componentStack).toBeTruthy();
    });
  });

  describe('error state management', () => {
    it('should update state when error occurs', () => {
      const { container } = render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      // Boundary should have caught error and rendered nothing
      expect(container.firstChild).toBeNull();
    });

    it('should handle multiple different errors', () => {
      const ThrowDifferentError = ({ errorMessage }: { errorMessage: string }) => {
        throw new Error(errorMessage);
      };

      const { rerender } = render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowDifferentError errorMessage="First error" />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      rerender(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowDifferentError errorMessage="Second error" />
        </FeatureErrorBoundary>
      );

      // Should still be in error state
      expect(Sentry.captureException).toHaveBeenCalledTimes(0);
    });
  });

  describe('feature name variations', () => {
    it('should handle simple feature names', () => {
      render(
        <FeatureErrorBoundary featureName="notifications">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      expect(captureCall[1].tags.feature).toBe('notifications');
    });

    it('should handle complex feature names', () => {
      render(
        <FeatureErrorBoundary featureName="article-search-filters">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      expect(captureCall[1].tags.feature).toBe('article-search-filters');
    });
  });

  describe('nested components', () => {
    it('should catch errors from deeply nested children', () => {
      const DeepChild = () => {
        throw new Error('Deep error');
      };

      const MiddleChild = () => (
        <div>
          <DeepChild />
        </div>
      );

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <MiddleChild />
        </FeatureErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalled();
      const captureCall = (Sentry.captureException as any).mock.calls[0];
      expect(captureCall[0].message).toBe('Deep error');
    });
  });

  describe('lifecycle', () => {
    it('should call getDerivedStateFromError when error occurs', () => {
      const spy = vi.spyOn(FeatureErrorBoundary, 'getDerivedStateFromError');

      render(
        <FeatureErrorBoundary featureName="test-feature">
          <ThrowError />
        </FeatureErrorBoundary>
      );

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
