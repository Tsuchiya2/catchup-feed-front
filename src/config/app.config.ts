/**
 * Application Configuration
 *
 * Centralized configuration management for the application.
 * All configuration values are read from environment variables with sensible defaults.
 *
 * @module config/app
 */

/**
 * Application Identity
 */
export interface AppIdentity {
  /** Full application name */
  name: string;
  /** Short name for PWA and mobile displays */
  shortName: string;
  /** Application description for metadata */
  description: string;
  /** Application base URL */
  baseUrl: string;
}

/**
 * API Configuration
 */
export interface ApiConfig {
  /** Backend API base URL */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts on failure */
  retryAttempts: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

/**
 * Authentication Configuration
 */
export interface AuthConfig {
  /** Token refresh threshold in seconds (refresh token when less than this time remains) */
  tokenRefreshThreshold: number;
  /** localStorage key for access token */
  accessTokenKey: string;
  /** localStorage key for refresh token */
  refreshTokenKey: string;
  /** Grace period in seconds after token expiry to attempt refresh */
  gracePeriod: number;
}

/**
 * Feature Flags
 */
export interface FeatureFlags {
  /** Enable Progressive Web App features */
  pwa: boolean;
  /** Enable dark mode toggle */
  darkMode: boolean;
  /** Enable AI summary feature */
  aiSummary: boolean;
  /** Enable automatic token refresh */
  tokenRefresh: boolean;
}

/**
 * Observability Configuration
 */
export interface ObservabilityConfig {
  /** Sentry DSN for error tracking */
  sentryDsn: string | null;
  /** Environment name (development, staging, production) */
  environment: string;
  /** Trace sample rate (0.0 to 1.0) */
  tracesSampleRate: number;
  /** Enable custom metrics collection */
  enableMetrics: boolean;
}

/**
 * Environment Detection
 */
export interface EnvironmentConfig {
  /** Is development environment */
  isDevelopment: boolean;
  /** Is production environment */
  isProduction: boolean;
  /** Is test environment */
  isTest: boolean;
  /** Node environment */
  nodeEnv: string;
}

/**
 * Complete Application Configuration
 */
export interface AppConfig {
  app: AppIdentity;
  api: ApiConfig;
  auth: AuthConfig;
  features: FeatureFlags;
  observability: ObservabilityConfig;
  env: EnvironmentConfig;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? defaultValue;
  }
  return defaultValue;
}

/**
 * Get boolean environment variable
 */
function getEnvBool(key: string, defaultValue: boolean): boolean {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key, String(defaultValue));
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get application base URL with fallback chain
 */
function getAppBaseUrl(): string {
  // Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
  const appUrl = getEnvVar('NEXT_PUBLIC_APP_URL', '');
  if (appUrl) return appUrl;

  const vercelUrl = getEnvVar('VERCEL_URL', '');
  if (vercelUrl) return `https://${vercelUrl}`;

  return 'http://localhost:3000';
}

/**
 * Node environment
 */
const nodeEnv = getEnvVar('NODE_ENV', 'development');

/**
 * Application Configuration Object
 */
export const appConfig: AppConfig = {
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Catchup Feed'),
    shortName: getEnvVar('NEXT_PUBLIC_APP_SHORT_NAME', 'Catchup'),
    description: getEnvVar(
      'NEXT_PUBLIC_APP_DESCRIPTION',
      'Your personal feed aggregator and reader'
    ),
    baseUrl: getAppBaseUrl(),
  },

  api: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:8080'),
    timeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 30000),
    retryAttempts: getEnvNumber('NEXT_PUBLIC_API_RETRY_ATTEMPTS', 3),
    retryDelay: getEnvNumber('NEXT_PUBLIC_API_RETRY_DELAY', 1000),
  },

  auth: {
    tokenRefreshThreshold: getEnvNumber('NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD', 300), // 5 minutes
    accessTokenKey: 'catchup_feed_auth_token',
    refreshTokenKey: 'catchup_feed_refresh_token',
    gracePeriod: getEnvNumber('NEXT_PUBLIC_TOKEN_GRACE_PERIOD', 60), // 60 seconds
  },

  features: {
    pwa: getEnvBool('NEXT_PUBLIC_FEATURE_PWA', false),
    darkMode: getEnvBool('NEXT_PUBLIC_FEATURE_DARK_MODE', true),
    aiSummary: getEnvBool('NEXT_PUBLIC_FEATURE_AI_SUMMARY', false),
    tokenRefresh: getEnvBool('NEXT_PUBLIC_FEATURE_TOKEN_REFRESH', true),
  },

  observability: {
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', '') || null,
    environment: getEnvVar('NEXT_PUBLIC_SENTRY_ENV', nodeEnv),
    tracesSampleRate: getEnvNumber('NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE', 0.1),
    enableMetrics: getEnvBool('NEXT_PUBLIC_ENABLE_METRICS', false),
  },

  env: {
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    nodeEnv,
  },
};

/**
 * Validate required configuration in production
 *
 * @throws Error if required configuration is missing in production
 */
export function validateConfig(): void {
  if (!appConfig.env.isProduction) {
    // Only validate in production
    return;
  }

  const errors: string[] = [];

  // Validate API URL
  if (!appConfig.api.baseUrl || appConfig.api.baseUrl.includes('localhost')) {
    errors.push('NEXT_PUBLIC_API_URL must be set to a production URL');
  }

  // Validate App URL
  if (!appConfig.app.baseUrl || appConfig.app.baseUrl.includes('localhost')) {
    errors.push('NEXT_PUBLIC_APP_URL must be set to a production URL');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

// Auto-validate configuration on import in production
// Skip validation during build time (when running 'next build')
if (appConfig.env.isProduction && typeof window !== 'undefined') {
  validateConfig();
}
