/**
 * FeatureGate Component Tests
 *
 * Tests for FeatureGate component including:
 * - Rendering children when feature enabled
 * - Hiding children when feature disabled
 * - Rendering fallback UI
 * - Error boundary wrapping
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureGate } from '../FeatureGate';
import { appConfig } from '@/config/app.config';

// Mock FeatureErrorBoundary
vi.mock('@/components/errors/FeatureErrorBoundary', () => ({
  FeatureErrorBoundary: ({ children, featureName }: any) => (
    <div data-testid="error-boundary" data-feature={featureName}>
      {children}
    </div>
  ),
}));

describe('FeatureGate', () => {
  let originalFeatures: typeof appConfig.features;

  beforeEach(() => {
    // Save original feature flags
    originalFeatures = { ...appConfig.features };
  });

  afterEach(() => {
    // Restore original feature flags
    appConfig.features = originalFeatures;
    vi.restoreAllMocks();
  });

  describe('rendering with enabled features', () => {
    it('should render children when feature is enabled', () => {
      appConfig.features.pwa = true;

      render(
        <FeatureGate feature="pwa">
          <div>PWA Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('PWA Content')).toBeInTheDocument();
    });

    it('should wrap children in error boundary when enabled', () => {
      appConfig.features.darkMode = true;

      render(
        <FeatureGate feature="darkMode">
          <div>Dark Mode Content</div>
        </FeatureGate>
      );

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
      expect(errorBoundary).toHaveAttribute('data-feature', 'darkMode');
    });

    it('should render all children when feature is enabled', () => {
      appConfig.features.aiSummary = true;

      render(
        <FeatureGate feature="aiSummary">
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </FeatureGate>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('rendering with disabled features', () => {
    it('should not render children when feature is disabled', () => {
      appConfig.features.pwa = false;

      render(
        <FeatureGate feature="pwa">
          <div>PWA Content</div>
        </FeatureGate>
      );

      expect(screen.queryByText('PWA Content')).not.toBeInTheDocument();
    });

    it('should not render error boundary when feature is disabled', () => {
      appConfig.features.darkMode = false;

      render(
        <FeatureGate feature="darkMode">
          <div>Dark Mode Content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should render null when feature is disabled and no fallback', () => {
      appConfig.features.aiSummary = false;

      const { container } = render(
        <FeatureGate feature="aiSummary">
          <div>AI Summary Content</div>
        </FeatureGate>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('fallback rendering', () => {
    it('should render fallback when feature is disabled', () => {
      appConfig.features.pwa = false;

      render(
        <FeatureGate feature="pwa" fallback={<div>PWA not available</div>}>
          <div>PWA Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('PWA not available')).toBeInTheDocument();
      expect(screen.queryByText('PWA Content')).not.toBeInTheDocument();
    });

    it('should not render fallback when feature is enabled', () => {
      appConfig.features.aiSummary = true;

      render(
        <FeatureGate feature="aiSummary" fallback={<div>AI Summary not available</div>}>
          <div>AI Summary Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('AI Summary Content')).toBeInTheDocument();
      expect(screen.queryByText('AI Summary not available')).not.toBeInTheDocument();
    });

    it('should render custom JSX fallback', () => {
      appConfig.features.darkMode = false;

      render(
        <FeatureGate
          feature="darkMode"
          fallback={
            <div className="fallback">
              <h1>Feature Unavailable</h1>
              <p>Dark mode is not enabled</p>
            </div>
          }
        >
          <div>Dark Mode Toggle</div>
        </FeatureGate>
      );

      expect(screen.getByText('Feature Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Dark mode is not enabled')).toBeInTheDocument();
    });

    it('should render null fallback explicitly', () => {
      appConfig.features.tokenRefresh = false;

      const { container } = render(
        <FeatureGate feature="tokenRefresh" fallback={null}>
          <div>Token Refresh Content</div>
        </FeatureGate>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('different feature types', () => {
    it('should handle pwa feature', () => {
      appConfig.features.pwa = true;

      render(
        <FeatureGate feature="pwa">
          <div>PWA Component</div>
        </FeatureGate>
      );

      expect(screen.getByText('PWA Component')).toBeInTheDocument();
    });

    it('should handle darkMode feature', () => {
      appConfig.features.darkMode = true;

      render(
        <FeatureGate feature="darkMode">
          <div>Theme Toggle</div>
        </FeatureGate>
      );

      expect(screen.getByText('Theme Toggle')).toBeInTheDocument();
    });

    it('should handle aiSummary feature', () => {
      appConfig.features.aiSummary = true;

      render(
        <FeatureGate feature="aiSummary">
          <div>AI Summary Card</div>
        </FeatureGate>
      );

      expect(screen.getByText('AI Summary Card')).toBeInTheDocument();
    });

    it('should handle tokenRefresh feature', () => {
      appConfig.features.tokenRefresh = true;

      render(
        <FeatureGate feature="tokenRefresh">
          <div>Token Refresh Logic</div>
        </FeatureGate>
      );

      expect(screen.getByText('Token Refresh Logic')).toBeInTheDocument();
    });
  });

  describe('dynamic feature toggling', () => {
    it('should reflect feature flag changes', () => {
      appConfig.features.pwa = false;

      const { rerender } = render(
        <FeatureGate feature="pwa">
          <div>PWA Content</div>
        </FeatureGate>
      );

      expect(screen.queryByText('PWA Content')).not.toBeInTheDocument();

      // Enable feature
      appConfig.features.pwa = true;

      rerender(
        <FeatureGate feature="pwa">
          <div>PWA Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('PWA Content')).toBeInTheDocument();
    });

    it('should switch to fallback when feature is disabled', () => {
      appConfig.features.aiSummary = true;

      const { rerender } = render(
        <FeatureGate feature="aiSummary" fallback={<div>Fallback</div>}>
          <div>AI Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('AI Content')).toBeInTheDocument();

      // Disable feature
      appConfig.features.aiSummary = false;

      rerender(
        <FeatureGate feature="aiSummary" fallback={<div>Fallback</div>}>
          <div>AI Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Fallback')).toBeInTheDocument();
      expect(screen.queryByText('AI Content')).not.toBeInTheDocument();
    });
  });

  describe('nested children', () => {
    it('should render nested components when enabled', () => {
      appConfig.features.pwa = true;

      render(
        <FeatureGate feature="pwa">
          <div>
            <header>Header</header>
            <main>Main Content</main>
            <footer>Footer</footer>
          </div>
        </FeatureGate>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should not render deeply nested components when disabled', () => {
      appConfig.features.darkMode = false;

      render(
        <FeatureGate feature="darkMode">
          <div>
            <div>
              <div>
                <span>Deeply Nested</span>
              </div>
            </div>
          </div>
        </FeatureGate>
      );

      expect(screen.queryByText('Deeply Nested')).not.toBeInTheDocument();
    });
  });

  describe('error boundary integration', () => {
    it('should pass feature name to error boundary', () => {
      appConfig.features.pwa = true;

      render(
        <FeatureGate feature="pwa">
          <div>Content</div>
        </FeatureGate>
      );

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-feature', 'pwa');
    });

    it('should wrap different features with their names', () => {
      appConfig.features.aiSummary = true;

      render(
        <FeatureGate feature="aiSummary">
          <div>AI Content</div>
        </FeatureGate>
      );

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-feature', 'aiSummary');
    });
  });
});
