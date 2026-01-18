# React Coding Standards for catchup-feed-frontend

**Project**: catchup-feed-frontend
**Framework**: Next.js 15 with App Router
**React Version**: 19
**State Management**: TanStack Query (React Query) for server state, React hooks for local state
**UI Library**: shadcn/ui components

This document defines coding standards based on actual patterns observed in the codebase.

---

## 1. Component Structure & Organization

### 1.1 File Header Documentation

**Rule**: All non-trivial components MUST include JSDoc comments explaining purpose and usage.

**Pattern from codebase**:
```tsx
/**
 * ArticleSearch Component
 *
 * Search and filter panel for articles with keyword search,
 * source filter, and date range picker.
 */
```

**Found in**: `/src/components/articles/ArticleSearch.tsx`, `/src/components/common/Pagination.tsx`

### 1.2 Client vs Server Components

**Rule**: Use `'use client'` directive ONLY when component requires:
- Browser APIs (localStorage, window)
- Event handlers
- React hooks (useState, useEffect, etc.)
- Third-party libraries that require client-side rendering

**Client Component Pattern**:
```tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  // ... component logic
}
```

**Found in**: `/src/components/auth/LoginForm.tsx`, `/src/components/sources/SourceForm.tsx`

**Server Component Pattern** (no 'use client' directive):
```tsx
import * as React from 'react';
import { Badge } from '@/components/ui/badge';

export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // ... component logic
}
```

**Found in**: `/src/components/articles/ArticleCard.tsx`

### 1.3 Import Organization

**Rule**: Organize imports in this order:
1. React imports
2. Third-party libraries
3. UI components
4. Custom hooks
5. Utils/helpers
6. Types

**Pattern from codebase**:
```tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FormField } from '@/components/common/FormField';
import { validators } from '@/utils/validation';
import type { CreateSourceInput, SourceFormData } from '@/types/api';
```

**Found in**: `/src/components/sources/SourceForm.tsx`

---

## 2. Props Interface Conventions

### 2.1 Interface Naming

**Rule**: Component props interfaces MUST be named `{ComponentName}Props`.

**Pattern from codebase**:
```tsx
interface ArticleCardProps {
  article: Article;
  sourceName?: string;
  className?: string;
}

export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // ...
}
```

**Found in**: `/src/components/articles/ArticleCard.tsx`

### 2.2 Common Props Pattern

**Rule**: Reusable components SHOULD include these optional props when applicable:
- `className?: string` - for style customization
- `disabled?: boolean` - for form controls
- `isLoading?: boolean` - for async operations

**Pattern from codebase**:
```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  onItemsPerPageChange?: (limit: number) => void;
  availablePageSizes?: readonly number[];
}
```

**Found in**: `/src/components/common/Pagination.tsx`

### 2.3 JSDoc for Props

**Rule**: Complex components MUST document props with JSDoc comments.

**Pattern from codebase**:
```tsx
/**
 * Props for the Pagination component
 */
interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items (for "Showing X-Y of Z" text) */
  totalItems?: number;
}
```

**Found in**: `/src/components/common/Pagination.tsx`

---

## 3. State Management Patterns

### 3.1 Local State with useState

**Rule**: Use `React.useState` for UI-only state (loading, errors, form inputs).

**Pattern from codebase**:
```tsx
export function SourceForm({ mode, onSubmit, isLoading, error, onCancel, initialData }: SourceFormProps) {
  const [formData, setFormData] = React.useState<SourceFormData>(initialData ?? defaultFormData);
  const [errors, setErrors] = React.useState<SourceFormErrors>({});

  const handleChange = (field: keyof SourceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
}
```

**Found in**: `/src/components/sources/SourceForm.tsx`

### 3.2 Server State with TanStack Query

**Rule**: Use TanStack Query hooks (`useQuery`, `useMutation`) for ALL server data.

**Query Pattern**:
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getArticles } from '@/lib/api/endpoints/articles';

export function useArticles(query?: ArticlesQuery): UseArticlesReturn {
  const queryKey = ['articles', query ?? {}];

  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getArticles(query);
      return response;
    },
    staleTime: 60000, // 60 seconds
    retry: 1,
    refetchOnWindowFocus: true,
  });

  return {
    articles: data?.data ?? [],
    pagination: data?.pagination ?? {},
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

**Found in**: `/src/hooks/useArticles.ts`

**Mutation Pattern with Optimistic Updates**:
```tsx
const mutation = useMutation({
  mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
    return updateSourceActive(id, active);
  },
  onMutate: async ({ id, active }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['sources'] });

    // Snapshot previous value for rollback
    const previousSources = queryClient.getQueryData<Source[]>(['sources']);

    // Optimistically update cache
    queryClient.setQueryData<Source[]>(['sources'], (old) => {
      if (!old) return old;
      return old.map((source) => (source.id === id ? { ...source, active } : source));
    });

    return { previousSources };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousSources) {
      queryClient.setQueryData(['sources'], context.previousSources);
    }
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['sources'] });
  },
});
```

**Found in**: `/src/app/(protected)/sources/page.tsx`

### 3.3 Global Query Configuration

**Rule**: Configure query defaults in QueryProvider.

**Pattern from codebase**:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000, // 60 seconds
            gcTime: 300000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Found in**: `/src/providers/QueryProvider.tsx`

---

## 4. Event Handling Patterns

### 4.1 Event Handler Naming

**Rule**: Event handlers MUST be named with `handle` prefix.

**Pattern from codebase**:
```tsx
const handleKeywordChange = React.useCallback(
  (keyword: string) => {
    onSearchChange({ ...searchState, keyword });
  },
  [searchState, onSearchChange]
);

const handleClearAll = React.useCallback(() => {
  onSearchChange({
    keyword: '',
    sourceId: null,
    fromDate: null,
    toDate: null,
  });
}, [onSearchChange]);
```

**Found in**: `/src/components/articles/ArticleSearch.tsx`

### 4.2 useCallback for Event Handlers

**Rule**: Wrap event handlers passed to child components in `React.useCallback` to prevent unnecessary re-renders.

**Pattern from codebase**:
```tsx
const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setInputValue(e.target.value);
}, []);

const handleClear = React.useCallback(() => {
  setInputValue('');
  onChange('');
}, [onChange]);
```

**Found in**: `/src/components/search/SearchInput.tsx`

### 4.3 Form Submission Pattern

**Rule**: Form submissions MUST prevent default and handle errors.

**Pattern from codebase**:
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate all fields
  const newErrors: SourceFormErrors = {
    name: validateField('name', formData.name),
    feedURL: validateField('feedURL', formData.feedURL),
  };

  setErrors(newErrors);

  // Check if there are any errors
  if (newErrors.name || newErrors.feedURL) {
    return;
  }

  // Submit the form
  await onSubmit({
    name: formData.name.trim(),
    feedURL: formData.feedURL.trim(),
  });
};
```

**Found in**: `/src/components/sources/SourceForm.tsx`

---

## 5. Custom Hook Patterns

### 5.1 Hook Naming and Structure

**Rule**: Custom hooks MUST:
- Start with `use` prefix
- Have a clear single responsibility
- Include JSDoc documentation
- Define return type interface

**Pattern from codebase**:
```tsx
/**
 * useDebounce Hook
 *
 * Debounces a value by the specified delay.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * ```typescript
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Found in**: `/src/hooks/useDebounce.ts`

### 5.2 Composite Hooks

**Rule**: Complex hooks can compose multiple hooks to aggregate data.

**Pattern from codebase**:
```tsx
/**
 * useDashboardStats Hook
 *
 * Composite React Query hook that combines articles and sources data
 * to provide dashboard statistics.
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  // Fetch recent articles
  const {
    articles: recentArticles,
    pagination,
    isLoading: articlesLoading,
    error: articlesError,
  } = useArticles({ limit: 10 });

  // Fetch sources
  const { sources, isLoading: sourcesLoading, error: sourcesError } = useSources();

  // Combine statistics
  const stats: DashboardStats = {
    totalArticles: pagination.total,
    totalSources: sources.length,
    recentArticles,
  };

  return {
    stats,
    isLoading: articlesLoading || sourcesLoading,
    error: articlesError || sourcesError,
  };
}
```

**Found in**: `/src/hooks/useDashboardStats.ts`

### 5.3 Hook Return Type

**Rule**: Custom hooks SHOULD define and export their return type interface.

**Pattern from codebase**:
```tsx
/**
 * Create source hook return type
 */
interface UseCreateSourceReturn {
  /** Function to create a new source (fire and forget) */
  createSource: (data: CreateSourceInput) => void;
  /** Async function that can be awaited for completion */
  mutateAsync: (data: CreateSourceInput) => Promise<void>;
  /** Whether a create operation is in progress */
  isPending: boolean;
  /** Error from the last create attempt, or null */
  error: Error | null;
  /** Function to reset mutation state */
  reset: () => void;
  /** Whether the mutation was successful */
  isSuccess: boolean;
}

export function useCreateSource(): UseCreateSourceReturn {
  // ... implementation
}
```

**Found in**: `/src/hooks/useCreateSource.ts`

---

## 6. Performance Optimization

### 6.1 React.memo for List Items

**Rule**: Components rendered in lists SHOULD be memoized with `React.memo`.

**Pattern from codebase**:
```tsx
/**
 * ArticleCard Component
 *
 * Displays an article in list view...
 * Memoized to prevent unnecessary re-renders in lists.
 */
export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // ... component logic
});
```

**Found in**: `/src/components/articles/ArticleCard.tsx`, `/src/components/sources/ActiveToggle.tsx`

### 6.2 useMemo for Expensive Calculations

**Rule**: Use `React.useMemo` for expensive computations that depend on specific dependencies.

**Pattern from codebase**:
```tsx
// Memoize page numbers calculation to avoid recalculation on every render
const pageNumbers = React.useMemo(() => {
  const pages: (number | 'ellipsis')[] = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Complex pagination logic...
  }

  return pages;
}, [currentPage, totalPages]);

const showClearButton = React.useMemo(
  () => inputValue.length > 0 && !isLoading,
  [inputValue, isLoading]
);
```

**Found in**: `/src/components/common/Pagination.tsx`, `/src/components/search/SearchInput.tsx`

### 6.3 useEffect Cleanup

**Rule**: `useEffect` hooks that set timers or subscriptions MUST return cleanup functions.

**Pattern from codebase**:
```tsx
/**
 * Auto-dismiss error message after 5 seconds
 */
React.useEffect(() => {
  if (error) {
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }
}, [error]);
```

**Found in**: `/src/components/sources/ActiveToggle.tsx`

---

## 7. Accessibility Patterns

### 7.1 ARIA Attributes

**Rule**: Interactive elements MUST include appropriate ARIA attributes.

**Pattern from codebase**:
```tsx
<Input
  id="email"
  type="email"
  placeholder="you@example.com"
  autoComplete="email"
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-destructive" role="alert">
    {errors.email.message}
  </p>
)}
```

**Found in**: `/src/components/auth/LoginForm.tsx`

### 7.2 Button Labels

**Rule**: Icon-only buttons MUST include `aria-label`.

**Pattern from codebase**:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label="Toggle menu"
  aria-expanded={mobileMenuOpen}
>
  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</Button>
```

**Found in**: `/src/components/layout/Header.tsx`

### 7.3 Live Regions

**Rule**: Dynamic content updates SHOULD use `aria-live` for screen reader announcements.

**Pattern from codebase**:
```tsx
{error && (
  <div
    className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
    role="alert"
    aria-live="assertive"
  >
    {error}
  </div>
)}
```

**Found in**: `/src/components/auth/LoginForm.tsx`

---

## 8. Error Handling

### 8.1 Error State Pattern

**Rule**: Components handling async operations MUST manage error state.

**Pattern from codebase**:
```tsx
export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      if (onLogin) {
        await onLogin(data.email, data.password);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
}
```

**Found in**: `/src/components/auth/LoginForm.tsx`

### 8.2 Optimistic Updates with Rollback

**Rule**: Mutations with optimistic updates MUST implement rollback on error.

**Pattern from codebase**:
```tsx
const handleToggle = async (checked: boolean) => {
  // Store previous state for rollback
  const previousActive = currentActive;

  // Optimistic update
  setCurrentActive(checked);
  setIsToggling(true);
  setError(null);

  try {
    await onToggle(sourceId, checked);
  } catch (err) {
    // Revert to previous state on error
    setCurrentActive(previousActive);
    setError(getErrorMessage(err));
  } finally {
    setIsToggling(false);
  }
};
```

**Found in**: `/src/components/sources/ActiveToggle.tsx`

---

## 9. Loading States

### 9.1 Loading UI Pattern

**Rule**: Components MUST show appropriate loading states for async operations.

**Pattern from codebase**:
```tsx
<Button type="submit" className="w-full" disabled={isLoading}>
  {isLoading ? (
    <>
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Logging in...
    </>
  ) : (
    'Login'
  )}
</Button>
```

**Found in**: `/src/components/auth/LoginForm.tsx`

**Alternative with Lucide icon**:
```tsx
<Button type="submit" disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Adding...
    </>
  ) : (
    'Add Source'
  )}
</Button>
```

**Found in**: `/src/components/sources/SourceForm.tsx`

### 9.2 Skeleton Loading

**Rule**: List views SHOULD use skeleton placeholders during initial load.

**Pattern from codebase**:
```tsx
{isLoading && (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
)}
```

**Found in**: `/src/app/(protected)/sources/page.tsx`

---

## 10. Next.js 15 App Router Patterns

### 10.1 Page Component Structure

**Rule**: Page components MUST be default exports.

**Pattern from codebase**:
```tsx
'use client';

import * as React from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

/**
 * Dashboard Page
 *
 * Protected page that displays user statistics and recent articles.
 * Requires authentication - unauthenticated users will be redirected by middleware.
 */
export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();

  return (
    <div className="container py-8">
      {/* Page content */}
    </div>
  );
}
```

**Found in**: `/src/app/(protected)/dashboard/page.tsx`

### 10.2 Suspense Boundaries for useSearchParams

**Rule**: Components using `useSearchParams` MUST be wrapped in Suspense.

**Pattern from codebase**:
```tsx
function SourcesPageContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

export default function SourcesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SourcesPageContent />
    </Suspense>
  );
}
```

**Found in**: `/src/app/(protected)/sources/page.tsx`

### 10.3 Layout Components

**Rule**: Root layout MUST:
- Include `suppressHydrationWarning` on `<html>` for theme support
- Wrap children with providers (Theme, Query)
- Be a Server Component unless client-side features required

**Pattern from codebase**:
```tsx
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <FeatureGate feature="pwa">
              <PWAInstallPrompt />
              <PWAUpdateNotification />
            </FeatureGate>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Found in**: `/src/app/layout.tsx`

---

## 11. Component Examples Reference

### Example 1: Form Component with Validation
**File**: `/src/components/sources/SourceForm.tsx`
- Client-side validation with custom validators
- Field-level error display
- Loading states on submit
- Error alert component
- Mode-based behavior (create/edit)

### Example 2: Search Component with Debounce
**File**: `/src/components/search/SearchInput.tsx`
- Debounced input using custom hook
- Loading indicator
- Clear button
- Accessibility labels

### Example 3: List Item with Memo
**File**: `/src/components/articles/ArticleCard.tsx`
- React.memo for performance
- Proper semantic HTML
- Hover effects
- Fallback values for missing data

### Example 4: Pagination Component
**File**: `/src/components/common/Pagination.tsx`
- Complex memoized calculations
- Responsive design (desktop/mobile)
- Full accessibility support
- Items per page selector

### Example 5: Custom Query Hook
**File**: `/src/hooks/useArticles.ts`
- TanStack Query integration
- Proper query key structure
- Error handling
- Type-safe return value

### Example 6: Optimistic Update Pattern
**File**: `/src/app/(protected)/sources/page.tsx`
- useMutation with optimistic updates
- Rollback on error
- Cache invalidation
- Loading states

### Example 7: Theme Toggle
**File**: `/src/components/common/ThemeToggle.tsx`
- Hydration-safe rendering
- useEffect for mounted state
- Dropdown menu pattern
- Icon transitions

### Example 8: Feature Gate
**File**: `/src/components/common/FeatureGate.tsx`
- Feature flag conditional rendering
- Error boundary integration
- Fallback support

---

## 12. Enforcement Checklist

Before committing React code, verify:

### Component Structure
- [ ] 'use client' directive only when necessary
- [ ] Imports organized by category (React → libraries → components → hooks → utils → types)
- [ ] JSDoc comments on complex components
- [ ] Props interface named `{Component}Props`

### State Management
- [ ] Local UI state uses `useState`
- [ ] Server data uses TanStack Query hooks
- [ ] Event handlers wrapped in `useCallback` when passed to children
- [ ] Expensive calculations wrapped in `useMemo`

### Performance
- [ ] List item components use `React.memo`
- [ ] No unnecessary re-renders
- [ ] useEffect includes cleanup for timers/subscriptions

### Accessibility
- [ ] Form inputs have associated labels
- [ ] Error messages have `role="alert"`
- [ ] Interactive elements have ARIA labels
- [ ] Live regions for dynamic content

### Error Handling
- [ ] Async operations have error states
- [ ] Optimistic updates have rollback logic
- [ ] User-friendly error messages

### Loading States
- [ ] Loading indicators for async operations
- [ ] Skeleton screens for initial data loads
- [ ] Disabled states during mutations

### Next.js Patterns
- [ ] Page components are default exports
- [ ] useSearchParams wrapped in Suspense
- [ ] Root layout includes provider hierarchy
- [ ] Metadata exported for SEO

### Code Quality
- [ ] TypeScript types are explicit (no `any`)
- [ ] No console.log in production code
- [ ] Functions have single responsibility
- [ ] Component file size reasonable (<300 lines)

---

## 13. Anti-Patterns to Avoid

### DON'T: Fetch data in useEffect
```tsx
// ❌ Bad - manual fetch in useEffect
useEffect(() => {
  fetch('/api/articles').then(res => res.json()).then(setArticles);
}, []);
```

```tsx
// ✅ Good - use TanStack Query
const { articles } = useArticles();
```

### DON'T: Inline event handlers
```tsx
// ❌ Bad - creates new function on every render
<Button onClick={() => handleClick(id)}>Click</Button>
```

```tsx
// ✅ Good - memoized callback
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

<Button onClick={handleClick}>Click</Button>
```

### DON'T: Forget error boundaries
```tsx
// ❌ Bad - feature can crash entire app
<NewFeature />
```

```tsx
// ✅ Good - wrapped in error boundary
<FeatureGate feature="newFeature">
  <NewFeature />
</FeatureGate>
```

### DON'T: Forget cleanup
```tsx
// ❌ Bad - memory leak
useEffect(() => {
  const interval = setInterval(poll, 5000);
}, []);
```

```tsx
// ✅ Good - cleanup function
useEffect(() => {
  const interval = setInterval(poll, 5000);
  return () => clearInterval(interval);
}, []);
```

---

## 14. Key Takeaways

1. **Use 'use client' sparingly** - Default to Server Components
2. **TanStack Query for all server data** - No manual fetch in useEffect
3. **Memoize wisely** - React.memo for list items, useMemo/useCallback for performance
4. **Accessibility is not optional** - ARIA labels, roles, live regions
5. **Handle all states** - Loading, error, empty, success
6. **Type everything** - Explicit TypeScript types, no `any`
7. **Optimize for performance** - Memoization, proper dependency arrays
8. **Document complex logic** - JSDoc comments, code examples
9. **Error handling** - Try/catch, error states, rollback logic
10. **Follow Next.js patterns** - Suspense, layouts, metadata

---

**Last Updated**: 2026-01-05
**Based on**: Real code patterns from catchup-feed-frontend codebase
**Maintained by**: Claude Code EDAF System
