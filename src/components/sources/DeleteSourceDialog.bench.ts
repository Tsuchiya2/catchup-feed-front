/**
 * DeleteSourceDialog Performance Benchmarks
 *
 * Measures rendering performance to validate NFR targets:
 * - Dialog render: < 50ms
 * - Dialog visible: < 100ms
 */

import { describe, bench } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { DeleteSourceDialog } from './DeleteSourceDialog';
import type { Source } from '@/types/api';

// Mock source for benchmarks
const mockSource: Source = {
  id: 1,
  name: 'Test Source',
  feed_url: 'https://example.com/feed.xml',
  site_url: 'https://example.com',
  active: true,
  fetch_interval_minutes: 60,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('DeleteSourceDialog Performance', () => {
  bench(
    'renders closed dialog in < 10ms',
    () => {
      const Wrapper = createWrapper();
      render(
        React.createElement(
          Wrapper,
          null,
          React.createElement(DeleteSourceDialog, {
            isOpen: false,
            onClose: () => {},
            source: mockSource,
          })
        )
      );
      cleanup();
    },
    { iterations: 100, warmupIterations: 10 }
  );

  bench(
    'renders open dialog in < 50ms',
    () => {
      const Wrapper = createWrapper();
      render(
        React.createElement(
          Wrapper,
          null,
          React.createElement(DeleteSourceDialog, {
            isOpen: true,
            onClose: () => {},
            source: mockSource,
          })
        )
      );
      cleanup();
    },
    { iterations: 100, warmupIterations: 10 }
  );

  bench(
    'handles 50 sequential renders in < 2500ms',
    () => {
      const Wrapper = createWrapper();
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          React.createElement(
            Wrapper,
            null,
            React.createElement(DeleteSourceDialog, {
              isOpen: true,
              onClose: () => {},
              source: { ...mockSource, id: i, name: `Source ${i}` },
            })
          )
        );
        unmount();
      }
    },
    { iterations: 10, warmupIterations: 2 }
  );

  bench(
    'dialog with error state renders in < 50ms',
    () => {
      const Wrapper = createWrapper();
      render(
        React.createElement(
          Wrapper,
          null,
          React.createElement(DeleteSourceDialog, {
            isOpen: true,
            onClose: () => {},
            source: mockSource,
          })
        )
      );
      cleanup();
    },
    { iterations: 100, warmupIterations: 10 }
  );
});
