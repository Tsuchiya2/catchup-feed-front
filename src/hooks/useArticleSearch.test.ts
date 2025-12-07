import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useArticleSearch } from './useArticleSearch';
import * as articleApi from '@/lib/api/endpoints/articles';
import { createMockArticles } from '@/__test__/factories/articleFactory';

// Mock the articles API
vi.mock('@/lib/api/endpoints/articles', () => ({
  searchArticles: vi.fn(),
}));

describe('useArticleSearch', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    Wrapper.displayName = 'TestQueryClientProvider';
    return Wrapper;
  };

  const mockArticles = createMockArticles(5);
  const mockPaginatedResponse = {
    data: mockArticles,
    pagination: {
      page: 1,
      limit: 10,
      total: 5,
      total_pages: 1,
    },
  };

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

  describe('Basic Functionality', () => {
    it('should fetch articles with search params', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const params = { keyword: 'React', page: 1, limit: 10 };
      const { result } = renderHook(() => useArticleSearch(params), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.articles).toEqual(mockArticles);
      expect(articleApi.searchArticles).toHaveBeenCalledWith(params);
    });

    it('should return empty array when no data', async () => {
      const emptyResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
        },
      };
      vi.mocked(articleApi.searchArticles).mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'nonexistent' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.articles).toEqual([]);
    });

    it('should calculate pagination correctly', async () => {
      const paginatedResponse = {
        data: mockArticles,
        pagination: {
          page: 2,
          limit: 5,
          total: 20,
          total_pages: 4,
        },
      };
      vi.mocked(articleApi.searchArticles).mockResolvedValue(paginatedResponse);

      const params = { keyword: 'test', page: 2, limit: 5 };
      const { result } = renderHook(() => useArticleSearch(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.limit).toBe(5);
      expect(result.current.pagination.total).toBe(20);
      expect(result.current.pagination.totalPages).toBe(4);
    });
  });

  describe('Search Parameters', () => {
    it('should handle keyword search', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'TypeScript' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith({ keyword: 'TypeScript' });
    });

    it('should handle source filter', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ source_id: 5 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith({ source_id: 5 });
    });

    it('should handle date range filter', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const params = { from: '2025-01-01', to: '2025-01-31' };
      const { result } = renderHook(() => useArticleSearch(params), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith(params);
    });

    it('should handle combined filters', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const params = {
        keyword: 'React',
        source_id: 3,
        from: '2025-01-01',
        to: '2025-01-31',
        page: 1,
        limit: 20,
      };
      const { result } = renderHook(() => useArticleSearch(params), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith(params);
    });

    it('should handle undefined params', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Search failed');
      vi.mocked(articleApi.searchArticles).mockRejectedValue(error);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toEqual(error);
      expect(result.current.articles).toEqual([]);
    });

    it('should retry once on failure', async () => {
      const error = new Error('Network error');
      vi.mocked(articleApi.searchArticles)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      // React Query retries once, so it should succeed
      expect(result.current.articles).toEqual(mockArticles);
    });
  });

  describe('Enabled Option', () => {
    it('should not fetch when enabled is false', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(
        () => useArticleSearch({ keyword: 'test' }, { enabled: false }),
        { wrapper: createWrapper() }
      );

      // Should not be loading because query is disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.articles).toEqual([]);
      expect(articleApi.searchArticles).not.toHaveBeenCalled();
    });

    it('should fetch when enabled is true', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(
        () => useArticleSearch({ keyword: 'test' }, { enabled: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.articles).toEqual(mockArticles);
      expect(articleApi.searchArticles).toHaveBeenCalled();
    });

    it('should default enabled to true', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalled();
    });
  });

  describe('Caching', () => {
    it('should cache results with same params', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const params = { keyword: 'React' };
      const { result, rerender } = renderHook(() => useArticleSearch(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender with same params
      rerender();

      // Should not fetch again immediately
      expect(articleApi.searchArticles).toHaveBeenCalledTimes(1);
    });

    it('should use different cache keys for different params', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result, rerender } = renderHook(({ params }) => useArticleSearch(params), {
        wrapper: createWrapper(),
        initialProps: { params: { keyword: 'React' } },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change params
      rerender({ params: { keyword: 'TypeScript' } });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledWith({ keyword: 'React' });
      expect(articleApi.searchArticles).toHaveBeenCalledWith({ keyword: 'TypeScript' });
    });
  });

  describe('Refetch Function', () => {
    it('should provide refetch function', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch when refetch is called', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(articleApi.searchArticles).toHaveBeenCalledTimes(1);

      result.current.refetch();

      await waitFor(() => {
        expect(articleApi.searchArticles).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Return Type', () => {
    it('should return correct shape', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useArticleSearch({ keyword: 'test' }), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('articles');
      expect(result.current).toHaveProperty('pagination');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should return correct pagination shape', async () => {
      vi.mocked(articleApi.searchArticles).mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(
        () => useArticleSearch({ keyword: 'test', page: 1, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination).toHaveProperty('page');
      expect(result.current.pagination).toHaveProperty('limit');
      expect(result.current.pagination).toHaveProperty('total');
      expect(result.current.pagination).toHaveProperty('totalPages');
    });

    it('should extract pagination metadata correctly from response', async () => {
      const customResponse = {
        data: createMockArticles(15),
        pagination: {
          page: 3,
          limit: 15,
          total: 100,
          total_pages: 7,
        },
      };
      vi.mocked(articleApi.searchArticles).mockResolvedValue(customResponse);

      const { result } = renderHook(() => useArticleSearch({ page: 3, limit: 15 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.articles).toHaveLength(15);
      expect(result.current.pagination).toEqual({
        page: 3,
        limit: 15,
        total: 100,
        totalPages: 7,
      });
    });
  });
});
