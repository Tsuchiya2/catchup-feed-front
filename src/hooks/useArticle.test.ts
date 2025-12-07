import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useArticle } from './useArticle';
import * as articleApi from '@/lib/api/endpoints/articles';
import type { Article } from '@/types/api';
import { createMockArticle } from '@/__test__/factories/articleFactory';

// Mock the articles API
vi.mock('@/lib/api/endpoints/articles', () => ({
  getArticle: vi.fn(),
}));

describe('useArticle', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    Wrapper.displayName = 'TestQueryClientProvider';
    return Wrapper;
  };

  const mockArticle: Article = createMockArticle({
    id: 1,
    title: 'Test Article',
    url: 'https://example.com/article',
    summary: 'Test summary',
    published_at: '2025-01-15T10:00:00Z',
    created_at: '2025-01-15T10:00:00Z',
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Successful Fetch', () => {
    it('should fetch article by ID', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.article).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.article).toEqual(mockArticle);
      expect(result.current.error).toBe(null);
      expect(articleApi.getArticle).toHaveBeenCalledWith(1);
    });

    it('should return article data correctly', async () => {
      const customArticle = {
        ...mockArticle,
        id: 42,
        title: 'Custom Article',
      };
      vi.mocked(articleApi.getArticle).mockResolvedValue(customArticle);

      const { result } = renderHook(() => useArticle(42), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.article?.id).toBe(42);
      expect(result.current.article?.title).toBe('Custom Article');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Article not found');
      vi.mocked(articleApi.getArticle).mockRejectedValue(error);

      const { result } = renderHook(() => useArticle(999), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toEqual(error);
      expect(result.current.article).toBe(null);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      vi.mocked(articleApi.getArticle).mockRejectedValue(networkError);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.error?.message).toBe('Network request failed');
    });
  });

  describe('Invalid ID Handling', () => {
    it('should not fetch when ID is 0', async () => {
      const { result } = renderHook(() => useArticle(0), {
        wrapper: createWrapper(),
      });

      // Should immediately be not loading because query is disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.article).toBe(null);
      expect(articleApi.getArticle).not.toHaveBeenCalled();
    });

    it('should not fetch when ID is negative', async () => {
      const { result } = renderHook(() => useArticle(-1), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.article).toBe(null);
      expect(articleApi.getArticle).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      vi.mocked(articleApi.getArticle).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockArticle), 100))
      );

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.article).toBe(null);
    });

    it('should transition from loading to loaded', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.article).toEqual(mockArticle);
    });
  });

  describe('Refetch Function', () => {
    it('should provide refetch function', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch when refetch is called', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.getArticle).toHaveBeenCalledTimes(1);

      // Call refetch
      result.current.refetch();

      await waitFor(() => {
        expect(articleApi.getArticle).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Caching', () => {
    it('should cache article data', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result, rerender } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender with same ID
      rerender();

      // Should not fetch again immediately (using cache)
      expect(articleApi.getArticle).toHaveBeenCalledTimes(1);
    });

    it('should use different cache keys for different IDs', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { rerender, result } = renderHook(({ id }) => useArticle(id), {
        wrapper: createWrapper(),
        initialProps: { id: 1 },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change to different ID
      rerender({ id: 2 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have fetched both articles
      expect(articleApi.getArticle).toHaveBeenCalledWith(1);
      expect(articleApi.getArticle).toHaveBeenCalledWith(2);
    });
  });

  describe('Return Type', () => {
    it('should return correct shape', async () => {
      vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('article');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should return null article when not loaded', () => {
      vi.mocked(articleApi.getArticle).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useArticle(1), {
        wrapper: createWrapper(),
      });

      expect(result.current.article).toBe(null);
    });
  });
});
