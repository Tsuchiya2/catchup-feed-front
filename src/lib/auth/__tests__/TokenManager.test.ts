/**
 * Token Manager Tests
 *
 * Comprehensive tests for TokenManager including:
 * - get/set/remove operations
 * - localStorage fallback to memory
 * - multi-tab synchronization
 * - token expiry checking
 * - error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TokenManager,
  getTokenManager,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  clearAllTokens,
  isTokenExpiringSoon,
  isTokenExpired,
} from '../TokenManager';
import { appConfig } from '@/config/app.config';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let localStorageMock: Record<string, string>;
  let broadcastChannelMock: {
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: ((event: MessageEvent) => void) | null;
  };

  beforeEach(() => {
    // Reset TokenManager instance
    (TokenManager as any).instance = null;

    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    // Mock BroadcastChannel
    broadcastChannelMock = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    };

    global.BroadcastChannel = vi.fn(() => broadcastChannelMock) as any;

    // Create new instance for each test
    tokenManager = TokenManager.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TokenManager.getInstance();
      const instance2 = TokenManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return instance from getTokenManager', () => {
      const instance = getTokenManager();
      expect(instance).toBeInstanceOf(TokenManager);
      expect(instance).toBe(TokenManager.getInstance());
    });
  });

  describe('get/set/remove operations', () => {
    it('should store and retrieve a token', () => {
      const token = 'test-token-123';
      tokenManager.set('test-key', token);
      expect(tokenManager.get('test-key')).toBe(token);
    });

    it('should return null for non-existent token', () => {
      expect(tokenManager.get('non-existent')).toBeNull();
    });

    it('should remove a token', () => {
      tokenManager.set('test-key', 'test-token');
      tokenManager.remove('test-key');
      expect(tokenManager.get('test-key')).toBeNull();
    });

    it('should clear all tokens', () => {
      tokenManager.set(appConfig.auth.accessTokenKey, 'access-token');
      tokenManager.set(appConfig.auth.refreshTokenKey, 'refresh-token');
      tokenManager.clearAll();
      expect(tokenManager.get(appConfig.auth.accessTokenKey)).toBeNull();
      expect(tokenManager.get(appConfig.auth.refreshTokenKey)).toBeNull();
    });

    it('should store token in localStorage when available', () => {
      const token = 'test-token-123';
      tokenManager.set('test-key', token);
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', token);
    });

    it('should remove token from localStorage when available', () => {
      tokenManager.set('test-key', 'test-token');
      tokenManager.remove('test-key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('localStorage fallback to memory', () => {
    beforeEach(() => {
      // Mock localStorage to throw error (simulating private browsing)
      global.localStorage = {
        getItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        setItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        removeItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      };

      // Reset instance to reinitialize with failing localStorage
      (TokenManager as any).instance = null;
      tokenManager = TokenManager.getInstance();
    });

    it('should fallback to memory storage when localStorage is unavailable', () => {
      const token = 'test-token-123';
      tokenManager.set('test-key', token);
      expect(tokenManager.get('test-key')).toBe(token);
    });

    it('should still work without localStorage', () => {
      tokenManager.set('test-key', 'token1');
      tokenManager.set('test-key2', 'token2');
      expect(tokenManager.get('test-key')).toBe('token1');
      expect(tokenManager.get('test-key2')).toBe('token2');
      tokenManager.remove('test-key');
      expect(tokenManager.get('test-key')).toBeNull();
    });
  });

  describe('multi-tab synchronization', () => {
    it('should broadcast set operation to other tabs', () => {
      const token = 'test-token-123';
      tokenManager.set('test-key', token);
      expect(broadcastChannelMock.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set',
          key: 'test-key',
          value: token,
        })
      );
    });

    it('should broadcast remove operation to other tabs', () => {
      tokenManager.remove('test-key');
      expect(broadcastChannelMock.postMessage).toHaveBeenCalledWith({
        type: 'remove',
        key: 'test-key',
      });
    });

    it('should broadcast clear operation to other tabs', () => {
      tokenManager.clearAll();
      expect(broadcastChannelMock.postMessage).toHaveBeenCalledWith({
        type: 'clear',
      });
    });

    it('should handle incoming set message from other tabs', () => {
      const message = {
        type: 'set' as const,
        key: 'test-key',
        value: 'test-token',
        expiresAt: undefined,
      };

      // Simulate message from another tab
      if (broadcastChannelMock.onmessage) {
        broadcastChannelMock.onmessage(new MessageEvent('message', { data: message }));
      }

      expect(tokenManager.get('test-key')).toBe('test-token');
    });

    it('should handle incoming remove message from other tabs', () => {
      tokenManager.set('test-key', 'test-token');
      const message = { type: 'remove' as const, key: 'test-key' };

      if (broadcastChannelMock.onmessage) {
        broadcastChannelMock.onmessage(new MessageEvent('message', { data: message }));
      }

      expect(tokenManager.get('test-key')).toBeNull();
    });

    it('should handle incoming clear message from other tabs', () => {
      tokenManager.set('test-key', 'test-token');
      const message = { type: 'clear' as const };

      if (broadcastChannelMock.onmessage) {
        broadcastChannelMock.onmessage(new MessageEvent('message', { data: message }));
      }

      expect(tokenManager.get('test-key')).toBeNull();
    });
  });

  describe('token expiry checking', () => {
    it('should extract expiry from valid JWT token', () => {
      // Create a mock JWT with exp claim (expires in 1 hour)
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      const expiry = tokenManager.getTokenExpiry('test-key');
      expect(expiry).toBe(payload.exp);
    });

    it('should return null for token without expiry', () => {
      const payload = { sub: 'user-123' }; // No exp claim
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      const expiry = tokenManager.getTokenExpiry('test-key');
      expect(expiry).toBeNull();
    });

    it('should detect expired token', () => {
      // Create a token that expired 1 hour ago
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.isExpired('test-key')).toBe(true);
    });

    it('should detect non-expired token', () => {
      // Create a token that expires in 1 hour
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.isExpired('test-key')).toBe(false);
    });

    it('should detect token expiring soon', () => {
      // Create a token that expires in 2 minutes (less than default threshold)
      const payload = { exp: Math.floor(Date.now() / 1000) + 120 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.isExpiringSoon('test-key')).toBe(true);
    });

    it('should not detect token expiring soon when far from expiry', () => {
      // Create a token that expires in 1 hour
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.isExpiringSoon('test-key')).toBe(false);
    });

    it('should use custom threshold for expiring soon check', () => {
      // Create a token that expires in 10 minutes
      const payload = { exp: Math.floor(Date.now() / 1000) + 600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.isExpiringSoon('test-key', 1200)).toBe(true); // 20 min threshold
      expect(tokenManager.isExpiringSoon('test-key', 300)).toBe(false); // 5 min threshold
    });

    it('should automatically remove expired token on get', () => {
      // Create an expired token
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockToken = `header.${base64Payload}.signature`;

      tokenManager.set('test-key', mockToken);
      expect(tokenManager.get('test-key')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle invalid JWT format gracefully', () => {
      const invalidToken = 'not-a-valid-jwt';
      tokenManager.set('test-key', invalidToken);
      const expiry = tokenManager.getTokenExpiry('test-key');
      expect(expiry).toBeNull();
    });

    it('should handle malformed JWT payload', () => {
      const mockToken = 'header.invalid-base64.signature';
      tokenManager.set('test-key', mockToken);
      const expiry = tokenManager.getTokenExpiry('test-key');
      expect(expiry).toBeNull();
    });

    it('should throw error when set fails', () => {
      // Mock set to fail
      const spy = vi.spyOn(Map.prototype, 'set').mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => tokenManager.set('test-key', 'token')).toThrow('Failed to store token');
      spy.mockRestore();
    });

    it('should handle BroadcastChannel initialization failure', () => {
      // Mock BroadcastChannel to throw error
      global.BroadcastChannel = vi.fn(() => {
        throw new Error('BroadcastChannel not supported');
      }) as any;

      // Reset instance
      (TokenManager as any).instance = null;
      const manager = TokenManager.getInstance();

      // Should still work without BroadcastChannel
      manager.set('test-key', 'test-token');
      expect(manager.get('test-key')).toBe('test-token');
    });
  });

  describe('utility functions', () => {
    it('getAuthToken should retrieve access token', () => {
      const token = 'access-token-123';
      setAuthToken(token);
      expect(getAuthToken()).toBe(token);
    });

    it('setAuthToken should store access token', () => {
      const token = 'access-token-123';
      setAuthToken(token);
      expect(getAuthToken()).toBe(token);
    });

    it('clearAuthToken should remove access token', () => {
      setAuthToken('access-token-123');
      clearAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it('getRefreshToken should retrieve refresh token', () => {
      const token = 'refresh-token-123';
      setRefreshToken(token);
      expect(getRefreshToken()).toBe(token);
    });

    it('setRefreshToken should store refresh token', () => {
      const token = 'refresh-token-123';
      setRefreshToken(token);
      expect(getRefreshToken()).toBe(token);
    });

    it('clearRefreshToken should remove refresh token', () => {
      setRefreshToken('refresh-token-123');
      clearRefreshToken();
      expect(getRefreshToken()).toBeNull();
    });

    it('clearAllTokens should remove both tokens', () => {
      setAuthToken('access-token');
      setRefreshToken('refresh-token');
      clearAllTokens();
      expect(getAuthToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('isTokenExpired should check access token expiry', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const expiredToken = `header.${base64Payload}.signature`;

      setAuthToken(expiredToken);
      expect(isTokenExpired()).toBe(true);
    });

    it('isTokenExpiringSoon should check access token', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 120 };
      const base64Payload = btoa(JSON.stringify(payload));
      const expiringToken = `header.${base64Payload}.signature`;

      setAuthToken(expiringToken);
      expect(isTokenExpiringSoon()).toBe(true);
    });

    it('isTokenExpiringSoon should accept custom threshold', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 600 };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      setAuthToken(token);
      expect(isTokenExpiringSoon(1200)).toBe(true);
      expect(isTokenExpiringSoon(300)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should close BroadcastChannel on destroy', () => {
      tokenManager.destroy();
      expect(broadcastChannelMock.close).toHaveBeenCalled();
    });

    it('should handle destroy when BroadcastChannel is null', () => {
      // Mock BroadcastChannel to fail initialization
      global.BroadcastChannel = vi.fn(() => {
        throw new Error('Not supported');
      }) as any;

      (TokenManager as any).instance = null;
      const manager = TokenManager.getInstance();

      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('load from localStorage', () => {
    it('should load existing tokens from localStorage on init', () => {
      // Set tokens in localStorage mock
      const accessToken = 'existing-access-token';
      const refreshToken = 'existing-refresh-token';
      localStorageMock[appConfig.auth.accessTokenKey] = accessToken;
      localStorageMock[appConfig.auth.refreshTokenKey] = refreshToken;

      // Reset instance to trigger reload
      (TokenManager as any).instance = null;
      const manager = TokenManager.getInstance();

      expect(manager.get(appConfig.auth.accessTokenKey)).toBe(accessToken);
      expect(manager.get(appConfig.auth.refreshTokenKey)).toBe(refreshToken);
    });

    it('should handle errors when loading from localStorage', () => {
      // Mock getItem to throw error
      global.localStorage.getItem = vi.fn(() => {
        throw new Error('Cannot read localStorage');
      });

      // Should not throw error during initialization
      (TokenManager as any).instance = null;
      expect(() => TokenManager.getInstance()).not.toThrow();
    });
  });
});
