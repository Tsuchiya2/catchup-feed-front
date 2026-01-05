/**
 * Source Configuration
 *
 * Configuration constants for RSS/Feed source management.
 * Defines validation rules, timeouts, and feature flags for source operations.
 *
 * @module config/source
 */

/**
 * Source Configuration Constants
 *
 * Immutable configuration object for source-related operations.
 * All values are compile-time constants with strict type checking.
 */
export const SOURCE_CONFIG = {
  /**
   * Maximum length for source name field (characters)
   * Enforced at both client and server validation layers
   */
  NAME_MAX_LENGTH: 255,

  /**
   * Maximum length for source URL field (characters)
   * Based on RFC 2616 recommended maximum URL length
   */
  URL_MAX_LENGTH: 2048,

  /**
   * Debounce delay for validation operations (milliseconds)
   * Prevents excessive validation calls during user input
   */
  VALIDATION_DEBOUNCE_MS: 300,

  /**
   * Timeout for source update operations (milliseconds)
   * Maximum time allowed for source CRUD operations
   */
  UPDATE_TIMEOUT_MS: 10000,

  /**
   * Enable optimistic UI updates for source operations
   * When true, UI updates immediately before server confirmation
   */
  OPTIMISTIC_UPDATES_ENABLED: true,
} as const;

/**
 * Type-safe access to source configuration
 * Ensures compile-time checking of configuration values
 */
export type SourceConfig = typeof SOURCE_CONFIG;
