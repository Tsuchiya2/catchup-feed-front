/**
 * Comprehensive tests for logger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, type LogContext } from '../logger';
import { loggingConfig, logLevels } from '@/config/logging.config';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalLevel: string;
  let originalFormat: string;
  let originalSampleRate: number;

  beforeEach(() => {
    // Save original config
    originalLevel = loggingConfig.level;
    originalFormat = loggingConfig.format;
    originalSampleRate = loggingConfig.sampleRate;

    // Setup spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set default config for tests
    loggingConfig.level = 'debug';
    loggingConfig.format = 'pretty';
    loggingConfig.sampleRate = 1.0;

    // Mock Math.random to return predictable values for sampling tests
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    // Restore original config
    loggingConfig.level = originalLevel as any;
    loggingConfig.format = originalFormat as any;
    loggingConfig.sampleRate = originalSampleRate;

    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should have all log methods defined', () => {
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should not throw when calling logger methods', () => {
      expect(() => logger.debug('Debug')).not.toThrow();
      expect(() => logger.info('Info')).not.toThrow();
      expect(() => logger.warn('Warn')).not.toThrow();
      expect(() => logger.error('Error')).not.toThrow();
    });

    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });
  });

  describe('log level filtering', () => {
    it('should filter debug logs when level is info', () => {
      loggingConfig.level = 'info';
      logger.debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should filter info logs when level is warn', () => {
      loggingConfig.level = 'warn';
      logger.info('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should filter warn logs when level is error', () => {
      loggingConfig.level = 'error';
      logger.warn('Should not appear');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should always log errors regardless of level', () => {
      loggingConfig.level = 'error';
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log all levels when level is debug', () => {
      loggingConfig.level = 'debug';

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('sampling', () => {
    it('should log when sample rate is 1.0', () => {
      loggingConfig.sampleRate = 1.0;
      logger.info('Should appear');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log when sample rate is 0.0', () => {
      loggingConfig.sampleRate = 0.0;
      logger.info('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should respect sample rate for debug logs', () => {
      loggingConfig.sampleRate = 0.3;
      vi.spyOn(Math, 'random').mockReturnValue(0.2); // Below threshold

      logger.debug('Should appear');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log when random exceeds sample rate', () => {
      loggingConfig.sampleRate = 0.3;
      vi.spyOn(Math, 'random').mockReturnValue(0.4); // Above threshold

      logger.debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should never sample error logs', () => {
      loggingConfig.sampleRate = 0.0;
      logger.error('Error should always appear');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('output format - pretty', () => {
    beforeEach(() => {
      loggingConfig.format = 'pretty';
    });

    it('should include emoji for debug logs', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔍'));
    });

    it('should include emoji for info logs', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
    });

    it('should include emoji for warn logs', () => {
      logger.warn('Warn message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    });

    it('should include emoji for error logs', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
    });

    it('should include uppercase level in output', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('should include context in output', () => {
      const context: LogContext = { userId: '123', action: 'login' };
      logger.info('User action', context);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('userId'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('123'));
    });

    it('should include error details in output', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });
  });

  describe('output format - JSON', () => {
    beforeEach(() => {
      loggingConfig.format = 'json';
    });

    it('should output valid JSON', () => {
      logger.info('Info message');
      const loggedValue = consoleLogSpy.mock.calls[0]?.[0];
      expect(loggedValue).toBeDefined();
      expect(() => JSON.parse(loggedValue as string)).not.toThrow();
    });

    it('should include level in JSON output', () => {
      logger.info('Info message');
      const loggedValue = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedValue as string);
      expect(parsed.level).toBe('info');
    });

    it('should include message in JSON output', () => {
      logger.info('Info message');
      const loggedValue = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedValue as string);
      expect(parsed.message).toBe('Info message');
    });

    it('should include timestamp in JSON output', () => {
      logger.info('Info message');
      const loggedValue = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedValue as string);
      expect(parsed.timestamp).toBeDefined();
      expect(new Date(parsed.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include context in JSON output', () => {
      const context: LogContext = { userId: '123', action: 'login' };
      logger.info('User action', context);
      const loggedValue = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedValue as string);
      expect(parsed.userId).toBe('123');
      expect(parsed.action).toBe('login');
    });

    it('should include error details in JSON output', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logger.error('Error occurred', error);
      const loggedValue = consoleErrorSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedValue as string);
      expect(parsed.error).toBeDefined();
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBe('Error stack trace');
    });
  });

  describe('context inclusion', () => {
    it('should log without context', () => {
      logger.info('Message without context');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include simple context', () => {
      logger.info('Message with context', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('key'));
    });

    it('should include nested context', () => {
      logger.info('Message with nested context', { user: { id: '123', name: 'John' } });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include array context', () => {
      logger.info('Message with array context', { items: ['a', 'b', 'c'] });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle null context values', () => {
      logger.info('Message with null value', { value: null });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle undefined context values', () => {
      logger.info('Message with undefined value', { value: undefined });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with context and Error object', () => {
      const error = new Error('Test error');
      const context: LogContext = { userId: '123' };
      logger.error('Error message', error, context);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;
      logger.error('Error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error message');
      logger.error('Error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('each log level', () => {
    it('should call console.log for debug', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should call console.log for info', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should call console.warn for warn', () => {
      logger.warn('Warn message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should call console.error for error', () => {
      logger.error('Error message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
