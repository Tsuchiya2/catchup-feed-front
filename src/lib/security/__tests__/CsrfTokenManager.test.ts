/**
 * Unit Tests for CsrfTokenManager
 *
 * Tests the client-side CSRF token management implementation including:
 * - Singleton pattern
 * - Token extraction from response headers
 * - Token storage in sessionStorage
 * - Token retrieval
 * - Token clearing
 * - Header injection
 * - SSR safety (no window access issues)
 *
 * @module lib/security/__tests__/CsrfTokenManager.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CsrfTokenManager,
  getCsrfTokenManager,
  getCsrfToken,
  setCsrfTokenFromResponse,
  clearCsrfToken,
  addCsrfTokenToHeaders,
} from '../CsrfTokenManager';
import * as loggerModule from '@/lib/logger';

describe('CsrfTokenManager', () => {
  // Mock sessionStorage
  const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock logger to prevent console output during tests
    vi.spyOn(loggerModule.logger, 'debug').mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {});

    // Reset singleton instance
    // @ts-expect-error - Accessing private static member for testing
    CsrfTokenManager.instance = null;

    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = CsrfTokenManager.getInstance();
      const instance2 = CsrfTokenManager.getInstance();
      const instance3 = CsrfTokenManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should initialize with null token when sessionStorage is empty', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBeNull();
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('catchup_feed_csrf_token');
    });

    it('should load token from sessionStorage on initialization', () => {
      const existingToken = 'existing-csrf-token-123';
      mockSessionStorage.getItem.mockReturnValue(existingToken);

      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBe(existingToken);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('catchup_feed_csrf_token');
      expect(loggerModule.logger.debug).toHaveBeenCalledWith(
        'CSRF token loaded from sessionStorage'
      );
    });

    it('should handle sessionStorage errors gracefully during initialization', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('SessionStorage not available');
      });

      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBeNull();
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'Failed to load CSRF token from sessionStorage',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('Token Extraction from Response Headers', () => {
    it('should extract token from response header', () => {
      const token = 'csrf-token-from-response';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': token },
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      expect(manager.getToken()).toBe(token);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('catchup_feed_csrf_token', token);
      expect(loggerModule.logger.debug).toHaveBeenCalledWith('CSRF token extracted and stored', {
        hasToken: true,
      });
    });

    it('should handle response without CSRF token header', () => {
      const mockResponse = new Response(null, {
        headers: {},
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      expect(manager.getToken()).toBeNull();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive header name', () => {
      const token = 'csrf-token-lowercase';
      const mockResponse = new Response(null, {
        headers: { 'x-csrf-token': token },
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      // Headers API is case-insensitive, so this should work
      expect(manager.getToken()).toBe(token);
    });

    it('should update existing token with new one from response', () => {
      mockSessionStorage.getItem.mockReturnValue('old-token');
      const manager = CsrfTokenManager.getInstance();

      const newToken = 'new-csrf-token';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': newToken },
      });

      manager.extractToken(mockResponse);

      expect(manager.getToken()).toBe(newToken);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('catchup_feed_csrf_token', newToken);
    });

    it('should handle errors during token extraction', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('SessionStorage quota exceeded');
      });

      const token = 'csrf-token';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': token },
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      // Token should still be stored in memory even if sessionStorage fails
      expect(manager.getToken()).toBe(token);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'Failed to extract CSRF token from response',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('Token Storage in sessionStorage', () => {
    it('should store token in sessionStorage when extracted', () => {
      const token = 'test-csrf-token';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': token },
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('catchup_feed_csrf_token', token);
    });

    it('should not store token if window is undefined (SSR)', () => {
      // @ts-expect-error - Temporarily set window to undefined for SSR test
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const manager = CsrfTokenManager.getInstance();
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'test-token' },
      });

      manager.extractToken(mockResponse);

      // Restore window
      global.window = originalWindow;

      // sessionStorage should not be called in SSR environment
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle storage quota exceeded error', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const token = 'test-token';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': token },
      });

      const manager = CsrfTokenManager.getInstance();
      manager.extractToken(mockResponse);

      expect(loggerModule.logger.warn).toHaveBeenCalled();
    });
  });

  describe('Token Retrieval', () => {
    it('should return current token', () => {
      mockSessionStorage.getItem.mockReturnValue('stored-token');

      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBe('stored-token');
    });

    it('should return null when no token is set', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBeNull();
    });

    it('should return updated token after extraction', () => {
      const manager = CsrfTokenManager.getInstance();
      expect(manager.getToken()).toBeNull();

      const token = 'new-token';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': token },
      });

      manager.extractToken(mockResponse);
      expect(manager.getToken()).toBe(token);
    });
  });

  describe('Token Clearing', () => {
    it('should clear token from memory and sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('existing-token');
      const manager = CsrfTokenManager.getInstance();

      manager.clearToken();

      expect(manager.getToken()).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('catchup_feed_csrf_token');
      expect(loggerModule.logger.debug).toHaveBeenCalledWith('CSRF token cleared');
    });

    it('should handle clearing when no token exists', () => {
      const manager = CsrfTokenManager.getInstance();
      manager.clearToken();

      expect(manager.getToken()).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('catchup_feed_csrf_token');
    });

    it('should handle errors during token clearing', () => {
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('SessionStorage not available');
      });

      const manager = CsrfTokenManager.getInstance();
      manager.clearToken();

      expect(manager.getToken()).toBeNull();
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'Failed to clear CSRF token',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should not call sessionStorage in SSR environment', () => {
      // @ts-expect-error - Temporarily set window to undefined for SSR test
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const manager = CsrfTokenManager.getInstance();
      manager.clearToken();

      // Restore window
      global.window = originalWindow;

      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Header Injection', () => {
    it('should add CSRF token to headers when token exists', () => {
      mockSessionStorage.getItem.mockReturnValue('test-token');
      const manager = CsrfTokenManager.getInstance();

      const headers = {
        'Content-Type': 'application/json',
      };

      const result = manager.addTokenToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'test-token',
      });
    });

    it('should not modify headers when token does not exist', () => {
      // Reset instance to ensure no token from previous test
      // @ts-expect-error - Accessing private static member for testing
      CsrfTokenManager.instance = null;
      mockSessionStorage.getItem.mockReturnValue(null);

      const manager = CsrfTokenManager.getInstance();

      const headers = {
        'Content-Type': 'application/json',
      };

      const result = manager.addTokenToHeaders(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should not mutate original headers object', () => {
      mockSessionStorage.getItem.mockReturnValue('test-token');
      const manager = CsrfTokenManager.getInstance();

      const headers = {
        'Content-Type': 'application/json',
      };

      const result = manager.addTokenToHeaders(headers);

      expect(result).not.toBe(headers);
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should override existing X-CSRF-Token header', () => {
      mockSessionStorage.getItem.mockReturnValue('new-token');
      const manager = CsrfTokenManager.getInstance();

      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'old-token',
      };

      const result = manager.addTokenToHeaders(headers);

      expect(result['X-CSRF-Token']).toBe('new-token');
    });

    it('should handle empty headers object', () => {
      mockSessionStorage.getItem.mockReturnValue('test-token');
      const manager = CsrfTokenManager.getInstance();

      const result = manager.addTokenToHeaders({});

      expect(result).toEqual({
        'X-CSRF-Token': 'test-token',
      });
    });
  });

  describe('SSR Safety', () => {
    it('should not throw error when window is undefined', () => {
      // @ts-expect-error - Temporarily set window to undefined for SSR test
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => {
        const manager = CsrfTokenManager.getInstance();
        manager.getToken();
        manager.clearToken();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it('should work in SSR environment without sessionStorage', () => {
      // @ts-expect-error - Temporarily set window to undefined for SSR test
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const manager = CsrfTokenManager.getInstance();

      // Should be able to extract token (in memory only)
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'ssr-token' },
      });

      manager.extractToken(mockResponse);
      expect(manager.getToken()).toBe('ssr-token');

      // Restore window
      global.window = originalWindow;
    });

    it('should maintain singleton pattern in SSR environment', () => {
      // @ts-expect-error - Temporarily set window to undefined for SSR test
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const instance1 = CsrfTokenManager.getInstance();
      const instance2 = CsrfTokenManager.getInstance();

      expect(instance1).toBe(instance2);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Utility Functions', () => {
    describe('getCsrfTokenManager', () => {
      it('should return singleton instance', () => {
        const manager1 = getCsrfTokenManager();
        const manager2 = getCsrfTokenManager();

        expect(manager1).toBe(manager2);
        expect(manager1).toBeInstanceOf(CsrfTokenManager);
      });
    });

    describe('getCsrfToken', () => {
      it('should return current token', () => {
        mockSessionStorage.getItem.mockReturnValue('utility-token');
        const token = getCsrfToken();

        expect(token).toBe('utility-token');
      });

      it('should return null when no token exists', () => {
        mockSessionStorage.getItem.mockReturnValue(null);
        const token = getCsrfToken();

        expect(token).toBeNull();
      });
    });

    describe('setCsrfTokenFromResponse', () => {
      it('should extract and store token from response', () => {
        const token = 'utility-csrf-token';
        const mockResponse = new Response(null, {
          headers: { 'X-CSRF-Token': token },
        });

        setCsrfTokenFromResponse(mockResponse);

        expect(getCsrfToken()).toBe(token);
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('catchup_feed_csrf_token', token);
      });

      it('should handle response without token', () => {
        const mockResponse = new Response(null, {
          headers: {},
        });

        setCsrfTokenFromResponse(mockResponse);

        expect(getCsrfToken()).toBeNull();
      });
    });

    describe('clearCsrfToken', () => {
      it('should clear token using utility function', () => {
        mockSessionStorage.getItem.mockReturnValue('token-to-clear');
        const manager = getCsrfTokenManager();

        clearCsrfToken();

        expect(manager.getToken()).toBeNull();
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('catchup_feed_csrf_token');
      });
    });

    describe('addCsrfTokenToHeaders', () => {
      it('should add token to headers using utility function', () => {
        mockSessionStorage.getItem.mockReturnValue('utility-header-token');

        const headers = {
          'Content-Type': 'application/json',
        };

        const result = addCsrfTokenToHeaders(headers);

        expect(result).toEqual({
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'utility-header-token',
        });
      });

      it('should not modify headers when no token exists', () => {
        mockSessionStorage.getItem.mockReturnValue(null);

        const headers = {
          'Content-Type': 'application/json',
        };

        const result = addCsrfTokenToHeaders(headers);

        expect(result).toEqual({
          'Content-Type': 'application/json',
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete token lifecycle', () => {
      const manager = CsrfTokenManager.getInstance();

      // 1. Initial state - no token
      expect(manager.getToken()).toBeNull();

      // 2. Extract token from login response
      const loginResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'login-token-123' },
      });
      manager.extractToken(loginResponse);
      expect(manager.getToken()).toBe('login-token-123');

      // 3. Add token to subsequent request
      const requestHeaders = manager.addTokenToHeaders({
        'Content-Type': 'application/json',
      });
      expect(requestHeaders['X-CSRF-Token']).toBe('login-token-123');

      // 4. Token rotated by server
      const newTokenResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'rotated-token-456' },
      });
      manager.extractToken(newTokenResponse);
      expect(manager.getToken()).toBe('rotated-token-456');

      // 5. Logout - clear token
      manager.clearToken();
      expect(manager.getToken()).toBeNull();
    });

    it('should maintain token across multiple manager instances', () => {
      const manager1 = getCsrfTokenManager();
      const manager2 = getCsrfTokenManager();

      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'shared-token' },
      });

      manager1.extractToken(mockResponse);

      expect(manager1.getToken()).toBe('shared-token');
      expect(manager2.getToken()).toBe('shared-token');

      manager2.clearToken();

      expect(manager1.getToken()).toBeNull();
      expect(manager2.getToken()).toBeNull();
    });

    it('should work correctly with utility functions', () => {
      // Set token
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': 'integration-token' },
      });
      setCsrfTokenFromResponse(mockResponse);

      // Get token
      expect(getCsrfToken()).toBe('integration-token');

      // Add to headers
      const headers = addCsrfTokenToHeaders({
        Accept: 'application/json',
      });
      expect(headers['X-CSRF-Token']).toBe('integration-token');

      // Clear token
      clearCsrfToken();
      expect(getCsrfToken()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple consecutive token extractions', () => {
      const manager = CsrfTokenManager.getInstance();

      const response1 = new Response(null, { headers: { 'X-CSRF-Token': 'token1' } });
      const response2 = new Response(null, { headers: { 'X-CSRF-Token': 'token2' } });
      const response3 = new Response(null, { headers: { 'X-CSRF-Token': 'token3' } });

      manager.extractToken(response1);
      expect(manager.getToken()).toBe('token1');

      manager.extractToken(response2);
      expect(manager.getToken()).toBe('token2');

      manager.extractToken(response3);
      expect(manager.getToken()).toBe('token3');
    });

    it('should handle empty string token', () => {
      const manager = CsrfTokenManager.getInstance();
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': '' },
      });

      manager.extractToken(mockResponse);

      // Empty string is falsy, so token should not be set
      expect(manager.getToken()).toBeNull();
    });

    it('should handle whitespace-only token', () => {
      const manager = CsrfTokenManager.getInstance();
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': '   ' },
      });

      manager.extractToken(mockResponse);

      // In the actual implementation, Response.headers.get() may trim whitespace
      // or the token may not be set if it's empty/whitespace only
      // This test verifies the behavior matches implementation
      const token = manager.getToken();
      expect(token === '   ' || token === null).toBe(true);
    });

    it('should handle very long token strings', () => {
      const manager = CsrfTokenManager.getInstance();
      const longToken = 'a'.repeat(10000);
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': longToken },
      });

      manager.extractToken(mockResponse);

      expect(manager.getToken()).toBe(longToken);
      expect(manager.getToken()?.length).toBe(10000);
    });

    it('should handle special characters in token', () => {
      const manager = CsrfTokenManager.getInstance();
      const specialToken = 'token-with-special-chars!@#$%^&*(){}[]|\\:;"<>?,./';
      const mockResponse = new Response(null, {
        headers: { 'X-CSRF-Token': specialToken },
      });

      manager.extractToken(mockResponse);

      expect(manager.getToken()).toBe(specialToken);
    });

    it('should handle Unicode characters in token', () => {
      const manager = CsrfTokenManager.getInstance();

      // Note: HTTP headers must be ASCII (ISO-8859-1) compatible
      // Unicode characters in headers would cause errors in real scenarios
      // This test documents that limitation
      const unicodeToken = 'token-with-日本語-and-émojis-🚀';

      // Creating a Response with Unicode characters in headers will throw
      // This is expected behavior as HTTP headers don't support Unicode
      expect(() => {
        new Response(null, {
          headers: { 'X-CSRF-Token': unicodeToken },
        });
      }).toThrow();

      // In practice, CSRF tokens should be base64 or hex encoded
      // which are ASCII-safe
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent token operations', () => {
      const manager = getCsrfTokenManager();

      const response1 = new Response(null, { headers: { 'X-CSRF-Token': 'concurrent-1' } });
      const response2 = new Response(null, { headers: { 'X-CSRF-Token': 'concurrent-2' } });

      // Simulate concurrent operations
      manager.extractToken(response1);
      const token1 = manager.getToken();
      manager.extractToken(response2);
      const token2 = manager.getToken();

      // Last operation wins
      expect(token2).toBe('concurrent-2');
      expect(token1).toBe('concurrent-1');
    });

    it('should handle concurrent clear operations', () => {
      mockSessionStorage.getItem.mockReturnValue('token');
      const manager = getCsrfTokenManager();

      manager.clearToken();
      manager.clearToken();
      manager.clearToken();

      expect(manager.getToken()).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });
});
