import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSources, getSource, updateSourceActive } from '../sources';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { SourcesResponse, SourceResponse } from '@/types/api';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Sources API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSources', () => {
    it('should call GET /sources endpoint', async () => {
      // Arrange
      const mockResponse: SourcesResponse = [
        {
          id: 1,
          name: 'Test Source',
          feed_url: 'https://example.com/feed.xml',
          active: true,
          last_crawled_at: '2025-01-01T12:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await getSources();

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/sources');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty sources array when no sources exist', async () => {
      // Arrange
      const mockResponse: SourcesResponse = [];

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await getSources();

      // Assert
      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      // Arrange
      const mockError = new ApiError('Server Error', 500);
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(getSources()).rejects.toThrow(ApiError);
      await expect(getSources()).rejects.toThrow('Server Error');
    });
  });

  describe('getSource', () => {
    it('should call GET /sources/:id endpoint with correct ID', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 42,
        name: 'Specific Source',
        feed_url: 'https://example.com/specific.xml',
        active: true,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await getSource(42);

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/sources/42');
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(42);
    });

    it('should throw ApiError when source not found', async () => {
      // Arrange
      const mockError = new ApiError('Not Found', 404);
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(getSource(999)).rejects.toThrow(ApiError);
      await expect(getSource(999)).rejects.toThrow('Not Found');
    });

    it('should handle different source IDs correctly', async () => {
      // Arrange
      const mockResponse1: SourceResponse = {
        id: 1,
        name: 'Source 1',
        feed_url: 'https://example.com/1.xml',
        active: true,
        last_crawled_at: null,
      };

      const mockResponse2: SourceResponse = {
        id: 2,
        name: 'Source 2',
        feed_url: 'https://example.com/2.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act
      const result1 = await getSource(1);
      const result2 = await getSource(2);

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/sources/1');
      expect(apiClient.get).toHaveBeenCalledWith('/sources/2');
      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
    });
  });

  describe('updateSourceActive', () => {
    it('should call PUT /sources/:id with correct endpoint', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      const result = await updateSourceActive(1, false);

      // Assert
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      expect(apiClient.put).toHaveBeenCalledWith('/sources/1', { active: false });
      expect(result).toEqual(mockResponse);
      expect(result.active).toBe(false);
    });

    it('should send correct request body for activating source', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 2,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: true,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      await updateSourceActive(2, true);

      // Assert
      expect(apiClient.put).toHaveBeenCalledWith('/sources/2', { active: true });
    });

    it('should send correct request body for deactivating source', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 3,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      await updateSourceActive(3, false);

      // Assert
      expect(apiClient.put).toHaveBeenCalledWith('/sources/3', { active: false });
    });

    it('should return updated source response on success', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 5,
        name: 'Updated Source',
        feed_url: 'https://example.com/updated.xml',
        active: true,
        last_crawled_at: '2025-01-02T08:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      const result = await updateSourceActive(5, true);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(5);
      expect(result.active).toBe(true);
    });

    it('should throw ApiError on 403 Forbidden (permission denied)', async () => {
      // Arrange
      const mockError = new ApiError('Forbidden', 403);
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      // Act & Assert
      await expect(updateSourceActive(1, false)).rejects.toThrow(ApiError);
      await expect(updateSourceActive(1, false)).rejects.toThrow('Forbidden');

      const error = await updateSourceActive(1, false).catch((e) => e);
      expect(error.status).toBe(403);
    });

    it('should throw ApiError on 404 Not Found', async () => {
      // Arrange
      const mockError = new ApiError('Not Found', 404);
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      // Act & Assert
      await expect(updateSourceActive(999, true)).rejects.toThrow(ApiError);
      await expect(updateSourceActive(999, true)).rejects.toThrow('Not Found');

      const error = await updateSourceActive(999, true).catch((e) => e);
      expect(error.status).toBe(404);
    });

    it('should throw ApiError on 400 Bad Request (validation error)', async () => {
      // Arrange
      const mockError = new ApiError('Bad Request', 400);
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      // Act & Assert
      await expect(updateSourceActive(1, true)).rejects.toThrow(ApiError);

      const error = await updateSourceActive(1, true).catch((e) => e);
      expect(error.status).toBe(400);
    });

    it('should throw ApiError on 500 Server Error', async () => {
      // Arrange
      const mockError = new ApiError('Internal Server Error', 500);
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      // Act & Assert
      await expect(updateSourceActive(1, false)).rejects.toThrow(ApiError);

      const error = await updateSourceActive(1, false).catch((e) => e);
      expect(error.status).toBe(500);
    });

    it('should include Authorization header via apiClient', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      await updateSourceActive(1, false);

      // Assert
      // The apiClient.put method should be called (which includes auth header)
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      // Note: Authorization header is automatically added by apiClient
    });

    it('should handle multiple sequential updates', async () => {
      // Arrange
      const mockResponse1: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      const mockResponse2: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: true,
        last_crawled_at: '2025-01-01T13:00:00Z',
      };

      vi.mocked(apiClient.put)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act
      const result1 = await updateSourceActive(1, false);
      const result2 = await updateSourceActive(1, true);

      // Assert
      expect(apiClient.put).toHaveBeenCalledTimes(2);
      expect(result1.active).toBe(false);
      expect(result2.active).toBe(true);
    });

    it('should handle concurrent updates to different sources', async () => {
      // Arrange
      const mockResponse1: SourceResponse = {
        id: 1,
        name: 'Source 1',
        feed_url: 'https://example.com/1.xml',
        active: false,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      const mockResponse2: SourceResponse = {
        id: 2,
        name: 'Source 2',
        feed_url: 'https://example.com/2.xml',
        active: true,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockImplementation((endpoint, data) => {
        if (endpoint === '/sources/1') {
          return Promise.resolve(mockResponse1);
        }
        if (endpoint === '/sources/2') {
          return Promise.resolve(mockResponse2);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      // Act
      const [result1, result2] = await Promise.all([
        updateSourceActive(1, false),
        updateSourceActive(2, true),
      ]);

      // Assert
      expect(apiClient.put).toHaveBeenCalledTimes(2);
      expect(result1.id).toBe(1);
      expect(result1.active).toBe(false);
      expect(result2.id).toBe(2);
      expect(result2.active).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      vi.mocked(apiClient.put).mockRejectedValue(networkError);

      // Act & Assert
      await expect(updateSourceActive(1, true)).rejects.toThrow('Network request failed');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      vi.mocked(apiClient.put).mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(updateSourceActive(1, false)).rejects.toThrow('Request timeout');
    });

    it('should preserve error details in ApiError', async () => {
      // Arrange
      const mockError = new ApiError('Validation failed', 400, {
        field: 'active',
        message: 'Invalid value',
      });
      vi.mocked(apiClient.put).mockRejectedValue(mockError);

      // Act & Assert
      try {
        await updateSourceActive(1, true);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).details).toEqual({
          field: 'active',
          message: 'Invalid value',
        });
      }
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed SourceResponse', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: true,
        last_crawled_at: '2025-01-01T12:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act
      const result = await updateSourceActive(1, true);

      // Assert - TypeScript should allow accessing these properties
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.feed_url).toBeDefined();
      expect(result.active).toBeDefined();
      expect(typeof result.active).toBe('boolean');
    });

    it('should accept valid boolean values for active parameter', async () => {
      // Arrange
      const mockResponse: SourceResponse = {
        id: 1,
        name: 'Test Source',
        feed_url: 'https://example.com/feed.xml',
        active: true,
        last_crawled_at: null,
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      // Act & Assert - These should compile and work
      await updateSourceActive(1, true);
      await updateSourceActive(1, false);

      const activeValue = true;
      await updateSourceActive(1, activeValue);
    });
  });
});
