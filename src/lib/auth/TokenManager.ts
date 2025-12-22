/**
 * Token Manager
 *
 * Centralized token management with localStorage fallback and multi-tab synchronization.
 * Provides in-memory storage when localStorage is unavailable (private browsing mode).
 *
 * Features:
 * - In-memory fallback when localStorage is blocked
 * - Multi-tab synchronization via BroadcastChannel
 * - Token expiry checking
 * - Graceful degradation
 *
 * @module lib/auth/TokenManager
 */

import { appConfig } from '@/config/app.config';
import { logger } from '@/lib/logger';

/**
 * Token data stored in TokenManager
 */
interface TokenData {
  value: string;
  expiresAt?: number; // Unix timestamp in seconds
}

/**
 * Message types for BroadcastChannel communication
 */
type TokenMessage =
  | { type: 'set'; key: string; value: string; expiresAt?: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

/**
 * TokenManager class for centralized token storage
 *
 * Singleton pattern ensures consistent token state across the application.
 * Automatically syncs tokens across browser tabs using BroadcastChannel API.
 */
export class TokenManager {
  private static instance: TokenManager | null = null;
  private storage: Map<string, TokenData> = new Map();
  private isLocalStorageAvailable: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private readonly CHANNEL_NAME = 'catchup_feed_token_sync';

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Check localStorage availability
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();

    // Initialize BroadcastChannel for multi-tab sync (if available)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
        this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);
        logger.debug('BroadcastChannel initialized for token sync');
      } catch (error) {
        logger.warn('Failed to initialize BroadcastChannel', { error });
        this.broadcastChannel = null;
      }
    }

    // Load existing tokens from localStorage if available
    if (this.isLocalStorageAvailable) {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Get singleton instance of TokenManager
   */
  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Check if localStorage is available and writable
   */
  private checkLocalStorageAvailability(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__catchup_feed_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('localStorage is not available, using in-memory storage', { error });
      return false;
    }
  }

  /**
   * Load tokens from localStorage to in-memory storage
   */
  private loadFromLocalStorage(): void {
    try {
      // Load access token
      const accessToken = localStorage.getItem(appConfig.auth.accessTokenKey);
      if (accessToken) {
        const expiresAt = this.extractTokenExpiry(accessToken);
        this.storage.set(appConfig.auth.accessTokenKey, {
          value: accessToken,
          expiresAt,
        });
      }

      // Load refresh token
      const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey);
      if (refreshToken) {
        const expiresAt = this.extractTokenExpiry(refreshToken);
        this.storage.set(appConfig.auth.refreshTokenKey, {
          value: refreshToken,
          expiresAt,
        });
      }
    } catch (error) {
      logger.error('Failed to load tokens from localStorage', error as Error);
    }
  }

  /**
   * Handle BroadcastChannel messages from other tabs
   */
  private handleBroadcastMessage(event: MessageEvent<TokenMessage>): void {
    try {
      const message = event.data;

      switch (message.type) {
        case 'set':
          this.storage.set(message.key, {
            value: message.value,
            expiresAt: message.expiresAt,
          });
          logger.debug('Token updated from other tab', { key: message.key });
          break;

        case 'remove':
          this.storage.delete(message.key);
          logger.debug('Token removed from other tab', { key: message.key });
          break;

        case 'clear':
          this.storage.clear();
          logger.debug('All tokens cleared from other tab');
          break;
      }
    } catch (error) {
      logger.error('Failed to handle broadcast message', error as Error, {
        message: event.data,
      });
    }
  }

  /**
   * Broadcast token change to other tabs
   */
  private broadcast(message: TokenMessage): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (error) {
        logger.warn('Failed to broadcast token change', { error });
      }
    }
  }

  /**
   * Extract expiry timestamp from JWT token
   * @param token - JWT token string
   * @returns Unix timestamp in seconds, or undefined if not available
   */
  private extractTokenExpiry(token: string): number | undefined {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return undefined;
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      return payload.exp ? Number(payload.exp) : undefined;
    } catch (error) {
      logger.warn('Failed to extract token expiry', { error });
      return undefined;
    }
  }

  /**
   * Get token from storage
   * @param key - Storage key
   * @returns Token string or null if not found
   */
  public get(key: string): string | null {
    const tokenData = this.storage.get(key);
    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    if (tokenData.expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= tokenData.expiresAt) {
        // Token is expired, remove it
        this.remove(key);
        return null;
      }
    }

    return tokenData.value;
  }

  /**
   * Set token in storage
   * @param key - Storage key
   * @param value - Token string
   */
  public set(key: string, value: string): void {
    try {
      const expiresAt = this.extractTokenExpiry(value);
      const tokenData: TokenData = { value, expiresAt };

      // Store in memory
      this.storage.set(key, tokenData);

      // Store in localStorage if available
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, value);
      }

      // Broadcast to other tabs
      this.broadcast({ type: 'set', key, value, expiresAt });

      logger.debug('Token stored', { key, hasExpiry: !!expiresAt });
    } catch (error) {
      logger.error('Failed to set token', error as Error, { key });
      throw new Error(`Failed to store token: ${key}`);
    }
  }

  /**
   * Remove token from storage
   * @param key - Storage key
   */
  public remove(key: string): void {
    try {
      // Remove from memory
      this.storage.delete(key);

      // Remove from localStorage if available
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      }

      // Broadcast to other tabs
      this.broadcast({ type: 'remove', key });

      logger.debug('Token removed', { key });
    } catch (error) {
      logger.error('Failed to remove token', error as Error, { key });
    }
  }

  /**
   * Clear all tokens from storage
   */
  public clearAll(): void {
    try {
      // Clear memory
      this.storage.clear();

      // Clear localStorage if available
      if (this.isLocalStorageAvailable) {
        // Only clear our tokens, not other app data
        localStorage.removeItem(appConfig.auth.accessTokenKey);
        localStorage.removeItem(appConfig.auth.refreshTokenKey);
      }

      // Broadcast to other tabs
      this.broadcast({ type: 'clear' });

      logger.debug('All tokens cleared');
    } catch (error) {
      logger.error('Failed to clear all tokens', error as Error);
    }
  }

  /**
   * Get token expiry timestamp
   * @param key - Storage key
   * @returns Unix timestamp in seconds, or null if not available
   */
  public getTokenExpiry(key: string): number | null {
    const tokenData = this.storage.get(key);
    return tokenData?.expiresAt ?? null;
  }

  /**
   * Check if token is expiring soon
   * @param key - Storage key
   * @param threshold - Threshold in seconds (default from config)
   * @returns True if token expires within threshold
   */
  public isExpiringSoon(key: string, threshold?: number): boolean {
    const expiresAt = this.getTokenExpiry(key);
    if (!expiresAt) {
      // No expiry info, assume it's not expiring soon
      return false;
    }

    const thresholdSeconds = threshold ?? appConfig.auth.tokenRefreshThreshold;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = expiresAt - now;

    return timeRemaining <= thresholdSeconds && timeRemaining > 0;
  }

  /**
   * Check if token is expired
   * @param key - Storage key
   * @returns True if token is expired
   */
  public isExpired(key: string): boolean {
    const expiresAt = this.getTokenExpiry(key);
    if (!expiresAt) {
      // No expiry info, check if token exists
      return this.get(key) === null;
    }

    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt;
  }

  /**
   * Cleanup resources (call on unmount if needed)
   */
  public destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get singleton TokenManager instance
 */
export function getTokenManager(): TokenManager {
  return TokenManager.getInstance();
}

/**
 * Get authentication token
 * @returns Access token or null
 */
export function getAuthToken(): string | null {
  return getTokenManager().get(appConfig.auth.accessTokenKey);
}

/**
 * Set authentication token
 * @param token - Access token
 */
export function setAuthToken(token: string): void {
  getTokenManager().set(appConfig.auth.accessTokenKey, token);
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  getTokenManager().remove(appConfig.auth.accessTokenKey);
}

/**
 * Get refresh token
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  return getTokenManager().get(appConfig.auth.refreshTokenKey);
}

/**
 * Set refresh token
 * @param token - Refresh token
 */
export function setRefreshToken(token: string): void {
  getTokenManager().set(appConfig.auth.refreshTokenKey, token);
}

/**
 * Clear refresh token
 */
export function clearRefreshToken(): void {
  getTokenManager().remove(appConfig.auth.refreshTokenKey);
}

/**
 * Clear all authentication tokens
 */
export function clearAllTokens(): void {
  getTokenManager().clearAll();
}

/**
 * Check if access token is expiring soon
 * @param threshold - Optional threshold in seconds
 * @returns True if token expires within threshold
 */
export function isTokenExpiringSoon(threshold?: number): boolean {
  return getTokenManager().isExpiringSoon(appConfig.auth.accessTokenKey, threshold);
}

/**
 * Check if access token is expired
 * @returns True if token is expired
 */
export function isTokenExpired(): boolean {
  return getTokenManager().isExpired(appConfig.auth.accessTokenKey);
}
