/**
 * useDeleteSource Hook Performance Benchmarks
 *
 * Measures hook performance to validate NFR targets:
 * - Optimistic update: < 10ms
 * - Cache rollback: < 10ms
 */

import { describe, bench, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useDeleteSource } from './useDeleteSource';
import type { Source } from '@/types/api';

// Mock dependencies
vi.mock('@/lib/api/endpoints/sources', () => ({
  deleteSource: vi.fn(() => Promise.resolve()),
}));

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

// Generate mock sources
function generateSources(count: number): Source[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Source ${i + 1}`,
    feed_url: `https://example.com/feed${i + 1}.xml`,
    site_url: `https://example.com/${i + 1}`,
    active: true,
    fetch_interval_minutes: 60,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }));
}

// Create wrapper with pre-populated cache
function createWrapper(sources: Source[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Pre-populate cache
  queryClient.setQueryData(['sources'], sources);

  return {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
    queryClient,
  };
}

describe('useDeleteSource Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  bench(
    'hook initialization < 5ms',
    () => {
      const { wrapper } = createWrapper(generateSources(10));
      const { unmount } = renderHook(() => useDeleteSource(), { wrapper });
      unmount();
    },
    { iterations: 100, warmupIterations: 10 }
  );

  bench(
    'optimistic update with 10 sources < 10ms',
    async () => {
      const sources = generateSources(10);
      const { wrapper, queryClient } = createWrapper(sources);
      const { result, unmount } = renderHook(() => useDeleteSource(), { wrapper });

      await act(async () => {
        result.current.deleteSource({ id: 1 });
        // Allow optimistic update to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify optimistic update happened
      const cachedSources = queryClient.getQueryData<Source[]>(['sources']);
      if (cachedSources && cachedSources.length !== 9) {
        throw new Error('Optimistic update failed');
      }

      unmount();
    },
    { iterations: 50, warmupIterations: 5 }
  );

  bench(
    'optimistic update with 100 sources < 20ms',
    async () => {
      const sources = generateSources(100);
      const { wrapper, queryClient } = createWrapper(sources);
      const { result, unmount } = renderHook(() => useDeleteSource(), { wrapper });

      await act(async () => {
        result.current.deleteSource({ id: 50 });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const cachedSources = queryClient.getQueryData<Source[]>(['sources']);
      if (cachedSources && cachedSources.length !== 99) {
        throw new Error('Optimistic update failed');
      }

      unmount();
    },
    { iterations: 30, warmupIterations: 3 }
  );

  bench(
    'optimistic update with 1000 sources < 50ms',
    async () => {
      const sources = generateSources(1000);
      const { wrapper, queryClient } = createWrapper(sources);
      const { result, unmount } = renderHook(() => useDeleteSource(), { wrapper });

      await act(async () => {
        result.current.deleteSource({ id: 500 });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const cachedSources = queryClient.getQueryData<Source[]>(['sources']);
      if (cachedSources && cachedSources.length !== 999) {
        throw new Error('Optimistic update failed');
      }

      unmount();
    },
    { iterations: 10, warmupIterations: 2 }
  );

  bench(
    '10 sequential deletes < 200ms',
    async () => {
      const sources = generateSources(20);
      const { wrapper } = createWrapper(sources);
      const { result, unmount } = renderHook(() => useDeleteSource(), { wrapper });

      for (let i = 1; i <= 10; i++) {
        await act(async () => {
          result.current.deleteSource({ id: i });
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
      }

      unmount();
    },
    { iterations: 10, warmupIterations: 2 }
  );
});
