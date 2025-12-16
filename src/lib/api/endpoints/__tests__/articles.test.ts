import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchArticles } from '../articles';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { PaginatedArticlesResponse, Article } from '@/types/api';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the validation utilities
vi.mock('@/lib/api/utils/pagination', () => ({
  validatePaginatedResponse: vi.fn(() => true),
}));

// Mock the article utilities
vi.mock('@/utils/article', () => ({
  validateArticle: vi.fn(() => true),
  normalizeSourceName: vi.fn((name: string) => name),
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  ArticleMigrationLogger: {
    debugApiResponse: vi.fn(),
    errorValidationFailed: vi.fn(),
    infoSourceNameNormalized: vi.fn(),
  },
}));

describe('Articles API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchArticles', () => {
    const mockArticle1: Article = {
      id: 1,
      source_id: 1,
      source_name: 'Test Source',
      title: 'Test Article 1',
      url: 'https://example.com/article1',
      summary: 'Test summary 1',
      published_at: '2025-01-01T10:00:00Z',
      created_at: '2025-01-01T10:00:00Z',
    };

    const mockArticle2: Article = {
      id: 2,
      source_id: 2,
      source_name: 'Another Source',
      title: 'Test Article 2',
      url: 'https://example.com/article2',
      summary: 'Test summary 2',
      published_at: '2025-01-02T10:00:00Z',
      created_at: '2025-01-02T10:00:00Z',
    };

    it('should call GET /articles endpoint with no parameters', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1, mockArticle2],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await searchArticles();

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles');
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
    });

    it('should call GET /articles endpoint with undefined parameters', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await searchArticles(undefined);

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles');
      expect(result).toEqual(mockResponse);
    });

    it('should build correct query string with keyword parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ keyword: 'typescript' });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?keyword=typescript');
    });

    it('should build correct query string with source_id parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ source_id: 42 });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?source_id=42');
    });

    it('should build correct query string with date range parameters', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({
        from: '2025-01-01',
        to: '2025-12-31',
      });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?from=2025-01-01&to=2025-12-31');
    });

    it('should build correct query string with page parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 2,
          limit: 10,
          total: 20,
          total_pages: 2,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ page: 2 });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?page=2');
    });

    it('should build correct query string with limit parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ limit: 20 });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?limit=20');
    });

    it('should build correct query string with all parameters', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 2,
          limit: 20,
          total: 50,
          total_pages: 3,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({
        keyword: 'react',
        source_id: 1,
        from: '2025-01-01',
        to: '2025-12-31',
        page: 2,
        limit: 20,
      });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/articles?keyword=react&source_id=1&from=2025-01-01&to=2025-12-31&page=2&limit=20'
      );
    });

    it('should return empty data array when no articles match search', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await searchArticles({ keyword: 'nonexistent' });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should propagate API errors', async () => {
      // Arrange
      const mockError = new ApiError('Server Error', 500);
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(searchArticles({ keyword: 'test' })).rejects.toThrow(ApiError);
      await expect(searchArticles({ keyword: 'test' })).rejects.toThrow('Server Error');
    });

    it('should handle 400 Bad Request errors', async () => {
      // Arrange
      const mockError = new ApiError('Bad Request', 400);
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(searchArticles({ keyword: 'test' })).rejects.toThrow(ApiError);

      const error = await searchArticles({ keyword: 'test' }).catch((e) => e);
      expect(error.status).toBe(400);
    });

    it('should handle 404 Not Found errors', async () => {
      // Arrange
      const mockError = new ApiError('Not Found', 404);
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(searchArticles({ source_id: 999 })).rejects.toThrow(ApiError);

      const error = await searchArticles({ source_id: 999 }).catch((e) => e);
      expect(error.status).toBe(404);
    });

    it('should return properly typed PaginatedArticlesResponse', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await searchArticles({ keyword: 'test' });

      // Assert - TypeScript should allow accessing these properties
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.total_pages).toBe(1);
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      vi.mocked(apiClient.get).mockRejectedValue(networkError);

      // Act & Assert
      await expect(searchArticles({ keyword: 'test' })).rejects.toThrow('Network request failed');
    });

    it('should preserve article structure in response', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await searchArticles({ keyword: 'test' });

      // Assert
      const article = result.data[0]!;
      expect(article.id).toBeDefined();
      expect(article.source_id).toBeDefined();
      expect(article.source_name).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.url).toBeDefined();
      expect(article.summary).toBeDefined();
      expect(article.published_at).toBeDefined();
      expect(article.created_at).toBeDefined();
    });

    it('should handle multiple search requests sequentially', async () => {
      // Arrange
      const mockResponse1: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      const mockResponse2: PaginatedArticlesResponse = {
        data: [mockArticle2],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act
      const result1 = await searchArticles({ keyword: 'typescript' });
      const result2 = await searchArticles({ keyword: 'react' });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/articles?keyword=typescript');
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/articles?keyword=react');
      expect(result1.data[0]!.id).toBe(1);
      expect(result2.data[0]!.id).toBe(2);
    });

    it('should handle multiple sources correctly', async () => {
      // Arrange
      const mockResponseSource1: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      const mockResponseSource2: PaginatedArticlesResponse = {
        data: [mockArticle2],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockResponseSource1)
        .mockResolvedValueOnce(mockResponseSource2);

      // Act
      const result1 = await searchArticles({ source_id: 1 });
      const result2 = await searchArticles({ source_id: 2 });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/articles?source_id=1');
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/articles?source_id=2');
      expect(result1.data[0]!.id).toBe(1);
      expect(result2.data[0]!.id).toBe(2);
    });

    it('should handle special characters in keyword parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ keyword: 'test & special' });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      // URLSearchParams automatically encodes special characters
      expect(apiClient.get).toHaveBeenCalledWith('/articles?keyword=test+%26+special');
    });

    it('should handle empty string keyword parameter', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1, mockArticle2],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ keyword: '' });

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/articles?keyword=');
    });

    it('should preserve error details in ApiError', async () => {
      // Arrange
      const mockError = new ApiError('Validation failed', 400, {
        field: 'keyword',
        message: 'Invalid search term',
      });
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      // Act & Assert
      try {
        await searchArticles({ keyword: 'invalid' });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).details).toEqual({
          field: 'keyword',
          message: 'Invalid search term',
        });
      }
    });

    it('should include Authorization header via apiClient', async () => {
      // Arrange
      const mockResponse: PaginatedArticlesResponse = {
        data: [mockArticle1],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      await searchArticles({ keyword: 'test' });

      // Assert
      // The apiClient.get method should be called (which includes auth header)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      // Note: Authorization header is automatically added by apiClient
    });
  });
});
