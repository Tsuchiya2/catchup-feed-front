/**
 * Security Configuration
 *
 * Centralized security headers and Content Security Policy (CSP) configuration.
 * These headers help protect against common web vulnerabilities.
 *
 * @module config/security
 */

import { appConfig } from './app.config';

/**
 * Security Header Configuration
 */
export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Content Security Policy Directives
 */
export interface CSPDirectives {
  /** Default source for content */
  'default-src': string[];
  /** Script sources */
  'script-src': string[];
  /** Style sources */
  'style-src': string[];
  /** Image sources */
  'img-src': string[];
  /** Font sources */
  'font-src': string[];
  /** Connection sources (API calls, WebSocket, etc.) */
  'connect-src': string[];
  /** Frame sources */
  'frame-src': string[];
  /** Object sources */
  'object-src': string[];
  /** Base URI */
  'base-uri': string[];
  /** Form action */
  'form-action': string[];
  /** Frame ancestors */
  'frame-ancestors': string[];
  /** Upgrade insecure requests */
  'upgrade-insecure-requests'?: boolean;
}

/**
 * Security Configuration
 */
export interface SecurityConfig {
  /** Security headers to apply */
  headers: SecurityHeader[];
  /** Content Security Policy directives */
  csp: CSPDirectives;
}

/**
 * Build Content Security Policy string from directives
 */
function buildCSP(directives: CSPDirectives): string {
  const cspParts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (key === 'upgrade-insecure-requests' && value === true) {
      cspParts.push('upgrade-insecure-requests');
    } else if (Array.isArray(value)) {
      cspParts.push(`${key} ${value.join(' ')}`);
    }
  }

  return cspParts.join('; ');
}

/**
 * Content Security Policy Directives
 */
const cspDirectives: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js in development
    "'unsafe-inline'", // Required for Next.js inline scripts
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and styled-components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:', // Required for inline images (base64)
    'blob:', // Required for generated images
    'https:', // Allow all HTTPS images
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    appConfig.api.baseUrl, // Allow API calls to backend
    ...(appConfig.observability.sentryDsn
      ? ['https://*.ingest.sentry.io'] // Allow Sentry if configured
      : []),
  ],
  'frame-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  ...(appConfig.env.isProduction ? { 'upgrade-insecure-requests': true } : {}),
};

/**
 * Security Configuration Object
 */
export const securityConfig: SecurityConfig = {
  csp: cspDirectives,
  headers: [
    // Strict-Transport-Security (HSTS)
    // Force HTTPS for 1 year, include subdomains
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    },

    // X-Frame-Options
    // Prevent clickjacking attacks
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },

    // X-Content-Type-Options
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },

    // Referrer-Policy
    // Control referrer information
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },

    // Permissions-Policy
    // Control browser features and APIs
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },

    // X-DNS-Prefetch-Control
    // Control DNS prefetching
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },

    // Content-Security-Policy
    // Comprehensive CSP to prevent XSS and other injection attacks
    {
      key: 'Content-Security-Policy',
      value: buildCSP(cspDirectives),
    },
  ],
};

/**
 * Get security headers formatted for Next.js config
 *
 * @returns Array of security headers
 */
export function getSecurityHeaders(): SecurityHeader[] {
  return securityConfig.headers;
}
