# Development Guidelines

> Coding standards, conventions, and best practices for catchup-feed-frontend

**Project**: catchup-feed-frontend
**Stack**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS 4
**Last Updated**: 2026-01-10

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Project Structure](#project-structure)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Code Style & Formatting](#code-style--formatting)
5. [React & Next.js Patterns](#react--nextjs-patterns)
6. [Component Guidelines](#component-guidelines)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Error Handling](#error-handling)
10. [Testing Standards](#testing-standards)
11. [Accessibility](#accessibility)
12. [Performance](#performance)
13. [Security](#security)
14. [Git Workflow](#git-workflow)

---

## Tech Stack Overview

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router and Turbopack |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **TanStack Query** | 5.90.11 | Server state management |
| **React Hook Form** | 7.67.0 | Form handling |
| **Zod** | 4.1.13 | Schema validation |

### Development Tools

- **Vitest** (4.0.14) - Unit testing framework
- **Testing Library** (16.3.0) - Component testing utilities
- **ESLint** (8.x) - Code linting
- **Prettier** (3.7.2) - Code formatting
- **Storybook** (8.5.0) - Component development

### UI Components

- **shadcn/ui** - Accessible, customizable components built on Radix UI
- **Radix UI** - Headless accessible components
- **Lucide React** (0.555.0) - Icon library
- **class-variance-authority** - Variant-based styling

### PWA & Service Worker

- **@serwist/next** (9.x) - Next.js PWA integration (replaces next-pwa)
- **serwist** (9.x) - Modern service worker library with Workbox-compatible API

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group (login)
│   ├── (protected)/            # Protected route group
│   │   ├── articles/           # Article pages
│   │   ├── dashboard/          # Dashboard page
│   │   └── sources/            # Source pages
│   ├── (legal)/                # Legal pages (privacy, terms)
│   ├── api/                    # API routes (Next.js)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── error.tsx               # Error boundary
│   └── not-found.tsx           # 404 page
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── articles/               # Article-specific components
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard components
│   ├── sources/                # Source management components
│   │   ├── SourceForm.tsx      # Reusable form for create/edit
│   │   ├── EditSourceDialog.tsx # Edit source dialog
│   │   ├── ActiveToggle.tsx    # Source active/inactive toggle
│   │   └── StatusBadge.tsx     # Source status indicator
│   ├── search/                 # Search components
│   ├── common/                 # Shared components
│   ├── layout/                 # Layout components (Header, Footer)
│   └── errors/                 # Error boundary components
├── hooks/                      # Custom React hooks
│   ├── useArticles.ts          # Article fetching
│   ├── useAuth.ts              # Authentication
│   ├── useDebounce.ts          # Debouncing
│   ├── useCreateSource.ts      # Create source mutation
│   ├── useUpdateSource.ts      # Update source mutation
│   └── ...
├── lib/
│   ├── api/                    # API client & endpoints
│   │   ├── client.ts           # HTTP client
│   │   ├── endpoints/          # API endpoint functions
│   │   ├── errors.ts           # API error classes
│   │   └── utils/              # API utilities
│   ├── auth/                   # Authentication utilities
│   │   ├── TokenManager.ts     # JWT token management
│   │   ├── token.ts            # Token utilities
│   │   └── role.ts             # Role-based access control
│   ├── security/               # Security utilities
│   │   ├── csrf.ts             # CSRF protection
│   │   └── CsrfTokenManager.ts # CSRF token manager
│   ├── utils/                  # Utility functions
│   │   ├── formatDate.ts       # Date formatting
│   │   └── truncate.ts         # Text truncation
│   ├── observability/          # Monitoring & tracing
│   ├── constants/              # Constants
│   └── logger.ts               # Logging utility
├── config/                     # Application configuration
│   ├── app.config.ts           # App-wide settings
│   ├── security.config.ts      # Security settings
│   ├── pwa.config.ts           # PWA configuration
│   └── sourceConfig.ts         # Source management configuration
├── providers/                  # React context providers
│   ├── QueryProvider.tsx       # TanStack Query provider
│   └── ThemeProvider.tsx       # Theme provider
├── types/                      # TypeScript type definitions
│   ├── api.d.ts                # API types (auto-generated)
│   └── serwist.d.ts            # Serwist PWA types
├── utils/                      # Utility functions
│   ├── article.ts              # Article utilities
│   ├── validation/             # Validation utilities
│   │   └── sourceValidation.ts # Source form validation
│   ├── sourceTransformers.ts   # Source data transformers
│   └── errorMessages.ts        # Error message utilities
├── proxy.ts                    # Next.js 16 proxy (renamed from middleware)
└── sw.ts                       # Serwist service worker (PWA)
```

### Directory Organization Principles

1. **Colocation**: Keep related files close (e.g., `Component.tsx` + `Component.test.tsx` + `Component.stories.tsx`)
2. **Domain-based**: Group by feature/domain (articles, auth, sources)
3. **Shared**: Common/reusable code in `common/` or `lib/`
4. **App Router**: Use route groups `(protected)`, `(auth)` for layout isolation

---

## TypeScript Guidelines

### Strict Mode Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Safety Rules

#### 1. Always Define Types Explicitly

```typescript
// ✅ Good
interface Article {
  id: number;
  title: string;
  summary: string;
}

function getArticle(id: number): Article {
  // ...
}

// ❌ Bad - implicit any
function getArticle(id) {
  // ...
}
```

#### 2. Use Type Guards for Runtime Safety

```typescript
// ✅ Good - Safe field access with type guards
const title = article.title?.trim() || 'Untitled Article';

// ✅ Good - Type guard function
function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// ❌ Bad - Unsafe access
const title = article.title.trim();
```

#### 3. Prefer Interface over Type for Objects

```typescript
// ✅ Good - Interface for object shapes
interface ArticleCardProps {
  article: Article;
  sourceName?: string;
  className?: string;
}

// ⚠️ OK - Type for unions/intersections
type ArticleStatus = 'draft' | 'published' | 'archived';
```

#### 4. Use Generics for Reusable Code

```typescript
// ✅ Good - Generic API client
public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // ...
}

// Usage
const article = await apiClient.get<Article>('/articles/1');
```

#### 5. Avoid Type Assertions (use Type Guards)

```typescript
// ✅ Good - Type guard
if (error instanceof ApiError) {
  console.error(error.status, error.message);
}

// ❌ Bad - Type assertion
const apiError = error as ApiError;
```

### Import Aliases

Always use `@/` alias for absolute imports:

```typescript
// ✅ Good
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import type { Article } from '@/types/api';

// ❌ Bad - Relative imports
import { apiClient } from '../../../lib/api/client';
```

---

## Code Style & Formatting

### Prettier Configuration

```json
// .prettierrc
{
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "semi": true,
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

### Naming Conventions

#### Files

- **Components**: PascalCase (e.g., `ArticleCard.tsx`, `ErrorMessage.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useArticles.ts`, `useDebounce.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`, `truncate.ts`)
- **Types**: camelCase with `.d.ts` suffix (e.g., `api.d.ts`)
- **Tests**: Same as source + `.test.tsx` (e.g., `ArticleCard.test.tsx`)
- **Stories**: Same as source + `.stories.tsx` (e.g., `ArticleCard.stories.tsx`)

#### Variables & Functions

```typescript
// ✅ Good
const articleCount = 10;
const isLoading = false;
const hasActiveFilters = true;

function fetchArticles() { /* ... */ }
function formatRelativeTime(date: string) { /* ... */ }

// ❌ Bad
const ArticleCount = 10;
const Loading = false;
const fetch_articles = () => {};
```

#### Constants

```typescript
// ✅ Good - SCREAMING_SNAKE_CASE for true constants
const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  AVAILABLE_PAGE_SIZES: [10, 25, 50, 100],
} as const;

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
```

#### Components & Types

```typescript
// ✅ Good - PascalCase
interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // ...
};
```

### Code Organization

#### Import Order

```typescript
// 1. External dependencies
import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

// 2. Internal components & utilities
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/formatDate';

// 3. Types
import type { Article } from '@/types/api';
```

#### Function Order in Components

```typescript
export function MyComponent() {
  // 1. Hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, isLoading } = useQuery(...);

  // 2. State
  const [searchState, setSearchState] = React.useState(...);

  // 3. Derived values
  const isSearchMode = hasActiveFilters(searchState);

  // 4. Effects
  React.useEffect(() => {
    // ...
  }, [deps]);

  // 5. Event handlers
  const handlePageChange = (newPage: number) => {
    // ...
  };

  // 6. Render
  return (
    // JSX
  );
}
```

---

## React & Next.js Patterns

### Server vs. Client Components

#### Server Components (Default)

```typescript
// app/(protected)/articles/[id]/page.tsx
// No 'use client' directive = Server Component

export default async function ArticlePage({ params }: { params: { id: string } }) {
  // Can fetch data directly on server
  const article = await fetch(`${API_URL}/articles/${params.id}`);

  return <ArticleDetail article={article} />;
}
```

#### Client Components (Interactive)

```typescript
// components/articles/ArticleSearch.tsx
'use client';  // Must be at the top

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ArticleSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Can use hooks, event handlers, browser APIs
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### Route Groups & Layouts

```typescript
// app/(protected)/layout.tsx
// Shared layout for protected routes

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// ✅ Good - Wrap async components in Suspense
export default function ArticlesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ArticlesPageContent />
    </Suspense>
  );
}
```

### Metadata API

```typescript
// app/(protected)/articles/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles | Catchup Feed',
  description: 'Browse all articles from your sources',
};
```

---

## Component Guidelines

### Component Structure

```typescript
/**
 * ArticleCard Component
 *
 * Displays an article in list view with:
 * - Title (bold, larger font)
 * - Summary (2-line truncated, muted)
 * - Metadata: Source badge, Published date
 * - Hover effects for interactivity
 *
 * Links to article detail page (/articles/[id])
 *
 * Memoized to prevent unnecessary re-renders in lists.
 *
 * @example
 * <ArticleCard article={article} sourceName="Tech Blog" />
 */
export const ArticleCard = React.memo(function ArticleCard({
  article,
  sourceName,
  className,
}: ArticleCardProps) {
  // Safe field access with fallbacks
  const title = article.title?.trim() || 'Untitled Article';
  const summary = article.summary?.trim() || '';

  return (
    <Link
      href={`/articles/${article.id}`}
      className={cn(/* ... */)}
      aria-label={`Article: ${title}`}
    >
      {/* Component content */}
    </Link>
  );
});
```

### Reusable Component Patterns

#### SourceForm: Reusable Form Component

The `SourceForm` component demonstrates best practices for creating reusable form components:

**Key Features**:
```typescript
interface SourceFormProps {
  mode: 'create' | 'edit';        // Form mode determines behavior
  initialData?: SourceFormData;   // Pre-populate for edit mode
  onSubmit: (data: SourceFormData) => Promise<void>;
  isLoading: boolean;             // Disable during submission
  error: Error | null;            // Display API errors
  onCancel: () => void;           // Handle cancellation
}
```

**Design Patterns**:
- **Mode-based behavior**: Single component handles both create and edit
- **Controlled inputs**: Form state managed via React useState
- **Real-time validation**: Validates on blur, shows errors immediately
- **Trimming**: Automatically trims whitespace before submission
- **Accessibility**: ARIA labels, error descriptions, required attributes

**Usage Example**:
```typescript
// Create mode
<SourceForm
  mode="create"
  onSubmit={async (data) => await createSource(data)}
  isLoading={isPending}
  error={error}
  onCancel={() => setIsOpen(false)}
/>

// Edit mode
<SourceForm
  mode="edit"
  initialData={{ name: 'Tech Blog', feedURL: 'https://example.com/feed' }}
  onSubmit={async (data) => await updateSource(sourceId, data)}
  isLoading={isPending}
  error={error}
  onCancel={() => setIsOpen(false)}
/>
```

### Component Best Practices

#### 1. Use TypeScript for Props

```typescript
interface ArticleCardProps {
  article: Article;
  sourceName?: string;
  className?: string;
}
```

#### 2. Memoize List Components

```typescript
// ✅ Good - Prevents re-renders in lists
export const ArticleCard = React.memo(function ArticleCard(props) {
  // ...
});

// Add display name for debugging
ArticleCard.displayName = 'ArticleCard';
```

#### 3. Safe Field Access

```typescript
// ✅ Good - Defensive programming
const title = article.title?.trim() || 'Untitled Article';
const summary = article.summary?.trim() || '';

// ❌ Bad - Can throw errors
const title = article.title.trim();
```

#### 4. Use Semantic HTML

```typescript
// ✅ Good - Semantic elements
<article className="...">
  <h2>{title}</h2>
  <p>{summary}</p>
  <time dateTime={publishedDate}>{formatRelativeTime(publishedDate)}</time>
</article>

// ❌ Bad - Div soup
<div>
  <div>{title}</div>
  <div>{summary}</div>
</div>
```

#### 5. Accessibility First

```typescript
// ✅ Good - Accessible link
<Link
  href={`/articles/${article.id}`}
  aria-label={`Article: ${title}`}
  className={cn(
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2'
  )}
>
  {/* content */}
</Link>
```

### Styling with Tailwind

#### Use `cn()` Utility for Class Merging

```typescript
import { cn } from '@/lib/utils';

// ✅ Good - Merge classes properly
<div className={cn(
  'base-class',
  'hover:border-primary/50',
  variant === 'primary' && 'bg-primary',
  className  // Allow prop override
)} />
```

#### Component Variants with CVA

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

---

## State Management

### TanStack Query for Server State

```typescript
/**
 * Custom hook for fetching articles
 *
 * Uses React Query for cache management with 60s stale time.
 */
export function useArticles(
  query?: ArticlesQuery,
  options?: UseArticlesOptions
): UseArticlesReturn {
  const queryKey = ['articles', query ?? {}];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getArticles(query);
      return response;
    },
    staleTime: 60000, // 60 seconds
    retry: 1,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });

  return {
    articles: data?.data ?? [],
    pagination: extractPaginationMetadata(data?.pagination),
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

### React useState for UI State

```typescript
// ✅ Good - Local UI state
const [searchState, setSearchState] = React.useState<ArticleSearchState>({
  keyword: '',
  sourceId: null,
  fromDate: null,
  toDate: null,
});

// ✅ Good - Derived state
const isSearchMode = hasActiveFilters(searchState);
```

### URL as State Source

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

function ArticlesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ Good - Read state from URL
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const keyword = searchParams.get('keyword') || '';

  // ✅ Good - Update URL to change state
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/articles?${params.toString()}`);
  };
}
```

---

## API Integration

### API Client Architecture

```typescript
// lib/api/client.ts
class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  /**
   * Make an HTTP request to the API
   * Automatically injects JWT tokens and handles authentication errors
   */
  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, requiresAuth = true } = options;

    // Ensure token is valid before making request
    await this.ensureValidToken(requiresAuth);

    // Construct full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add Authorization header if authentication is required
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add CSRF token for state-changing requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      requestHeaders = addCsrfTokenToHeaders(requestHeaders);
    }

    // Make request with timeout and retry logic
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle authentication errors
    if (response.status === 401) {
      clearAllTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('Authentication required', 401);
    }

    // Handle error responses
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new ApiError(errorData.message, response.status, errorData.details);
    }

    // Parse successful response
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### Endpoint Functions

```typescript
// lib/api/endpoints/articles.ts
import { apiClient } from '@/lib/api/client';
import type { Article, ArticlesQuery, PaginatedResponse } from '@/types/api';

/**
 * Fetch paginated list of articles
 */
export async function getArticles(
  query?: ArticlesQuery
): Promise<PaginatedResponse<Article>> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', query.page.toString());
  if (query?.limit) params.set('limit', query.limit.toString());
  if (query?.source_id) params.set('source_id', query.source_id.toString());

  const endpoint = `/articles?${params.toString()}`;
  return apiClient.get<PaginatedResponse<Article>>(endpoint);
}

/**
 * Fetch single article by ID
 */
export async function getArticle(id: number): Promise<Article> {
  return apiClient.get<Article>(`/articles/${id}`);
}
```

### Error Classes

```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

---

## Error Handling

### Error Boundaries

```typescript
// components/errors/FeatureErrorBoundary.tsx
'use client';

import React from 'react';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class FeatureErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorMessage error="Something went wrong" />;
    }

    return this.props.children;
  }
}
```

### Error UI Components

```typescript
// ✅ Good - User-friendly error messages
<ErrorMessage error={error} onRetry={refetch} />

// ✅ Good - Empty state for no results
<EmptyState
  title="No articles found"
  description="Try adjusting your search keywords or filters."
  icon={<Search className="h-12 w-12" />}
/>
```

### Try-Catch in Async Functions

```typescript
// ✅ Good - Handle errors gracefully
async function handleLogin(email: string, password: string) {
  try {
    const response = await login({ email, password });
    setAuthToken(response.token);
    router.push('/dashboard');
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }
}
```

---

## Testing Standards

### Test File Organization

```typescript
// ArticleCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from './ArticleCard';
import { createMockArticle } from '@/__test__/factories/articleFactory';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render article title', () => {
      const article = createMockArticle({ title: 'My Article Title' });
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('heading', { level: 2, name: 'My Article Title' }))
        .toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing title gracefully', () => {
      const article = createMockArticle({ title: '' });
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('heading', { level: 2, name: 'Untitled Article' }))
        .toBeInTheDocument();
    });
  });
});
```

### Test Factory Pattern

```typescript
// __test__/factories/articleFactory.ts
/**
 * Creates a single mock article with optional overrides
 */
export function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    source_id: 1,
    source_name: 'Tech Blog',
    title: 'Test Article Title',
    url: 'https://example.com/article',
    summary: 'This is a test article summary.',
    published_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates multiple mock articles with sequential IDs
 */
export function createMockArticles(count: number): Article[] {
  return Array.from({ length: count }, (_, index) =>
    createMockArticle({
      id: index + 1,
      title: `Test Article ${index + 1}`,
    })
  );
}
```

### Testing Best Practices

#### 1. Test User Behavior, Not Implementation

```typescript
// ✅ Good - Test from user perspective
it('should navigate to article detail on click', async () => {
  const article = createMockArticle({ id: 42 });
  render(<ArticleCard article={article} />);

  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('href', '/articles/42');
});

// ❌ Bad - Testing implementation details
it('should call onClick handler', () => {
  const onClick = vi.fn();
  render(<ArticleCard onClick={onClick} />);
  // ...
});
```

#### 2. Use Semantic Queries

```typescript
// ✅ Good - Accessible queries
screen.getByRole('heading', { level: 2 });
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email');
screen.getByText('No articles found');

// ❌ Bad - Fragile queries
screen.getByClassName('article-title');
screen.getByTestId('submit-button');
```

#### 3. Test Accessibility

```typescript
it('should have semantic HTML structure', () => {
  render(<ArticleCard article={article} />);

  expect(screen.getByRole('article')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  expect(screen.getByRole('time')).toBeInTheDocument();
});

it('should have proper ARIA labels', () => {
  const article = createMockArticle({ title: 'Test Article' });
  render(<ArticleCard article={article} />);

  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('aria-label', 'Article: Test Article');
});
```

#### 4. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle null published_at', () => {
    const article = createMockArticle();
    article.published_at = null as unknown as string;
    render(<ArticleCard article={article} />);

    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('should handle special characters in title', () => {
    const article = createMockArticle({ title: '<script>alert("xss")</script>' });
    render(<ArticleCard article={article} />);

    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('<script>alert("xss")</script>');
  });
});
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '.next/',
        '**/generated/**',
        '**/ui/**', // shadcn components
      ],
    },
  },
});
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### 1. Semantic HTML

```typescript
// ✅ Good
<article>
  <h2>{title}</h2>
  <p>{summary}</p>
  <time dateTime={publishedDate}>{formatRelativeTime(publishedDate)}</time>
</article>

// ❌ Bad
<div>
  <div className="title">{title}</div>
  <div className="summary">{summary}</div>
</div>
```

#### 2. ARIA Labels

```typescript
// ✅ Good - Descriptive labels
<Link
  href={`/articles/${article.id}`}
  aria-label={`Article: ${title}`}
>
  {/* content */}
</Link>

<button onClick={handleSubmit} aria-label="Search articles">
  <Search className="h-4 w-4" />
</button>
```

#### 3. Keyboard Navigation

```typescript
// ✅ Good - Focus management
<Link
  href={`/articles/${article.id}`}
  className={cn(
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2'
  )}
>
  {/* content */}
</Link>
```

#### 4. Color Contrast

Use Tailwind's semantic color tokens that ensure proper contrast:

```typescript
// ✅ Good - Semantic colors with proper contrast
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>
<Button variant="default">High contrast button</Button>

// ❌ Bad - Low contrast
<p className="text-gray-400">Hard to read</p>
```

---

## Performance

### Code Splitting

```typescript
// ✅ Good - Dynamic imports for large components
import dynamic from 'next/dynamic';

const StoryblockEditor = dynamic(() => import('@/components/StoryblockEditor'), {
  ssr: false,
  loading: () => <Skeleton className="h-96" />,
});
```

### Memoization

```typescript
// ✅ Good - Memoize expensive list items
export const ArticleCard = React.memo(function ArticleCard(props) {
  // Component will only re-render if props change
});

// ✅ Good - Memoize expensive calculations
const sortedArticles = React.useMemo(() => {
  return articles.sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}, [articles]);
```

### Image Optimization

```typescript
// ✅ Good - Use Next.js Image component
import Image from 'next/image';

<Image
  src="/article-thumbnail.jpg"
  alt="Article thumbnail"
  width={400}
  height={300}
  loading="lazy"
/>
```

### Bundle Size

```bash
# Analyze bundle size
npm run analyze
npm run analyze:browser
npm run analyze:server
```

---

## Security

### CSRF Protection

```typescript
// proxy.ts - Validates CSRF tokens for state-changing requests (renamed from middleware.ts in Next.js 16)
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export async function proxy(request: NextRequest) {
  // Add CSRF token to response headers
  if (request.method === 'GET') {
    const response = NextResponse.next();
    setCsrfToken(response);
    return response;
  }

  // Validate CSRF token for state-changing requests
  if (STATE_CHANGING_METHODS.includes(request.method)) {
    const isValid = validateCsrfToken(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }
}
```

### XSS Prevention

```typescript
// ✅ Good - React escapes by default
<p>{userInput}</p>

// ⚠️ Dangerous - Only use with sanitized HTML
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### Sensitive Data Handling

```typescript
// ✅ Good - Never log sensitive data
logger.info('User logged in', { userId: user.id });

// ❌ Bad - Logging sensitive data
logger.info('User logged in', { password: user.password });
```

### Environment Variables

```typescript
// ✅ Good - Public env vars only in client
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ Bad - Server secrets exposed to client
const apiKey = process.env.API_SECRET_KEY; // Don't use in client components!
```

---

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:      New feature
fix:       Bug fix
docs:      Documentation changes
style:     Code style (formatting, missing semi-colons, etc)
refactor:  Code refactoring (no functional changes)
perf:      Performance improvements
test:      Adding or updating tests
chore:     Maintenance tasks
ci:        CI/CD changes

# Examples
feat(articles): add article bookmarking
fix(auth): resolve authentication redirect loop
docs: update development guidelines
test(components): add tests for ArticleCard edge cases
refactor(api): simplify error handling logic
```

### Recent Commit Examples (from project)

```bash
cc15fba Merge pull request #64 from Tsuchiya2/feature/csrf-protection
4ab7f58 fix: address CodeRabbit review feedback
f5c3d0a fix(tests): resolve lint and TypeScript errors in CSRF test files
ef062ea feat(security): implement CSRF protection with Double Submit Cookie pattern
43aa94b fix(lint): resolve Prettier and ESLint formatting issues
11a0d5e fix(test): resolve CI test and type check failures
f5f905f feat: implement project improvements phase 1-3
```

### Pull Request Workflow

1. **Create feature branch** from `main`
   ```bash
   git checkout -b feature/article-bookmarking
   ```

2. **Make changes** following conventions in this guide

3. **Run quality checks** before committing
   ```bash
   npm run lint          # Check linting
   npm run format        # Format code
   npm test              # Run tests
   npx tsc --noEmit      # Type check
   ```

4. **Commit with conventional format**
   ```bash
   git add .
   git commit -m "feat(articles): add bookmark button to article cards"
   ```

5. **Push to GitHub**
   ```bash
   git push origin feature/article-bookmarking
   ```

6. **Create Pull Request** with description:
   - What changed
   - Why it changed
   - How to test
   - Screenshots (if UI changes)

7. **CI checks must pass**:
   - ✅ Lint (ESLint + Prettier)
   - ✅ Type check (TypeScript)
   - ✅ Tests (Vitest)
   - ✅ Build (Next.js)

8. **Code review** and approval

9. **Merge to main** (squash and merge)

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    - npm run lint
    - npm run format:check

  typecheck:
    - npx tsc --noEmit --skipLibCheck

  test:
    - npm test -- --run
    - npm run test:coverage -- --run

  build:
    - npm run build
```

---

## Scripts Reference

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "generate:api": "openapi-typescript http://localhost:8080/swagger/doc.json -o src/types/api.d.ts",
    "analyze": "ANALYZE=true npm run build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format all code
npm run format:check     # Check formatting

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# API Types
npm run generate:api     # Generate TypeScript types from OpenAPI spec

# Bundle Analysis
npm run analyze          # Analyze bundle size

# Storybook
npm run storybook        # Start Storybook (http://localhost:6006)
```

---

## Resources

### Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)

### Internal Documentation

- [README.md](../README.md) - Project overview
- [Architecture Documentation](./architecture.md) - System architecture
- [API Documentation](./functional-design.md) - API integration details

---

**Last Updated**: 2026-01-10
**Maintainers**: Development Team

For questions or suggestions about these guidelines, please open an issue or submit a pull request.
