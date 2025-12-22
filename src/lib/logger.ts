/**
 * Enhanced structured logging utility for development debugging and production observability
 *
 * Features:
 * - Log level filtering (DEBUG, INFO, WARN, ERROR)
 * - Environment-based output format (JSON in production, pretty in development)
 * - Sampling support for reducing log volume
 * - Structured context data
 * - Error object serialization
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('Verbose debugging info', { step: 1 });
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.error('Failed to fetch data', new Error('Network error'), { url: '/api/feeds' });
 */

import { loggingConfig, logLevels, type LogLevel } from '@/config/logging.config';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

/**
 * Check if a log should be output based on configured level
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = logLevels[loggingConfig.level];
  const messageLevel = logLevels[level];
  return messageLevel >= currentLevel;
}

/**
 * Apply sampling to reduce log volume
 */
function shouldSample(): boolean {
  return Math.random() < loggingConfig.sampleRate;
}

/**
 * Format log entry based on environment
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): string {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  // Production: Always JSON
  if (loggingConfig.format === 'json') {
    return JSON.stringify(entry);
  }

  // Development: Pretty format with emojis
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[level];

  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  const errorStr = error ? ` ${JSON.stringify({ error: error.message, stack: error.stack })}` : '';
  return `${emoji} [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`;
}

export const logger = {
  /**
   * Log a debug message (filtered by log level)
   * @param message - The log message
   * @param context - Optional additional context
   */
  debug: (message: string, context?: LogContext): void => {
    if (!shouldLog('debug') || !shouldSample()) return;
    console.log(formatLogEntry('debug', message, context));
  },

  /**
   * Log an informational message
   * @param message - The log message
   * @param context - Optional additional context
   */
  info: (message: string, context?: LogContext): void => {
    if (!shouldLog('info') || !shouldSample()) return;
    console.log(formatLogEntry('info', message, context));
  },

  /**
   * Log a warning message
   * @param message - The log message
   * @param context - Optional additional context
   */
  warn: (message: string, context?: LogContext): void => {
    if (!shouldLog('warn') || !shouldSample()) return;
    console.warn(formatLogEntry('warn', message, context));
  },

  /**
   * Log an error message with optional error object
   * Errors are never sampled to ensure all errors are captured
   * @param message - The log message
   * @param error - Optional Error object for stack trace
   * @param context - Optional additional context
   */
  error: (message: string, error?: Error, context?: LogContext): void => {
    if (!shouldLog('error')) return;
    // Note: Errors are never sampled to ensure all errors are captured
    console.error(formatLogEntry('error', message, context, error));
  },
};
