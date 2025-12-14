import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './client';
import { ApiError, NetworkError, TimeoutError } from './errors';
import * as tokenUtils from '@/lib/auth/token';

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

      // Act & Assert
      const error = (await apiClient.request('/error').catch((e) => e)) as ApiError;

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

      // Act & Assert
      const error = (await apiClient.request('/unavailable').catch((e) => e)) as ApiError;

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

      // Act & Assert
      await expect(apiClient.request('/slow', { timeout: 50 })).rejects.toThrow(TimeoutError);
      const error = (await apiClient
        .request('/slow', { timeout: 50 })
        .catch((e) => e)) as TimeoutError;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toContain('timed out');
    });

    it('should handle network error', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert
      await expect(apiClient.request('/network-fail')).rejects.toThrow(NetworkError);
      const error = (await apiClient.request('/network-fail').catch((e) => e)) as NetworkError;

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
      await expect(apiClient.request('/unknown')).rejects.toThrow('Unknown error');
    });
  });
});
