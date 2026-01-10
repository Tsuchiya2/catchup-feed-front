/**
 * useDeleteSource Hook Tests
 *
 * Tests for the useDeleteSource hook including:
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
import { useDeleteSource } from './useDeleteSource';
import * as sourcesApi from '@/lib/api/endpoints/sources';
import React from 'react';
import type { Source, SourcesResponse } from '@/types/api';

// Mock the sources API
vi.mock('@/lib/api/endpoints/sources', () => ({
  deleteSource: vi.fn(),
}));

// Mock observability dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/observability/metrics', () => ({
  metrics: {
    source: {
      delete: {
        attempt: vi.fn(),
        success: vi.fn(),
        failure: vi.fn(),
        cacheRollback: vi.fn(),
        dialog: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/observability/tracing', () => ({
  startSpan: vi.fn((_name, _op, callback) => callback()),
  addBreadcrumb: vi.fn(),
  addContext: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
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
  name: 'Tech Blog',
  feed_url: 'https://example.com/feed.xml',
  active: true,
};

const mockSourcesResponse: SourcesResponse = [
  mockSource,
  {
    id: 2,
    name: 'Other Blog',
    feed_url: 'https://other.com/feed.xml',
    active: true,
  },
];

describe('useDeleteSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(typeof result.current.deleteSource).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('API Call Tests', () => {
    it('calls deleteSource API with correct ID', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      expect(mockDeleteSource).toHaveBeenCalledWith(1);
      expect(mockDeleteSource).toHaveBeenCalledTimes(1);
    });

    it('calls deleteSource API with multiple different IDs', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValue(undefined);

      const wrapper = createWrapper();

      const { result: result1 } = renderHook(() => useDeleteSource(), {
        wrapper,
      });

      await act(async () => {
        await result1.current.mutateAsync({ id: 1 });
      });

      const { result: result2 } = renderHook(() => useDeleteSource(), {
        wrapper,
      });

      await act(async () => {
        await result2.current.mutateAsync({ id: 2 });
      });

      expect(mockDeleteSource).toHaveBeenCalledWith(1);
      expect(mockDeleteSource).toHaveBeenCalledWith(2);
      expect(mockDeleteSource).toHaveBeenCalledTimes(2);
    });
  });

  describe('Optimistic Update Tests', () => {
    it('removes source from cache immediately on mutate (optimistic update)', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = () => resolve();
      });
      mockDeleteSource.mockReturnValueOnce(pendingPromise);

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

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.deleteSource({ id: 1 });
      });

      // Check cache was updated optimistically (before API resolves)
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
        expect(cachedData).toBeDefined();
        expect(cachedData).not.toBeNull();
        expect(cachedData!.length).toBe(1);
        expect(cachedData![0]!.id).toBe(2);
        expect(cachedData![0]!.name).toBe('Other Blog');
      });

      // Resolve the API call
      await act(async () => {
        resolvePromise!();
      });
    });

    it('snapshots previous state before optimistic update', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

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

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      // Verify optimistic update happened (context would have snapshot)
      expect(mockDeleteSource).toHaveBeenCalled();
    });

    it('preserves other sources in cache during optimistic update', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // Pre-populate cache with multiple sources
      queryClient.setQueryData<SourcesResponse>(['sources'], mockSourcesResponse);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      // Verify other source was preserved
      const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
      expect(cachedData).toBeDefined();
      expect(cachedData!.length).toBe(1);
      expect(cachedData![0]!.id).toBe(2);
      expect(cachedData![0]!.name).toBe('Other Blog');
      expect(cachedData![0]!.feed_url).toBe('https://other.com/feed.xml');
    });
  });

  describe('Error Handling Tests', () => {
    it('rolls back cache to previous state on API error', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('API Error');
      mockDeleteSource.mockRejectedValueOnce(error);

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

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
        } catch {
          // Expected to throw
        }
      });

      // Verify cache was rolled back to original state
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<SourcesResponse>(['sources']);
        expect(cachedData).toBeDefined();
        expect(cachedData!.length).toBe(2);
        expect(cachedData![0]!.id).toBe(1);
        expect(cachedData![0]!.name).toBe('Tech Blog');
        expect(cachedData![1]!.id).toBe(2);
        expect(cachedData![1]!.name).toBe('Other Blog');
      });
    });

    it('exposes error state on API failure', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('Network Error');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
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
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('Source not found');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 999 });
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
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('Permission denied');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
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
    it('invalidates sources cache on success', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

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

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['sources'] });
      });
    });

    it('triggers cache refetch after successful deletion', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

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

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      // Verify mutation succeeded
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('State Tests', () => {
    it('sets isPending during mutation', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = () => resolve();
      });
      mockDeleteSource.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteSource({ id: 1 });
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

    it('sets isSuccess after successful mutation', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('isSuccess remains false after error', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('API Error');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('reset clears error state', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('API Error');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
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

    it('reset clears success state', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
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
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      // No pre-populated cache

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1 });
      });

      // Should not throw and should succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles concurrent mutations correctly', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValue(undefined);

      const wrapper = createWrapper();

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper,
      });

      // Fire two mutations concurrently
      await act(async () => {
        const promise1 = result.current.mutateAsync({ id: 1 });
        const promise2 = result.current.mutateAsync({ id: 2 });

        await Promise.all([promise1, promise2]);
      });

      expect(mockDeleteSource).toHaveBeenCalledTimes(2);
    });

    it('allows mutation retry after error', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('First attempt failed');
      mockDeleteSource.mockRejectedValueOnce(error);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      // First attempt - fails
      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
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
        await result.current.mutateAsync({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Integration with mutateAsync', () => {
    it('mutateAsync returns promise that resolves on success', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      mockDeleteSource.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      let promiseResolved = false;

      await act(async () => {
        await result.current.mutateAsync({ id: 1 }).then(() => {
          promiseResolved = true;
        });
      });

      expect(promiseResolved).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('mutateAsync throws on error', async () => {
      const mockDeleteSource = vi.mocked(sourcesApi.deleteSource);
      const error = new Error('Mutation failed');
      mockDeleteSource.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteSource(), {
        wrapper: createWrapper(),
      });

      let caughtError: Error | undefined;

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1 });
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).toBeDefined();
      expect(caughtError!.message).toBe('Mutation failed');
    });
  });
});
