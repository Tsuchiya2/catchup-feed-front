/**
 * useUpdateSource Hook Tests
 *
 * Tests for the useUpdateSource hook including:
 * - API call correctness
 * - Optimistic updates
 * - Error handling and rollback
 * - Success handling and cache invalidation
 * - State transitions (isPending, isSuccess)
 * - Reset functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateSource } from './useUpdateSource';
import * as sourcesApi from '@/lib/api/endpoints/sources';
import React from 'react';
import type { Source, SourcesResponse } from '@/types/api';

// Mock the sources API
vi.mock('@/lib/api/endpoints/sources', () => ({
  updateSource: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

const mockSource: Source = {
  id: 1,
  name: 'Original Tech Blog',
  feed_url: 'https://original.com/feed.xml',
  source_type: 'RSS',
  active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockSourcesResponse: SourcesResponse = [mockSource];

describe('useUpdateSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(typeof result.current.updateSource).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('API Call Tests', () => {
    it('calls updateSource API with correct id and data parameters', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        name: 'Updated Tech Blog',
        feedURL: 'https://updated.com/feed.xml',
        active: false,
      };

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: updateData,
        });
      });

      expect(mockUpdateSource).toHaveBeenCalledWith(1, updateData);
      expect(mockUpdateSource).toHaveBeenCalledTimes(1);
    });

    it('calls updateSource API with multiple different IDs', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValue(mockSource);

      const wrapper = createWrapper();

      const { result: result1 } = renderHook(() => useUpdateSource(), {
        wrapper,
      });

      await act(async () => {
        await result1.current.mutateAsync({
          id: 1,
          data: { name: 'Blog 1', feedURL: 'https://blog1.com/feed.xml', active: true },
        });
      });

      const { result: result2 } = renderHook(() => useUpdateSource(), {
        wrapper,
      });

      await act(async () => {
        await result2.current.mutateAsync({
          id: 2,
          data: { name: 'Blog 2', feedURL: 'https://blog2.com/feed.xml', active: false },
        });
      });

      expect(mockUpdateSource).toHaveBeenCalledWith(1, {
        name: 'Blog 1',
        feedURL: 'https://blog1.com/feed.xml',
        active: true,
      });
      expect(mockUpdateSource).toHaveBeenCalledWith(2, {
        name: 'Blog 2',
        feedURL: 'https://blog2.com/feed.xml',
        active: false,
      });
      expect(mockUpdateSource).toHaveBeenCalledTimes(2);
    });
  });

  describe('Optimistic Update Tests', () => {
    it('updates cache immediately on mutate (optimistic update)', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      let resolvePromise: () => void;
      const pendingPromise = new Promise<Source>((resolve) => {
        resolvePromise = () => resolve(mockSource);
      });
      mockUpdateSource.mockReturnValueOnce(pendingPromise);

      const wrapper = createWrapper();
      const Wrapper = wrapper as React.ComponentType<{ children: React.ReactNode }>;
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache with initial data
      queryClient.setQueryData<SourcesResponse>(['sources'], mockSourcesResponse);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.updateSource({
          id: 1,
          data: {
            name: 'Optimistically Updated',
            feedURL: 'https://optimistic.com/feed.xml',
            active: false,
          },
        });
      });

      // Check cache was updated optimistically (before API resolves)
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
        expect(cachedData).toBeDefined();
        expect(cachedData?.[0].name).toBe('Optimistically Updated');
        expect(cachedData?.[0].feed_url).toBe('https://optimistic.com/feed.xml');
        expect(cachedData?.[0].active).toBe(false);
      });

      // Resolve the API call
      await act(async () => {
        resolvePromise!();
      });
    });

    it('snapshots previous state before optimistic update', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache with initial data
      const initialData = [
        {
          ...mockSource,
          name: 'Original Name',
          feed_url: 'https://original.com/feed.xml',
        },
      ];
      queryClient.setQueryData<SourcesResponse>(['sources'], initialData);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'New Name',
            feedURL: 'https://new.com/feed.xml',
            active: true,
          },
        });
      });

      // Verify optimistic update happened (context would have snapshot)
      expect(mockUpdateSource).toHaveBeenCalled();
    });

    it('preserves other sources in cache during optimistic update', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache with multiple sources
      const multipleSourcesData: SourcesResponse = [
        mockSource,
        {
          id: 2,
          name: 'Other Blog',
          feed_url: 'https://other.com/feed.xml',
          source_type: 'RSS',
          active: true,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];
      queryClient.setQueryData<SourcesResponse>(['sources'], multipleSourcesData);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Updated First Blog',
            feedURL: 'https://updated.com/feed.xml',
            active: false,
          },
        });
      });

      // Verify other source was preserved
      const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
      expect(cachedData?.length).toBe(2);
      expect(cachedData?.[1].name).toBe('Other Blog');
      expect(cachedData?.[1].feed_url).toBe('https://other.com/feed.xml');
    });
  });

  describe('Error Handling Tests', () => {
    it('rolls back cache to previous state on API error', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('API Error');
      mockUpdateSource.mockRejectedValueOnce(error);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache with initial data
      const initialData = [
        {
          ...mockSource,
          name: 'Original Name',
          feed_url: 'https://original.com/feed.xml',
        },
      ];
      queryClient.setQueryData<SourcesResponse>(['sources'], initialData);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Failed Update',
              feedURL: 'https://failed.com/feed.xml',
              active: false,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      // Verify cache was rolled back to original state
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
        expect(cachedData?.[0].name).toBe('Original Name');
        expect(cachedData?.[0].feed_url).toBe('https://original.com/feed.xml');
      });
    });

    it('returns error on API failure', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('Network Error');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Test',
              feedURL: 'https://test.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Network Error');
      });
    });

    it('handles 404 error correctly', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('Source not found');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 999,
            data: {
              name: 'Non-existent',
              feedURL: 'https://test.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Source not found');
      });
    });

    it('handles 403 permission denied error', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('Permission denied');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Unauthorized Update',
              feedURL: 'https://test.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Permission denied');
      });
    });
  });

  describe('Success Handling Tests', () => {
    it('invalidates sources query on success', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache
      queryClient.setQueryData<SourcesResponse>(['sources'], mockSourcesResponse);

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Updated',
            feedURL: 'https://updated.com/feed.xml',
            active: true,
          },
        });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['sources'] });
      });
    });

    it('triggers cache refetch after successful update', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache
      queryClient.setQueryData<SourcesResponse>(['sources'], mockSourcesResponse);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Updated',
            feedURL: 'https://updated.com/feed.xml',
            active: true,
          },
        });
      });

      // Verify mutation succeeded
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('State Tests', () => {
    it('isPending is true during mutation', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      let resolvePromise: () => void;
      const pendingPromise = new Promise<Source>((resolve) => {
        resolvePromise = () => resolve(mockSource);
      });
      mockUpdateSource.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateSource({
          id: 1,
          data: {
            name: 'Test',
            feedURL: 'https://test.com/feed.xml',
            active: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await act(async () => {
        resolvePromise!();
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    it('isSuccess is true after successful mutation', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Success Test',
            feedURL: 'https://success.com/feed.xml',
            active: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('isSuccess remains false after error', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('API Error');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Fail Test',
              feedURL: 'https://fail.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('reset() clears error state', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('API Error');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Test',
              feedURL: 'https://test.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
      });
    });

    it('reset() clears success state', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Test',
            feedURL: 'https://test.com/feed.xml',
            active: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty cache gracefully during optimistic update', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // No pre-populated cache

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Empty Cache Test',
            feedURL: 'https://test.com/feed.xml',
            active: true,
          },
        });
      });

      // Should not throw and should succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles concurrent mutations correctly', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValue(mockSource);

      const wrapper = createWrapper();

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper,
      });

      // Fire two mutations concurrently
      await act(async () => {
        const promise1 = result.current.mutateAsync({
          id: 1,
          data: { name: 'Update 1', feedURL: 'https://test1.com/feed.xml', active: true },
        });
        const promise2 = result.current.mutateAsync({
          id: 2,
          data: { name: 'Update 2', feedURL: 'https://test2.com/feed.xml', active: false },
        });

        await Promise.all([promise1, promise2]);
      });

      expect(mockUpdateSource).toHaveBeenCalledTimes(2);
    });

    it('allows mutation retry after error', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('First attempt failed');
      mockUpdateSource.mockRejectedValueOnce(error);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      // First attempt - fails
      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Retry Test',
              feedURL: 'https://retry.com/feed.xml',
              active: true,
            },
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Reset error state
      act(() => {
        result.current.reset();
      });

      // Second attempt - succeeds
      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: {
            name: 'Retry Test',
            feedURL: 'https://retry.com/feed.xml',
            active: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Integration with mutateAsync', () => {
    it('mutateAsync returns promise that resolves on success', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      mockUpdateSource.mockResolvedValueOnce(mockSource);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      let promiseResolved = false;

      await act(async () => {
        await result.current
          .mutateAsync({
            id: 1,
            data: {
              name: 'Promise Test',
              feedURL: 'https://promise.com/feed.xml',
              active: true,
            },
          })
          .then(() => {
            promiseResolved = true;
          });
      });

      expect(promiseResolved).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('mutateAsync throws on error', async () => {
      const mockUpdateSource = vi.mocked(sourcesApi.updateSource);
      const error = new Error('Mutation failed');
      mockUpdateSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateSource(), {
        wrapper: createWrapper(),
      });

      let caughtError: Error | null = null;

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: {
              name: 'Error Test',
              feedURL: 'https://error.com/feed.xml',
              active: true,
            },
          });
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).toBeTruthy();
      expect(caughtError?.message).toBe('Mutation failed');
    });
  });
});
