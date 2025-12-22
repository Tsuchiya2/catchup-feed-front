/**
 * Feature Flag Utilities
 *
 * Provides utilities for checking and managing feature flags.
 * Feature flags are read from the centralized application configuration.
 *
 * @module lib/features
 */

import { appConfig, type FeatureFlags } from '@/config/app.config';

/**
 * Feature flag names
 */
export type FeatureName = keyof FeatureFlags;

/**
 * Check if a specific feature is enabled
 *
 * @param featureName - The name of the feature to check
 * @returns True if the feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('pwa')) {
 *   // Render PWA-specific components
 * }
 * ```
 */
export function isFeatureEnabled(featureName: FeatureName): boolean {
  return appConfig.features[featureName];
}

/**
 * Get all feature flags
 *
 * @returns Object containing all feature flags and their states
 *
 * @example
 * ```typescript
 * const flags = getFeatureFlags();
 * console.log('PWA enabled:', flags.pwa);
 * console.log('Dark mode enabled:', flags.darkMode);
 * ```
 */
export function getFeatureFlags(): FeatureFlags {
  return appConfig.features;
}

/**
 * Re-export FeatureFlags type for convenience
 */
export type { FeatureFlags } from '@/config/app.config';
