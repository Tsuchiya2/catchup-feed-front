/**
 * useCreateSource Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateSource } from './useCreateSource';
import * as sourcesApi from '@/lib/api/endpoints/sources';
import React from 'react';

// Mock the sources API
vi.mock('@/lib/api/endpoints/sources', () => ({
  createSource: vi.fn(),
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

describe('useCreateSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
    expect(typeof result.current.createSource).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('calls createSource API with correct data', async () => {
    const mockCreateSource = vi.mocked(sourcesApi.createSource);
    mockCreateSource.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    const inputData = {
      name: 'Test Blog',
      feedURL: 'https://test.com/feed.xml',
    };

    await act(async () => {
      await result.current.mutateAsync(inputData);
    });

    expect(mockCreateSource).toHaveBeenCalledWith(inputData);
    expect(mockCreateSource).toHaveBeenCalledTimes(1);
  });

  it('sets isPending to true during mutation', async () => {
    const mockCreateSource = vi.mocked(sourcesApi.createSource);
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockCreateSource.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createSource({
        name: 'Test',
        feedURL: 'https://test.com/feed.xml',
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

  it('sets isSuccess to true on successful mutation', async () => {
    const mockCreateSource = vi.mocked(sourcesApi.createSource);
    mockCreateSource.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Test',
        feedURL: 'https://test.com/feed.xml',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('sets error on failed mutation', async () => {
    const mockCreateSource = vi.mocked(sourcesApi.createSource);
    const error = new Error('API Error');
    mockCreateSource.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          name: 'Test',
          feedURL: 'https://test.com/feed.xml',
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('API Error');
    });
  });

  it('reset clears mutation state', async () => {
    const mockCreateSource = vi.mocked(sourcesApi.createSource);
    const error = new Error('API Error');
    mockCreateSource.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateSource(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          name: 'Test',
          feedURL: 'https://test.com/feed.xml',
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
});
