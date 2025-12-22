'use client';

import React, { ReactNode } from 'react';
import { isFeatureEnabled, type FeatureName } from '@/lib/features';
import { FeatureErrorBoundary } from '@/components/errors/FeatureErrorBoundary';

/**
 * Props for FeatureGate component
 */
interface FeatureGateProps {
  /** Name of the feature to check */
  feature: FeatureName;
  /** Children to render if feature is enabled */
  children: ReactNode;
  /** Optional fallback to render if feature is disabled */
  fallback?: ReactNode;
}

/**
 * Feature Gate Component
 *
 * Conditionally renders children based on feature flag state.
 * Wraps children in an error boundary to prevent feature errors from crashing the app.
 *
 * @example
 * ```tsx
 * <FeatureGate feature="pwa">
 *   <PWAInstallPrompt />
 * </FeatureGate>
 * ```
 *
 * @example
 * ```tsx
 * <FeatureGate
 *   feature="aiSummary"
 *   fallback={<p>AI summary is not available</p>}
 * >
 *   <AISummaryCard />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps): ReactNode {
  // Check if feature is enabled
  const enabled = isFeatureEnabled(feature);

  // If feature is disabled, render fallback or nothing
  if (!enabled) {
    return fallback;
  }

  // If enabled, wrap children in error boundary to prevent crashes
  return <FeatureErrorBoundary featureName={feature}>{children}</FeatureErrorBoundary>;
}
