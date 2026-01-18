# TypeScript Coding Standards

**Project**: catchup-feed-frontend
**Language**: TypeScript (strict mode)
**Framework**: Next.js 14+ with React 18+
**Last Updated**: 2026-01-05

## Overview

This document defines TypeScript coding standards for the catchup-feed-frontend project, based on actual code patterns observed in the codebase. All standards are derived from real implementations and are enforced through strict TypeScript configuration.

## TypeScript Configuration

The project uses strict TypeScript settings defined in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

**Key settings:**
- `strict: true` - Enables all strict type-checking options
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noImplicitOverride: true` - Requires explicit `override` keyword

## 1. Naming Conventions

### 1.1 Files and Directories

**Pattern**: camelCase for files, PascalCase for React components

**Examples from codebase:**
```
src/hooks/useArticle.ts              ✓ Hook files use camelCase
src/components/ui/Button.tsx         ✓ Component files use PascalCase
src/lib/api/errors.ts                ✓ Utility files use camelCase
src/utils/formatDate.ts              ✓ Utility functions use camelCase
src/components/auth/LoginForm.tsx    ✓ Component files use PascalCase
```

### 1.2 Variables and Constants

**Pattern**:
- camelCase for variables
- SCREAMING_SNAKE_CASE for true constants
- PascalCase for types/interfaces

**Examples from `/src/lib/constants/pagination.ts`:**
```typescript
// ✓ CORRECT - Constants in SCREAMING_SNAKE_CASE
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const,
  MAX_LIMIT: 100,
  MIN_LIMIT: 10,
} as const;

// ✓ CORRECT - Type derived from constant
export type PageSize = (typeof PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES)[number];
```

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
// ✓ CORRECT - Variables use camelCase
const queryKey = ['article', id];
const debouncedValue = useDebounce(inputValue, debounceDelay);
```

### 1.3 Functions and Methods

**Pattern**: camelCase with descriptive verb prefixes

**Common prefixes observed:**
- `get*` - Fetch data (e.g., `getArticle`, `getAuthToken`)
- `set*` - Update state (e.g., `setInputValue`, `setCsrfToken`)
- `is*` - Boolean checks (e.g., `isAdmin`, `isValidPage`)
- `validate*` - Validation functions (e.g., `validateArticle`)
- `normalize*` - Data transformation (e.g., `normalizeSourceName`)
- `format*` - Formatting functions (e.g., `formatRelativeTime`)
- `handle*` - Event handlers (e.g., `handleSubmit`, `handleClear`)
- `build*` - Construction functions (e.g., `buildQueryString`)
- `extract*` - Data extraction (e.g., `extractPaginationMetadata`)

**Examples from `/src/utils/article.ts`:**
```typescript
// ✓ CORRECT - Clear verb prefixes
export function normalizeSourceName(sourceName: string | null | undefined): string {
  if (!sourceName || typeof sourceName !== 'string' || sourceName.trim() === '') {
    return 'Unknown Source';
  }
  return sourceName.trim();
}

export function validateArticle(article: unknown): article is Article {
  // Type guard implementation
}
```

**Examples from `/src/lib/api/utils/pagination.ts`:**
```typescript
// ✓ CORRECT - Descriptive function names with verb prefixes
export function buildPaginationQuery(page?: number, limit?: number): string { }
export function extractPaginationMetadata(pagination: { ... }) { }
export function validatePaginationParams(params: URLSearchParams) { }
export function isValidPage(page: number, totalPages: number): boolean { }
```

### 1.4 Types and Interfaces

**Pattern**: PascalCase, descriptive names

**Naming guidelines:**
- Use `I` prefix sparingly (only for disambiguation)
- Suffix props interfaces with `Props`
- Suffix response types with `Response`
- Suffix error types with `Error`
- Use descriptive names for generic types

**Examples from `/src/types/api.d.ts`:**
```typescript
// ✓ CORRECT - Clear, descriptive type names
export interface Article {
  id: number;
  source_id: number;
  source_name: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token?: string;
}
```

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
// ✓ CORRECT - Hook return type with descriptive name
interface UseArticleReturn {
  article: Article | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Examples from `/src/components/search/SearchInput.tsx`:**
```typescript
// ✓ CORRECT - Props interface with 'Props' suffix
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceDelay?: number;
  className?: string;
  disabled?: boolean;
}
```

### 1.5 Custom Error Classes

**Pattern**: PascalCase with `Error` suffix

**Examples from `/src/lib/api/errors.ts`:**
```typescript
// ✓ CORRECT - Error classes with Error suffix
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    // ...
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

## 2. Type Safety Rules

### 2.1 Always Prefer Explicit Types

**Rule**: Use explicit type annotations for function parameters and return types

**Examples from `/src/lib/utils/formatDate.ts`:**
```typescript
// ✓ CORRECT - Explicit parameter and return types
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date unavailable';
  }
  // ...
}
```

**Examples from `/src/lib/api/utils/pagination.ts`:**
```typescript
// ✓ CORRECT - Explicit types for all parameters and return values
export function buildPaginationQuery(page?: number, limit?: number): string {
  const params = new URLSearchParams();
  // ...
  return `?${params.toString()}`;
}

export function isValidPage(page: number, totalPages: number): boolean {
  return page > 0 && page <= totalPages;
}
```

### 2.2 Use Type Guards for Runtime Validation

**Rule**: Implement type guards with `is` predicates for runtime type checking

**Examples from `/src/utils/article.ts`:**
```typescript
// ✓ CORRECT - Type guard with 'is' predicate
export function validateArticle(article: unknown): article is Article {
  if (!article || typeof article !== 'object') {
    return false;
  }

  const a = article as Record<string, unknown>;

  return (
    typeof a.id === 'number' &&
    typeof a.source_id === 'number' &&
    typeof a.source_name === 'string' &&
    typeof a.title === 'string' &&
    typeof a.url === 'string' &&
    typeof a.summary === 'string' &&
    typeof a.published_at === 'string' &&
    typeof a.created_at === 'string'
  );
}
```

**Examples from `/src/lib/api/utils/pagination.ts`:**
```typescript
// ✓ CORRECT - Generic type guard with validation
export function validatePaginatedResponse<T>(
  response: unknown,
  endpoint: string
): response is PaginatedResponse<T> {
  if (typeof response !== 'object' || response === null) {
    console.error(`[API] Invalid response from ${endpoint}: Not an object`);
    return false;
  }

  const r = response as Record<string, unknown>;

  if (!Array.isArray(r.data)) {
    console.error(`[API] Invalid response from ${endpoint}: Missing or invalid 'data' array`);
    return false;
  }

  if (typeof r.pagination !== 'object' || r.pagination === null) {
    console.error(
      `[API] Invalid response from ${endpoint}: Missing or invalid 'pagination' object`
    );
    return false;
  }

  const p = r.pagination as Record<string, unknown>;
  const requiredFields = ['page', 'limit', 'total', 'total_pages'];

  for (const field of requiredFields) {
    if (typeof p[field] !== 'number') {
      console.error(`[API] Invalid pagination metadata: Missing or invalid '${field}'`);
      return false;
    }
  }

  return true;
}
```

### 2.3 Null and Undefined Handling

**Rule**: Always handle null/undefined explicitly, use nullish coalescing (`??`)

**Examples from `/src/hooks/useArticles.ts`:**
```typescript
// ✓ CORRECT - Nullish coalescing for default values
const articles = data?.data ?? [];
const pagination = data?.pagination
  ? extractPaginationMetadata(data.pagination)
  : {
      page: query?.page ?? 1,
      limit: query?.limit ?? 10,
      total: 0,
      totalPages: 0,
    };
```

**Examples from `/src/components/articles/ArticleCard.tsx`:**
```typescript
// ✓ CORRECT - Safe field access with fallbacks
const title = article.title?.trim() || 'Untitled Article';
const summary = article.summary?.trim() || '';
const displaySourceName = normalizeSourceName(sourceName ?? article.source_name);
```

### 2.4 Generic Types

**Rule**: Use descriptive generic type parameters, prefer `T` for single generic, use semantic names for multiple

**Examples from `/src/types/api.d.ts`:**
```typescript
// ✓ CORRECT - Generic with clear documentation
/**
 * Generic paginated response wrapper
 * Enables pagination for any entity type
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiErrorResponse;
}
```

**Examples from `/src/hooks/useDebounce.ts`:**
```typescript
// ✓ CORRECT - Generic hook with type parameter
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  // ...
  return debouncedValue;
}
```

### 2.5 Readonly and Const Assertions

**Rule**: Use `readonly` for immutable properties, `as const` for literal types

**Examples from `/src/lib/constants/pagination.ts`:**
```typescript
// ✓ CORRECT - Const assertion for immutable config
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const,
  MAX_LIMIT: 100,
  MIN_LIMIT: 10,
} as const;

// ✓ CORRECT - Derive type from const assertion
export type PageSize = (typeof PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES)[number];
// Type is: 10 | 20 | 50 | 100
```

**Examples from `/src/lib/api/errors.ts`:**
```typescript
// ✓ CORRECT - Readonly properties for immutable data
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  // ...
}
```

### 2.6 Type Inference vs Explicit Types

**Rule**: Use type inference for simple cases, explicit types for public APIs

**Examples from `/src/lib/api/client.ts`:**
```typescript
// ✓ CORRECT - Inference for local variables
const url = `${this.baseUrl}${endpoint}`;
const requestHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...headers,
};

// ✓ CORRECT - Explicit types for public methods
public async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
  return this.request<T>(endpoint, { ...options, method: 'GET' });
}

public async post<T>(
  endpoint: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return this.request<T>(endpoint, { ...options, method: 'POST', body });
}
```

## 3. Error Handling Patterns

### 3.1 Custom Error Classes

**Rule**: Create domain-specific error classes extending `Error`

**Implementation from `/src/lib/api/errors.ts`:**
```typescript
// ✓ CORRECT - Custom error with typed properties
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  public isAuthError(): boolean {
    return this.status === 401;
  }

  public isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
```

**Key patterns:**
1. Set `this.name` to error class name
2. Use `Error.captureStackTrace` for better stack traces
3. Make error properties `readonly`
4. Add convenience methods for error type checking

### 3.2 Try-Catch with Typed Errors

**Rule**: Use type guards in catch blocks, avoid `any`

**Examples from `/src/components/auth/LoginForm.tsx`:**
```typescript
// ✓ CORRECT - Type-safe error handling
const onSubmit = async (data: LoginFormValues) => {
  try {
    setIsLoading(true);
    setError(null);

    if (onLogin) {
      await onLogin(data.email, data.password);
    }

    router.push('/dashboard');
  } catch (err) {
    // ✓ CORRECT - Type guard for Error instances
    setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**Examples from `/src/lib/api/endpoints/articles.ts`:**
```typescript
// ✓ CORRECT - Enhanced error logging with type safety
try {
  const response = await apiClient.get<PaginatedArticlesResponse>(endpoint);
  // ...
} catch (error) {
  console.error(`[API] Error in getArticles`, {
    timestamp: new Date().toISOString(),
    endpoint,
    query,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error;
}
```

### 3.3 Validation with Early Returns

**Rule**: Validate inputs early, return explicit error values

**Examples from `/src/lib/utils/formatDate.ts`:**
```typescript
// ✓ CORRECT - Early validation with explicit return
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date unavailable';
  }

  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  // Check for future dates (allow 1 hour tolerance for timezone issues)
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (date > oneHourFromNow) {
    return 'Scheduled';
  }

  // ... rest of logic
}
```

## 4. Import Organization

### 4.1 Import Order

**Standard order observed in codebase:**

1. External libraries (React, Next.js, third-party)
2. Internal absolute imports (using `@/` alias)
3. Relative imports
4. Type-only imports (if separate)

**Examples from `/src/components/auth/LoginForm.tsx`:**
```typescript
// ✓ CORRECT - Organized import order

// 1. External libraries
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

// 2. Internal UI components (absolute imports)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
```

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
// ✓ CORRECT - Group by category

// External libraries
import { useQuery } from '@tanstack/react-query';

// Internal modules
import { getArticle } from '@/lib/api/endpoints/articles';
import type { Article } from '@/types/api';
```

**Examples from `/src/lib/api/client.ts`:**
```typescript
// ✓ CORRECT - Logical grouping of imports

// Authentication utilities
import {
  getAuthToken,
  clearAllTokens,
  isTokenExpiringSoon,
  getRefreshToken,
} from '@/lib/auth/TokenManager';

// Error classes
import { ApiError, NetworkError, TimeoutError } from '@/lib/api/errors';

// Observability
import { addTracingHeaders, startSpan } from '@/lib/observability';
import { metrics } from '@/lib/observability';

// Configuration
import { appConfig } from '@/config/app.config';
import { logger } from '@/lib/logger';

// Security
import {
  addCsrfTokenToHeaders,
  setCsrfTokenFromResponse,
  clearCsrfToken,
} from '@/lib/security/CsrfTokenManager';
```

### 4.2 Path Aliases

**Rule**: Use `@/` alias for all internal imports

**Examples:**
```typescript
// ✓ CORRECT - Use path alias
import { Button } from '@/components/ui/button';
import { getArticle } from '@/lib/api/endpoints/articles';
import type { Article } from '@/types/api';
import { cn } from '@/lib/utils';

// ✗ INCORRECT - Don't use relative paths for internal imports
import { Button } from '../../../components/ui/button';
import { getArticle } from '../../lib/api/endpoints/articles';
```

### 4.3 Type-Only Imports

**Rule**: Use `type` keyword for type-only imports

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
// ✓ CORRECT - Type-only import
import type { Article } from '@/types/api';
```

**Examples from `/src/components/articles/ArticleCard.tsx`:**
```typescript
// ✓ CORRECT - Separate type import
import type { Article } from '@/types/api';
```

## 5. React and Hooks Patterns

### 5.1 React Hook Naming

**Rule**: Custom hooks must start with `use`, return objects with descriptive properties

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
// ✓ CORRECT - Hook name starts with 'use', returns descriptive object
export function useArticle(id: number): UseArticleReturn {
  const queryKey = ['article', id];

  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getArticle(id);
      return response;
    },
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: true,
    enabled: id > 0,
  });

  const refetch = () => {
    refetchQuery();
  };

  return {
    article: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

**Examples from `/src/hooks/useDebounce.ts`:**
```typescript
// ✓ CORRECT - Generic hook with clear signature
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

### 5.2 Component Props Types

**Rule**: Define props interface separately, export if reusable

**Examples from `/src/components/search/SearchInput.tsx`:**
```typescript
// ✓ CORRECT - Exported props interface with JSDoc
export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is in progress */
  isLoading?: boolean;
  /** Debounce delay in milliseconds (default: 300) */
  debounceDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Disable the input */
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  debounceDelay = 300,
  className,
  disabled = false,
}: SearchInputProps) {
  // ...
}
```

**Examples from `/src/components/ui/button.tsx`:**
```typescript
// ✓ CORRECT - Extend HTML attributes with custom props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
         VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // ...
  }
);
```

### 5.3 React.memo for Performance

**Rule**: Use `React.memo` for list items and frequently re-rendered components

**Examples from `/src/components/articles/ArticleCard.tsx`:**
```typescript
// ✓ CORRECT - Memoized component with display name
export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // Component implementation
});
```

### 5.4 useCallback and useMemo

**Rule**: Use `useCallback` for event handlers, `useMemo` for expensive computations

**Examples from `/src/components/search/SearchInput.tsx`:**
```typescript
// ✓ CORRECT - useCallback for event handlers
const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setInputValue(e.target.value);
}, []);

const handleClear = React.useCallback(() => {
  setInputValue('');
  onChange('');
}, [onChange]);

// ✓ CORRECT - useMemo for computed values
const showClearButton = React.useMemo(
  () => inputValue.length > 0 && !isLoading,
  [inputValue, isLoading]
);
```

**Examples from `/src/components/common/Pagination.tsx`:**
```typescript
// ✓ CORRECT - useMemo for expensive calculations
const pageNumbers = React.useMemo(() => {
  const pages: (number | 'ellipsis')[] = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Complex pagination logic
    // ...
  }

  return pages;
}, [currentPage, totalPages]);

const itemsShownText = React.useMemo(() => {
  if (!totalItems || !itemsPerPage) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return `Showing ${start}-${end} of ${totalItems} items`;
}, [currentPage, totalItems, itemsPerPage]);
```

## 6. Documentation Standards

### 6.1 JSDoc Comments

**Rule**: Add JSDoc comments for all exported functions, types, and components

**Examples from `/src/hooks/useArticle.ts`:**
```typescript
/**
 * Custom hook for fetching a single article by ID
 *
 * @param id - Article ID (number)
 * @returns Article data, loading state, error, and refetch function
 *
 * @example
 * ```typescript
 * function ArticleDetail({ id }: { id: number }) {
 *   const { article, isLoading, error, refetch } = useArticle(id);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!article) return <div>Article not found</div>;
 *
 *   return (
 *     <div>
 *       <h1>{article.title}</h1>
 *       <p>{article.summary}</p>
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArticle(id: number): UseArticleReturn {
  // ...
}
```

**Examples from `/src/lib/api/utils/pagination.ts`:**
```typescript
/**
 * Build pagination query string from parameters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Query string with validated pagination parameters
 */
export function buildPaginationQuery(page?: number, limit?: number): string {
  // ...
}

/**
 * Validate paginated response structure
 * @template T - The type of items in the data array
 * @param response - Response object to validate
 * @param endpoint - Endpoint name for error logging
 * @returns True if response has valid paginated structure
 */
export function validatePaginatedResponse<T>(
  response: unknown,
  endpoint: string
): response is PaginatedResponse<T> {
  // ...
}
```

### 6.2 File Headers

**Rule**: Add descriptive header comments for all modules

**Examples from `/src/lib/api/errors.ts`:**
```typescript
/**
 * API Error Handling
 *
 * Custom error classes for API request failures.
 */
```

**Examples from `/src/hooks/useDebounce.ts`:**
```typescript
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
```

### 6.3 Inline Comments

**Rule**: Add comments for complex logic, not obvious code

**Examples from `/src/lib/api/client.ts`:**
```typescript
// Prevent concurrent refresh requests
if (this.refreshPromise) {
  logger.debug('Token refresh already in progress, waiting...');
  await this.refreshPromise;
  return;
}

// Maintains proper stack trace for where our error was thrown (only available on V8)
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, ApiError);
}

// Add jitter (±10%) to prevent thundering herd
const jitter = delay * 0.1 * (Math.random() * 2 - 1);
```

## 7. Testing Standards

### 7.1 Test File Naming

**Rule**: Co-locate tests with `.test.ts` or `.test.tsx` suffix

**Examples from codebase:**
```
src/hooks/useDebounce.ts
src/hooks/useDebounce.test.ts        ✓ Test file next to source

src/lib/utils/formatDate.ts
src/lib/utils/formatDate.test.ts     ✓ Test file next to source
```

### 7.2 Test Structure

**Rule**: Use Vitest with describe/it blocks, descriptive test names

**Examples from `/src/hooks/useDebounce.test.ts`:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes by specified delay', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      expect(result.current).toBe('initial');
      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | null>(value, 300),
        { initialProps: { value: 'initial' as string | null } }
      );

      rerender({ value: null });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe(null);
    });
  });
});
```

**Key patterns:**
1. Group tests by functionality using nested `describe` blocks
2. Use descriptive test names starting with "should"
3. Setup/teardown with `beforeEach`/`afterEach`
4. Use `act()` for async state updates

### 7.3 Type-Safe Mocking

**Rule**: Mock with proper types, avoid `any`

**Examples from test files:**
```typescript
// ✓ CORRECT - Typed mock
const mockArticle: Article = {
  id: 1,
  source_id: 1,
  source_name: 'Test Source',
  title: 'Test Article',
  url: 'https://example.com/article',
  summary: 'Test summary',
  published_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};
```

## 8. Enforcement Checklist

Use this checklist for code reviews and quality gates:

### Naming
- [ ] Files use camelCase (utilities) or PascalCase (components)
- [ ] Variables and functions use camelCase
- [ ] Constants use SCREAMING_SNAKE_CASE
- [ ] Types/interfaces use PascalCase
- [ ] Functions have descriptive verb prefixes (get, set, is, validate, etc.)
- [ ] Component props interfaces end with `Props`

### Type Safety
- [ ] All function parameters have explicit types
- [ ] All function return types are explicit
- [ ] No use of `any` (use `unknown` instead)
- [ ] Type guards use `is` predicates
- [ ] Null/undefined handled explicitly with `??` or optional chaining
- [ ] Generic types use descriptive names
- [ ] Readonly used for immutable properties
- [ ] Const assertions used for literal types

### Error Handling
- [ ] Custom error classes extend `Error`
- [ ] Error classes set `this.name` property
- [ ] Try-catch blocks use type guards (avoid `any`)
- [ ] Validation uses early returns
- [ ] Error messages are descriptive

### Imports
- [ ] Imports organized by category (external, internal, types)
- [ ] Use `@/` alias for internal imports
- [ ] Type-only imports use `type` keyword
- [ ] No circular dependencies

### React/Hooks
- [ ] Custom hooks start with `use`
- [ ] Props interfaces documented with JSDoc
- [ ] Event handlers use `useCallback`
- [ ] Expensive computations use `useMemo`
- [ ] List items use `React.memo`
- [ ] Components have display names

### Documentation
- [ ] All exported functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] File headers describe module purpose
- [ ] Examples provided for public APIs
- [ ] @param and @returns tags used

### Testing
- [ ] Test files co-located with source (`.test.ts`)
- [ ] Tests grouped by functionality (`describe`)
- [ ] Test names are descriptive ("should...")
- [ ] Mocks are properly typed
- [ ] Setup/teardown use `beforeEach`/`afterEach`

### Performance
- [ ] React.memo used for frequently re-rendered components
- [ ] useCallback used for event handlers
- [ ] useMemo used for expensive calculations
- [ ] Dependencies arrays are minimal and accurate

## 9. Common Patterns Reference

### Pattern: API Client Method
```typescript
/**
 * Fetch a single article by ID
 *
 * @param id - Article ID (number)
 * @returns Promise resolving to article response
 * @throws {ApiError} When the article is not found or request fails
 */
export async function getArticle(id: number): Promise<ArticleResponse> {
  const endpoint = `/articles/${id}`;
  const article = await apiClient.get<ArticleResponse>(endpoint);

  if (!validateArticle(article)) {
    throw new Error('Invalid article response');
  }

  return article;
}
```

### Pattern: Custom Hook
```typescript
interface UseDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useData<T>(id: number): UseDataReturn<T> {
  const queryKey = ['data', id];

  const { data, isLoading, error, refetch: refetchQuery } = useQuery({
    queryKey,
    queryFn: async () => fetchData(id),
    staleTime: 60000,
    enabled: id > 0,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch: () => refetchQuery(),
  };
}
```

### Pattern: Type Guard
```typescript
export function isType<T>(value: unknown, validator: (v: any) => boolean): value is T {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return validator(value);
}
```

### Pattern: Error Class
```typescript
export class CustomError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}
```

## 10. Anti-Patterns to Avoid

### ✗ AVOID: Using `any`
```typescript
// ✗ INCORRECT
function processData(data: any) {
  return data.value;
}

// ✓ CORRECT
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    const obj = data as { value: unknown };
    if (typeof obj.value === 'string') {
      return obj.value;
    }
  }
  throw new Error('Invalid data structure');
}
```

### ✗ AVOID: Implicit return types
```typescript
// ✗ INCORRECT
function fetchData(id: number) {
  return apiClient.get(`/data/${id}`);
}

// ✓ CORRECT
function fetchData(id: number): Promise<DataResponse> {
  return apiClient.get<DataResponse>(`/data/${id}`);
}
```

### ✗ AVOID: Relative imports for internal modules
```typescript
// ✗ INCORRECT
import { Button } from '../../../components/ui/button';

// ✓ CORRECT
import { Button } from '@/components/ui/button';
```

### ✗ AVOID: Missing null checks
```typescript
// ✗ INCORRECT
function getTitle(article: Article) {
  return article.title.toUpperCase();
}

// ✓ CORRECT
function getTitle(article: Article): string {
  return article.title?.toUpperCase() ?? 'Untitled';
}
```

### ✗ AVOID: Ignoring errors in catch blocks
```typescript
// ✗ INCORRECT
try {
  await fetchData();
} catch (e) {
  // Silent failure
}

// ✓ CORRECT
try {
  await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error instanceof Error ? error.message : 'Unknown error');
  throw error;
}
```

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app/
- Project tsconfig.json: `/Users/yujitsuchiya/catchup-feed-frontend/tsconfig.json`

---

**File Paths Referenced:**
- `/src/lib/api/errors.ts` - Error classes
- `/src/lib/api/client.ts` - API client patterns
- `/src/lib/api/utils/pagination.ts` - Utility functions
- `/src/lib/constants/pagination.ts` - Constants
- `/src/hooks/useArticle.ts` - Custom hooks
- `/src/hooks/useDebounce.ts` - Generic hooks
- `/src/components/auth/LoginForm.tsx` - Form components
- `/src/components/search/SearchInput.tsx` - Reusable components
- `/src/components/articles/ArticleCard.tsx` - Memoized components
- `/src/types/api.d.ts` - Type definitions
- `/src/utils/article.ts` - Type guards
