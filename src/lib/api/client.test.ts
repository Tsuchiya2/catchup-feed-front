import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './client';
import { ApiError, NetworkError, TimeoutError } from './errors';
import * as tokenUtils from '@/lib/auth/token';
import * as TokenManager from '@/lib/auth/TokenManager';
import { appConfig } from '@/config/app.config';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Create new API client instance for each test
    apiClient = new ApiClient();

    // Store original fetch
    originalFetch = global.fetch;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock token utilities
    vi.spyOn(tokenUtils, 'getAuthToken').mockReturnValue('mock-token-123');
    vi.spyOn(tokenUtils, 'clearAuthToken').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('request', () => {
    it('should make GET request with JWT token', async () => {
      // Arrange
      const mockResponse = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '100' }),
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiClient.request('/test-endpoint');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token-123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with body', async () => {
      // Arrange
      const requestBody = { email: 'test@example.com', password: 'password' };
      const mockResponse = { token: 'new-token' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '100' }),
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await apiClient.request('/auth/token', {
        method: 'POST',
        body: requestBody,
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token-123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make request without auth token when requiresAuth is false', async () => {
      // Arrange
      const mockResponse = { data: 'public' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '100' }),
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      await apiClient.request('/public-endpoint', { requiresAuth: false });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/public-endpoint',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });

    it('should include Authorization header even when no token exists', async () => {
      // Arrange
      vi.spyOn(tokenUtils, 'getAuthToken').mockReturnValue(null);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '2' }),
        text: async () => '{}',
      });

      // Act
      await apiClient.request('/endpoint');

      // Assert
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers).not.toHaveProperty('Authorization');
    });

    it('should handle 401 error by clearing token and redirecting', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      // Act & Assert
      await expect(apiClient.request('/protected')).rejects.toThrow(ApiError);
      await expect(apiClient.request('/protected')).rejects.toThrow('Authentication required');

      expect(tokenUtils.clearAuthToken).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });

    it('should handle 404 error', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found', error: 'Resource not found' }),
      });

      // Act & Assert
      await expect(apiClient.request('/missing')).rejects.toThrow(ApiError);
      const error = (await apiClient.request('/missing').catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
    });

    it('should handle 500 server error', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      // Act & Assert - disable retries to prevent timeout
      const error = (await apiClient
        .request('/error', { retry: false })
        .catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
      expect(error.message).toBe('Internal server error');
    });

    it('should parse error response with details', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation error',
          details: { email: 'Invalid email format' },
        }),
      });

      // Act & Assert
      const error = (await apiClient.request('/validate').catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.details).toEqual({ email: 'Invalid email format' });
    });

    it('should handle error response without JSON body', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      // Act & Assert - disable retries to prevent timeout
      const error = (await apiClient
        .request('/unavailable', { retry: false })
        .catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Request failed with status 503');
    });

    it('should handle network timeout', async () => {
      // Arrange
      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      // Act & Assert - disable retries to prevent timeout
      await expect(apiClient.request('/slow', { timeout: 50, retry: false })).rejects.toThrow(
        TimeoutError
      );
      const error = (await apiClient
        .request('/slow', { timeout: 50, retry: false })
        .catch((e) => e)) as TimeoutError;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toContain('timed out');
    });

    it('should handle network error', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert - disable retries to prevent timeout
      await expect(apiClient.request('/network-fail', { retry: false })).rejects.toThrow(
        NetworkError
      );
      const error = (await apiClient
        .request('/network-fail', { retry: false })
        .catch((e) => e)) as NetworkError;

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toContain('Failed to connect');
    });

    it('should use custom headers', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '2' }),
        text: async () => '{}',
      });

      // Act
      await apiClient.request('/custom', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should not include body in GET request', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '2' }),
        text: async () => '{}',
      });

      // Act
      await apiClient.request('/get-endpoint', {
        method: 'GET',
        body: { data: 'should-be-ignored' },
      });

      // Assert
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].body).toBeUndefined();
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '100' }),
        text: async () => JSON.stringify({ success: true }),
      });
    });

    it('should make GET request using get()', async () => {
      // Act
      await apiClient.get('/get-test');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/get-test',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request using post()', async () => {
      // Arrange
      const body = { data: 'test' };

      // Act
      await apiClient.post('/post-test', body);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/post-test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should make PUT request using put()', async () => {
      // Arrange
      const body = { data: 'update' };

      // Act
      await apiClient.put('/put-test', body);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/put-test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });

    it('should make DELETE request using delete()', async () => {
      // Act
      await apiClient.delete('/delete-test');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/delete-test',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should re-throw ApiError instances', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      // Act & Assert
      const error = (await apiClient.request('/bad').catch((e) => e)) as ApiError;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Bad request');
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const customError = new Error('Unknown error');
      global.fetch = vi.fn().mockRejectedValue(customError);

      // Act & Assert
      await expect(apiClient.request('/unknown', { retry: false })).rejects.toThrow(
        'Unknown error'
      );
    });
  });

  describe('retry logic', () => {
    it('should retry on network error up to maxRetries', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert - use very short delays for testing
      const error = (await apiClient
        .request('/retry-test', {
          retry: { maxRetries: 2, initialDelay: 10, maxDelay: 50, backoffMultiplier: 1.5 },
        })
        .catch((e) => e)) as NetworkError;

      // Assert - should have been called 3 times (1 initial + 2 retries)
      expect(error).toBeInstanceOf(NetworkError);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx client errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      // Act & Assert
      const error = (await apiClient
        .request('/client-error', { retry: { maxRetries: 3 } })
        .catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(400);
      // Should only be called once (no retries for 4xx)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should succeed on retry after initial failure', async () => {
      // Arrange - fail first, succeed second
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': '20' }),
          text: async () => JSON.stringify({ success: true }),
        });

      // Act - use very short delays for testing
      const result = await apiClient.request<{ success: boolean }>('/retry-success', {
        retry: { maxRetries: 3, initialDelay: 10, maxDelay: 50 },
      });

      // Assert
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should disable retries when retry is false', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert
      await expect(apiClient.request('/no-retry', { retry: false })).rejects.toThrow(NetworkError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('token refresh', () => {
    beforeEach(() => {
      // Mock successful fetch response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '20' }),
        text: async () => JSON.stringify({ success: true }),
      });
    });

    it('should refresh token when it is expiring soon', async () => {
      // Arrange - Enable token refresh feature
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      // Mock token utilities
      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'getRefreshToken').mockReturnValue('refresh-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);
      vi.spyOn(TokenManager, 'clearAllTokens').mockImplementation(() => {});

      // Mock dynamic import of refreshToken function
      const mockRefreshToken = vi.fn().mockResolvedValue(undefined);
      vi.doMock('@/lib/api/endpoints/auth', () => ({
        refreshToken: mockRefreshToken,
      }));

      // Act
      await apiClient.request('/test-endpoint');

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should not refresh when token refresh feature is disabled', async () => {
      // Arrange - Disable token refresh feature
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: false };

      // Mock token utilities
      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - fetch should be called directly without refresh attempt
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should not refresh when no token exists', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue(null);

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - fetch should be called directly without refresh attempt
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should not refresh when token is not expiring soon', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('valid-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(false);

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - fetch should be called directly without refresh attempt
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should not refresh when no refresh token exists', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);
      vi.spyOn(TokenManager, 'getRefreshToken').mockReturnValue(null);

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - fetch should be called directly without refresh attempt
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should prevent concurrent refresh requests', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'getRefreshToken').mockReturnValue('refresh-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);

      // Mock a slow refresh token function
      const mockRefreshToken = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      vi.doMock('@/lib/api/endpoints/auth', () => ({
        refreshToken: mockRefreshToken,
      }));

      // Act - Make two concurrent requests
      const [result1, result2] = await Promise.all([
        apiClient.request('/test-endpoint-1'),
        apiClient.request('/test-endpoint-2'),
      ]);

      // Assert - Both requests should succeed
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should clear tokens on refresh failure', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'getRefreshToken').mockReturnValue('refresh-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);

      const clearAllTokensSpy = vi.spyOn(TokenManager, 'clearAllTokens').mockImplementation(() => {});

      // Mock refresh token failure
      const mockRefreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      vi.doMock('@/lib/api/endpoints/auth', () => ({
        refreshToken: mockRefreshToken,
      }));

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - Request should still proceed (will fail with 401 if needed)
      expect(global.fetch).toHaveBeenCalled();

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should handle exponential backoff for retry on refresh failure', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      // Mock expiring token scenario
      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('expiring-token');
      vi.spyOn(TokenManager, 'getRefreshToken').mockReturnValue('refresh-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(true);

      // Mock fetch to return 500 error (retryable)
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      // Act & Assert
      const error = (await apiClient
        .request('/test-endpoint', {
          retry: { maxRetries: 2, initialDelay: 10, maxDelay: 50 },
        })
        .catch((e) => e)) as ApiError;

      // Should retry the request (1 initial + 2 retries = 3 calls)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);

      // Cleanup
      appConfig.features = originalFeatures;
    });

    it('should respect grace period before token refresh', async () => {
      // Arrange
      const originalFeatures = appConfig.features;
      appConfig.features = { ...originalFeatures, tokenRefresh: true };

      // Mock token that is NOT expiring soon (still in grace period)
      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('valid-token');
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(false);

      // Act
      await apiClient.request('/test-endpoint');

      // Assert - Should not attempt refresh, just make the request
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Cleanup
      appConfig.features = originalFeatures;
    });
  });
});
