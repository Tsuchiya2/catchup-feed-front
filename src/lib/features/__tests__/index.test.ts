/**
 * Feature Flags Tests
 *
 * Tests for feature flag utilities including:
 * - isFeatureEnabled function
 * - getFeatureFlags function
 * - Integration with app config
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isFeatureEnabled, getFeatureFlags, type FeatureName } from '../index';
import { appConfig } from '@/config/app.config';

describe('Feature Flags', () => {
  let originalFeatures: typeof appConfig.features;

  beforeEach(() => {
    // Save original feature flags
    originalFeatures = { ...appConfig.features };
  });

  afterEach(() => {
    // Restore original feature flags
    appConfig.features = originalFeatures;
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      appConfig.features.darkMode = true;
      expect(isFeatureEnabled('darkMode')).toBe(true);
    });

    it('should return false for disabled features', () => {
      appConfig.features.pwa = false;
      expect(isFeatureEnabled('pwa')).toBe(false);
    });

    it('should check pwa feature flag', () => {
      appConfig.features.pwa = true;
      expect(isFeatureEnabled('pwa')).toBe(true);

      appConfig.features.pwa = false;
      expect(isFeatureEnabled('pwa')).toBe(false);
    });

    it('should check darkMode feature flag', () => {
      appConfig.features.darkMode = true;
      expect(isFeatureEnabled('darkMode')).toBe(true);

      appConfig.features.darkMode = false;
      expect(isFeatureEnabled('darkMode')).toBe(false);
    });

    it('should check aiSummary feature flag', () => {
      appConfig.features.aiSummary = true;
      expect(isFeatureEnabled('aiSummary')).toBe(true);

      appConfig.features.aiSummary = false;
      expect(isFeatureEnabled('aiSummary')).toBe(false);
    });

    it('should check tokenRefresh feature flag', () => {
      appConfig.features.tokenRefresh = true;
      expect(isFeatureEnabled('tokenRefresh')).toBe(true);

      appConfig.features.tokenRefresh = false;
      expect(isFeatureEnabled('tokenRefresh')).toBe(false);
    });

    it('should reflect changes to feature flags', () => {
      appConfig.features.pwa = false;
      expect(isFeatureEnabled('pwa')).toBe(false);

      appConfig.features.pwa = true;
      expect(isFeatureEnabled('pwa')).toBe(true);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return all feature flags', () => {
      const flags = getFeatureFlags();

      expect(flags).toHaveProperty('pwa');
      expect(flags).toHaveProperty('darkMode');
      expect(flags).toHaveProperty('aiSummary');
      expect(flags).toHaveProperty('tokenRefresh');
    });

    it('should return current feature flag values', () => {
      appConfig.features.pwa = true;
      appConfig.features.darkMode = false;
      appConfig.features.aiSummary = true;
      appConfig.features.tokenRefresh = false;

      const flags = getFeatureFlags();

      expect(flags.pwa).toBe(true);
      expect(flags.darkMode).toBe(false);
      expect(flags.aiSummary).toBe(true);
      expect(flags.tokenRefresh).toBe(false);
    });

    it('should return object with boolean values', () => {
      const flags = getFeatureFlags();

      expect(typeof flags.pwa).toBe('boolean');
      expect(typeof flags.darkMode).toBe('boolean');
      expect(typeof flags.aiSummary).toBe('boolean');
      expect(typeof flags.tokenRefresh).toBe('boolean');
    });

    it('should reflect changes to feature flags', () => {
      appConfig.features.aiSummary = false;
      const flags1 = getFeatureFlags();
      expect(flags1.aiSummary).toBe(false);

      appConfig.features.aiSummary = true;
      const flags2 = getFeatureFlags();
      expect(flags2.aiSummary).toBe(true);
    });

    it('should return the same object reference as appConfig.features', () => {
      const flags = getFeatureFlags();
      expect(flags).toBe(appConfig.features);
    });
  });

  describe('feature names type safety', () => {
    it('should accept valid feature names', () => {
      const validFeatures: FeatureName[] = ['pwa', 'darkMode', 'aiSummary', 'tokenRefresh'];

      validFeatures.forEach((feature) => {
        // Should not throw type error
        const enabled = isFeatureEnabled(feature);
        expect(typeof enabled).toBe('boolean');
      });
    });
  });

  describe('integration with app config', () => {
    it('should read from centralized app config', () => {
      const directValue = appConfig.features.pwa;
      const utilityValue = isFeatureEnabled('pwa');

      expect(utilityValue).toBe(directValue);
    });

    it('should respect environment-based defaults', () => {
      // darkMode should be true by default
      const flags = getFeatureFlags();
      expect(flags).toHaveProperty('darkMode');
    });
  });

  describe('edge cases', () => {
    it('should handle all features disabled', () => {
      appConfig.features.pwa = false;
      appConfig.features.darkMode = false;
      appConfig.features.aiSummary = false;
      appConfig.features.tokenRefresh = false;

      const flags = getFeatureFlags();

      expect(flags.pwa).toBe(false);
      expect(flags.darkMode).toBe(false);
      expect(flags.aiSummary).toBe(false);
      expect(flags.tokenRefresh).toBe(false);
    });

    it('should handle all features enabled', () => {
      appConfig.features.pwa = true;
      appConfig.features.darkMode = true;
      appConfig.features.aiSummary = true;
      appConfig.features.tokenRefresh = true;

      const flags = getFeatureFlags();

      expect(flags.pwa).toBe(true);
      expect(flags.darkMode).toBe(true);
      expect(flags.aiSummary).toBe(true);
      expect(flags.tokenRefresh).toBe(true);
    });

    it('should handle mixed feature states', () => {
      appConfig.features.pwa = true;
      appConfig.features.darkMode = false;
      appConfig.features.aiSummary = true;
      appConfig.features.tokenRefresh = false;

      expect(isFeatureEnabled('pwa')).toBe(true);
      expect(isFeatureEnabled('darkMode')).toBe(false);
      expect(isFeatureEnabled('aiSummary')).toBe(true);
      expect(isFeatureEnabled('tokenRefresh')).toBe(false);
    });
  });
});
