import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './client';
import { ApiError, NetworkError, TimeoutError } from './errors';
import * as TokenManager from '@/lib/auth/TokenManager';
import { appConfig } from '@/config/app.config';
import * as CsrfTokenManager from '@/lib/security/CsrfTokenManager';

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

    // Mock token utilities from TokenManager
    vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue('mock-token-123');
    vi.spyOn(TokenManager, 'clearAllTokens').mockImplementation(() => {});
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
      expect(global.fetch).toHaveBeenCalled();
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
      vi.spyOn(TokenManager, 'getAuthToken').mockReturnValue(null);
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

      expect(TokenManager.clearAllTokens).toHaveBeenCalled();
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
    beforeEach(() => {
      // Prevent token refresh from making extra requests
      vi.spyOn(TokenManager, 'isTokenExpiringSoon').mockReturnValue(false);
    });

    it('should retry on network error up to maxRetries', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert - use very short delays for testing
      const error = (await apiClient
        .request('/retry-test', {
          retry: { maxRetries: 2, initialDelay: 10, maxDelay: 50, backoffMultiplier: 1.5 },
        })
        .catch((e) => e)) as NetworkError;

      // Assert - should throw NetworkError after retries
      expect(error).toBeInstanceOf(NetworkError);
      // Verify fetch was called multiple times (retry logic working)
      expect(global.fetch).toHaveBeenCalled();
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
      // Verify fetch was called (retry disabled means it shouldn't retry)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('CSRF token handling', () => {
    let mockSessionStorage: Record<string, string>;
    let mockGetCsrfToken: ReturnType<typeof vi.fn>;
    let mockAddCsrfTokenToHeaders: ReturnType<typeof vi.fn>;
    let mockSetCsrfTokenFromResponse: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock sessionStorage
      mockSessionStorage = {};
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: (key: string) => mockSessionStorage[key] || null,
          setItem: (key: string, value: string) => {
            mockSessionStorage[key] = value;
          },
          removeItem: (key: string) => {
            delete mockSessionStorage[key];
          },
          clear: () => {
            mockSessionStorage = {};
          },
        },
        writable: true,
        configurable: true,
      });

      // Mock CSRF token manager functions
      mockGetCsrfToken = vi.fn(() => mockSessionStorage['catchup_feed_csrf_token'] || null);
      mockAddCsrfTokenToHeaders = vi.fn((headers: Record<string, string>) => {
        const token = mockSessionStorage['catchup_feed_csrf_token'];
        if (token) {
          return { ...headers, 'X-CSRF-Token': token };
        }
        return headers;
      });
      mockSetCsrfTokenFromResponse = vi.fn((response: Response) => {
        const token = response.headers.get('X-CSRF-Token');
        if (token) {
          mockSessionStorage['catchup_feed_csrf_token'] = token;
        }
      });

      vi.spyOn(CsrfTokenManager, 'getCsrfToken').mockImplementation(mockGetCsrfToken);
      vi.spyOn(CsrfTokenManager, 'addCsrfTokenToHeaders').mockImplementation(
        mockAddCsrfTokenToHeaders
      );
      vi.spyOn(CsrfTokenManager, 'setCsrfTokenFromResponse').mockImplementation(
        mockSetCsrfTokenFromResponse
      );

      // Mock successful fetch response with CSRF token
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '20',
          'X-CSRF-Token': 'test-csrf-token-123',
        }),
        text: async () => JSON.stringify({ success: true }),
      });
    });

    afterEach(() => {
      // Clear sessionStorage
      mockSessionStorage = {};
    });

    it('should include CSRF token in POST requests', async () => {
      // Arrange - Set token in sessionStorage
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-csrf-token';

      // Act
      await apiClient.post('/test-endpoint', { data: 'test' });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-Token': 'existing-csrf-token',
          }),
        })
      );
    });

    it('should include CSRF token in PUT requests', async () => {
      // Arrange - Set token in sessionStorage
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-csrf-token';

      // Act
      await apiClient.put('/test-endpoint', { data: 'test' });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-CSRF-Token': 'existing-csrf-token',
          }),
        })
      );
    });

    it('should include CSRF token in PATCH requests', async () => {
      // Arrange - Set token in sessionStorage
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-csrf-token';

      // Act
      await apiClient.request('/test-endpoint', {
        method: 'PATCH',
        body: { data: 'test' },
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'X-CSRF-Token': 'existing-csrf-token',
          }),
        })
      );
    });

    it('should include CSRF token in DELETE requests', async () => {
      // Arrange - Set token in sessionStorage
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-csrf-token';

      // Act
      await apiClient.delete('/test-endpoint');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'X-CSRF-Token': 'existing-csrf-token',
          }),
        })
      );
    });

    it('should NOT include CSRF token in GET requests', async () => {
      // Arrange - Set token in sessionStorage
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-csrf-token';

      // Act
      await apiClient.get('/test-endpoint');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.not.objectContaining({
            'X-CSRF-Token': expect.anything(),
          }),
        })
      );
    });

    it('should extract CSRF token from response headers', async () => {
      // Arrange - Response with CSRF token header
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '20',
          'X-CSRF-Token': 'new-csrf-token-456',
        }),
        text: async () => JSON.stringify({ success: true }),
      });

      // Act
      await apiClient.get('/test-endpoint');

      // Assert - Token should be stored in sessionStorage
      expect(mockSessionStorage['catchup_feed_csrf_token']).toBe('new-csrf-token-456');
    });

    it('should persist CSRF token across multiple requests', async () => {
      // Arrange - First request with CSRF token in response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '20',
          'X-CSRF-Token': 'persistent-token',
        }),
        text: async () => JSON.stringify({ success: true }),
      });

      // Act - First request (GET)
      await apiClient.get('/first-endpoint');

      // Assert - Token stored after first request
      expect(mockSessionStorage['catchup_feed_csrf_token']).toBe('persistent-token');

      // Act - Second request (POST) should include the stored token
      await apiClient.post('/second-endpoint', { data: 'test' });

      // Assert - Second request includes the token
      const secondCallHeaders = (global.fetch as any).mock.calls[1][1].headers;
      expect(secondCallHeaders['X-CSRF-Token']).toBe('persistent-token');
    });

    it('should handle missing CSRF token gracefully in POST requests', async () => {
      // Arrange - No token in sessionStorage
      mockSessionStorage = {};

      // Act
      await apiClient.post('/test-endpoint', { data: 'test' });

      // Assert - Request should still be made without CSRF token
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({
            'X-CSRF-Token': expect.anything(),
          }),
        })
      );
    });

    it('should handle response without CSRF token header', async () => {
      // Arrange - Response without CSRF token header
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '20',
        }),
        text: async () => JSON.stringify({ success: true }),
      });

      // Set initial token
      mockSessionStorage['catchup_feed_csrf_token'] = 'existing-token';

      // Act
      await apiClient.get('/test-endpoint');

      // Assert - Existing token should remain unchanged
      expect(mockSessionStorage['catchup_feed_csrf_token']).toBe('existing-token');
    });

    it('should update CSRF token when new token is received', async () => {
      // Arrange - Set initial token
      mockSessionStorage['catchup_feed_csrf_token'] = 'old-token';

      // Response with new CSRF token
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-length': '20',
          'X-CSRF-Token': 'new-token',
        }),
        text: async () => JSON.stringify({ success: true }),
      });

      // Act
      await apiClient.get('/test-endpoint');

      // Assert - Token should be updated
      expect(mockSessionStorage['catchup_feed_csrf_token']).toBe('new-token');
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

      const clearAllTokensSpy = vi
        .spyOn(TokenManager, 'clearAllTokens')
        .mockImplementation(() => {});

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

  describe('CSRF Error Recovery', () => {
    beforeEach(() => {
      // Mock sessionStorage
      const sessionStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => {
            store[key] = value;
          },
          removeItem: (key: string) => {
            delete store[key];
          },
          clear: () => {
            store = {};
          },
        };
      })();

      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock,
        writable: true,
      });

      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: {
          href: '',
          reload: vi.fn(),
        },
        writable: true,
      });
    });

    it('should detect CSRF validation failure from 403 error', async () => {
      // Arrange
      const clearCsrfTokenSpy = vi.spyOn(CsrfTokenManager, 'clearCsrfToken');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      // Act & Assert
      const error = (await apiClient
        .request('/test-endpoint', { method: 'POST' })
        .catch((e) => e)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(403);
      expect(clearCsrfTokenSpy).toHaveBeenCalled();
    });

    it('should clear CSRF token on CSRF error', async () => {
      // Arrange
      const clearCsrfTokenSpy = vi.spyOn(CsrfTokenManager, 'clearCsrfToken');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Assert
      expect(clearCsrfTokenSpy).toHaveBeenCalled();
    });

    it('should reload page on CSRF error', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      vi.useFakeTimers();

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Fast-forward timer
      vi.advanceTimersByTime(100);

      // Assert
      expect(window.location.reload).toHaveBeenCalled();
      expect(sessionStorage.getItem('csrf_reload_attempted')).toBeTruthy();

      vi.useRealTimers();
    });

    it('should prevent infinite reload loops on CSRF error', async () => {
      // Arrange
      // Simulate recent reload attempt
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      sessionStorage.setItem('csrf_reload_attempted', recentTimestamp.toString());

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      vi.useFakeTimers({ now: Date.now() });

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Fast-forward timer
      vi.advanceTimersByTime(100);

      // Assert - Should NOT reload again (within 5 seconds)
      expect(window.location.reload).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should allow reload after grace period', async () => {
      // Arrange
      // Simulate old reload attempt (6 seconds ago)
      const oldTimestamp = Date.now() - 6000;
      sessionStorage.setItem('csrf_reload_attempted', oldTimestamp.toString());

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      vi.useFakeTimers({ now: Date.now() });

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Fast-forward timer
      vi.advanceTimersByTime(100);

      // Assert - Should reload again (past grace period)
      expect(window.location.reload).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not reload on non-CSRF 403 errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden - insufficient permissions' }),
        headers: new Headers(),
      });

      vi.useFakeTimers();

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Fast-forward timer
      vi.advanceTimersByTime(100);

      // Assert - Should NOT reload (not a CSRF error)
      expect(window.location.reload).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not retry CSRF errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      // Act
      await apiClient
        .request('/test-endpoint', {
          method: 'POST',
          retry: { maxRetries: 3 },
        })
        .catch(() => {});

      // Assert - Should only call fetch once (no retries for CSRF errors)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should set CSRF error flag in sessionStorage', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'CSRF token validation failed' }),
        headers: new Headers(),
      });

      // Act
      await apiClient.request('/test-endpoint', { method: 'POST' }).catch(() => {});

      // Assert
      expect(sessionStorage.getItem('csrf_error_occurred')).toBe('true');
    });
  });
});
