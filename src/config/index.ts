/**
 * Configuration Module Exports
 *
 * Centralized configuration for the entire application.
 * Import configurations using: import { appConfig, loggingConfig, securityConfig } from '@/config'
 *
 * @module config
 */

// Application Configuration
export {
  appConfig,
  validateConfig,
  type AppConfig,
  type AppIdentity,
  type ApiConfig,
  type AuthConfig,
  type FeatureFlags,
  type ObservabilityConfig,
  type EnvironmentConfig,
} from './app.config';

// Logging Configuration
export {
  loggingConfig,
  logLevels,
  shouldLogLevel,
  shouldSample,
  type LogLevel,
  type LogFormat,
  type LoggingConfig,
} from './logging.config';

// Security Configuration
export {
  securityConfig,
  getSecurityHeaders,
  type SecurityConfig,
  type SecurityHeader,
  type CSPDirectives,
} from './security.config';
