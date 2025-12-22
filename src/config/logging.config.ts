/**
 * Logging Configuration
 *
 * Centralized logging configuration for log level filtering,
 * output formatting, and sampling.
 *
 * @module config/logging
 */

/**
 * Log Levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log Output Format
 */
export type LogFormat = 'json' | 'pretty';

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  /** Current log level */
  level: LogLevel;
  /** Log output format */
  format: LogFormat;
  /** Sample rate (0.0 to 1.0) - 1.0 means log everything */
  sampleRate: number;
  /** Enable console output */
  enableConsole: boolean;
}

/**
 * Log level priority mapping
 * Higher number = higher priority
 */
export const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

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
 * Validate log level
 */
function validateLogLevel(level: string): LogLevel {
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (validLevels.includes(level as LogLevel)) {
    return level as LogLevel;
  }
  return 'info'; // Default fallback
}

/**
 * Validate log format
 */
function validateLogFormat(format: string): LogFormat {
  const validFormats: LogFormat[] = ['json', 'pretty'];
  if (validFormats.includes(format as LogFormat)) {
    return format as LogFormat;
  }
  return 'json'; // Default fallback
}

/**
 * Get log level based on environment
 */
function getLogLevel(): LogLevel {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const configuredLevel = getEnvVar('NEXT_PUBLIC_LOG_LEVEL', '');

  if (configuredLevel) {
    return validateLogLevel(configuredLevel);
  }

  // Environment-based defaults
  switch (nodeEnv) {
    case 'production':
      return 'warn';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
}

/**
 * Get log format based on environment
 */
function getLogFormat(): LogFormat {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const configuredFormat = getEnvVar('NEXT_PUBLIC_LOG_FORMAT', '');

  if (configuredFormat) {
    return validateLogFormat(configuredFormat);
  }

  // Environment-based defaults
  return nodeEnv === 'production' ? 'json' : 'pretty';
}

/**
 * Logging Configuration Object
 */
export const loggingConfig: LoggingConfig = {
  level: getLogLevel(),
  format: getLogFormat(),
  sampleRate: getEnvNumber('NEXT_PUBLIC_LOG_SAMPLE_RATE', 1.0),
  enableConsole: getEnvBool('NEXT_PUBLIC_LOG_ENABLE_CONSOLE', true),
};

/**
 * Check if a log level should be logged based on current configuration
 *
 * @param level - Log level to check
 * @returns True if the level should be logged
 */
export function shouldLogLevel(level: LogLevel): boolean {
  return logLevels[level] >= logLevels[loggingConfig.level];
}

/**
 * Check if a log should be sampled (randomly included)
 *
 * @returns True if the log should be included based on sample rate
 */
export function shouldSample(): boolean {
  if (loggingConfig.sampleRate >= 1.0) {
    return true;
  }
  if (loggingConfig.sampleRate <= 0) {
    return false;
  }
  return Math.random() < loggingConfig.sampleRate;
}
