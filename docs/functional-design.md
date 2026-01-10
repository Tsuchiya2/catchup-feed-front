# Functional Design Specification

**Project**: Catchup Feed Web
**Version**: 1.1.0
**Last Updated**: 2026-01-10
**Type**: Next.js Frontend Application

---

## Table of Contents

- [Overview](#overview)
- [Feature Inventory](#feature-inventory)
- [Authentication & Security](#authentication--security)
- [Dashboard](#dashboard)
- [Article Management](#article-management)
- [Source Management](#source-management)
- [Search & Filtering](#search--filtering)
- [Data Models](#data-models)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Security Features](#security-features)
- [Testing Strategy](#testing-strategy)

---

## Overview

Catchup Feed Web is a modern RSS/Atom feed reader frontend built with Next.js 16.1.1, featuring AI-powered article summaries. This document details the functional design of all features, including API contracts, data models, business logic, and component specifications.

### Core Technologies

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript (Strict mode)
- **Data Fetching**: TanStack Query 5
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4

---

## Feature Inventory

| Feature | Status | Description | Route |
|---------|--------|-------------|-------|
| Authentication | ✅ Implemented | JWT-based login with token management | `/login` |
| Token Refresh | ✅ Implemented | Automatic token refresh with retry logic | N/A |
| CSRF Protection | ✅ Implemented | Double Submit Cookie pattern | All routes |
| Dashboard | ✅ Implemented | Overview statistics and recent articles | `/dashboard` |
| Article List | ✅ Implemented | Paginated article browsing | `/articles` |
| Article Detail | ✅ Implemented | Full article view with AI summary | `/articles/[id]` |
| Article Search | ✅ Implemented | Keyword and filter-based search | `/articles?keyword=...` |
| Source Filter Active-Only | ✅ Implemented | Filter dropdown shows only active sources | `/articles` (SourceFilter) |
| Source List | ✅ Implemented | RSS/Atom feed source catalog | `/sources` |
| Source Search | ✅ Implemented | Search and filter sources | `/sources?keyword=...` |
| Source Creation | ✅ Implemented | Add new RSS/Atom feeds (Admin only) | `/sources` (form) |
| Source Edit | ✅ Implemented | Edit source name and feed URL (Admin only) | `/sources` (dialog) |
| Source Delete | ✅ Implemented | Delete source with confirmation (Admin only) | `/sources` (dialog) |
| Source Toggle | ✅ Implemented | Enable/disable feed sources | `/sources` |
| Route Protection | ✅ Implemented | Middleware-level authentication | All protected routes |
| Error Boundaries | ✅ Implemented | React error boundaries with retry | All pages |
| Loading States | ✅ Implemented | Skeleton placeholders | All pages |

---

## Authentication & Security

### Feature: User Authentication

**Purpose**: Secure access to the application using JWT-based authentication.

#### User Stories

- As a user, I can log in with email and password to access my feed
- As a user, my session persists across browser refreshes
- As a user, I am automatically redirected to login if my session expires

#### API Endpoints

##### POST /auth/token

**Request**:
```typescript
interface LoginRequest {
  email: string;      // Valid email format
  password: string;   // Required, not validated client-side
}
```

**Response** (200 OK):
```typescript
interface LoginResponse {
  token: string;              // JWT access token
  refresh_token?: string;     // Refresh token (optional)
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

#### Component: LoginForm

**Location**: `/src/components/auth/LoginForm.tsx`

**Props**:
```typescript
interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>;
}
```

**Validation Schema** (Zod):
```typescript
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

**State**:
- `isLoading: boolean` - Form submission in progress
- `error: string | null` - Login error message

**Business Logic**:
1. User fills email and password fields
2. Client-side validation via Zod schema
3. On submit, calls `onLogin` prop or default login function
4. Stores JWT token in localStorage via `setAuthToken()`
5. Redirects to `/dashboard` on success
6. Displays error message on failure

#### Security: Token Management

**Storage**: `localStorage.getItem('catchup_feed_auth_token')`

**Token Functions** (`/src/lib/auth/TokenManager.ts`):

```typescript
// Store access token
setAuthToken(token: string): void

// Retrieve access token
getAuthToken(): string | null

// Store refresh token
setRefreshToken(token: string): void

// Retrieve refresh token
getRefreshToken(): string | null

// Clear all tokens (logout)
clearAllTokens(): void

// Check if token is expired
isTokenExpired(): boolean

// Check if token is expiring soon (within 5 minutes)
isTokenExpiringSoon(): boolean
```

#### Feature: Token Refresh

**Purpose**: Automatically refresh access tokens before expiration to maintain user sessions.

**API Endpoint**: POST /auth/refresh

**Request**:
```typescript
interface RefreshTokenRequest {
  refresh_token: string;
}
```

**Response** (200 OK):
```typescript
interface RefreshTokenResponse {
  token: string;          // New access token
  refresh_token: string;  // New refresh token
}
```

**Configuration** (`/src/config/app.config.ts`):
```typescript
auth: {
  gracePeriod: 300,           // 5 minutes (seconds)
}

api: {
  retryAttempts: 3,           // Max retry attempts
  retryDelay: 1000,           // Initial delay (ms)
}
```

**Business Logic**:
1. Before each API request, check if token is expiring soon
2. If expiring within 5 minutes, trigger refresh
3. Use exponential backoff for retries (1s, 2s, 4s)
4. Add ±10% jitter to prevent thundering herd
5. Update tokens in localStorage on success
6. Clear tokens and redirect to login on failure

**Retry Strategy**:
- Attempt 1: Immediate
- Attempt 2: 1000ms + jitter
- Attempt 3: 2000ms + jitter
- Attempt 4: 4000ms + jitter

#### Feature: Route Protection

**Proxy**: `/src/proxy.ts` (renamed from middleware.ts in Next.js 16)

**Protected Routes**:
- `/dashboard`
- `/articles`
- `/articles/[id]`
- `/sources`

**Business Logic**:
1. Extract JWT token from `catchup_feed_auth_token` cookie
2. Decode JWT using `jose` library (no signature verification)
3. Check token expiration (`exp` claim)
4. Add 30-second buffer for clock skew
5. If valid, allow access and set CSRF token
6. If invalid/expired, redirect to `/login?redirect={original_path}`
7. If on `/login` with valid token, redirect to `/dashboard`

---

## Dashboard

### Feature: Dashboard Overview

**Purpose**: Provide a high-level overview of articles and sources with recent activity.

**Route**: `/dashboard`

**Page Component**: `/src/app/(protected)/dashboard/page.tsx`

#### User Stories

- As a user, I can see total article and source counts
- As a user, I can view recent articles (up to 10)
- As a user, I can click on statistics cards to navigate to full lists

#### Data Fetching

**Hook**: `useDashboardStats()`

**Location**: `/src/hooks/useDashboardStats.ts`

**Return Type**:
```typescript
interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: Error | null;
}

interface DashboardStats {
  totalArticles: number;    // Total count from pagination
  totalSources: number;     // Array length of sources
  recentArticles: Article[]; // First 10 articles
}
```

**Implementation**:
- Combines `useArticles({ limit: 10 })` and `useSources()`
- Queries run in parallel via React Query
- `isLoading` is true if either query is loading
- `error` prioritizes articles error over sources error

#### Components

##### StatisticsCard

**Location**: `/src/components/dashboard/StatisticsCard.tsx`

**Props**:
```typescript
interface StatisticsCardProps {
  title: string;           // Card title (e.g., "Total Articles")
  value: number;           // Numeric value
  icon: React.ReactNode;   // Lucide React icon
  isLoading?: boolean;     // Shows skeleton if true
}
```

**Display**:
- Card with border and shadow
- Icon in colored circle (primary theme)
- Large numeric value (2xl font)
- Title below in muted color

##### RecentArticlesList

**Location**: `/src/components/dashboard/RecentArticlesList.tsx`

**Props**:
```typescript
interface RecentArticlesListProps {
  articles: Article[];
  isLoading: boolean;
}
```

**Features**:
- Displays up to 10 recent articles
- Skeleton loading states (10 items)
- Empty state if no articles
- Uses `ArticleCard` component for each item

---

## Article Management

### Feature: Article List

**Purpose**: Browse all articles with pagination and filtering.

**Route**: `/articles`

**Page Component**: `/src/app/(protected)/articles/page.tsx`

#### User Stories

- As a user, I can browse all articles in a paginated list
- As a user, I can see 10, 20, 50, or 100 articles per page
- As a user, I can navigate between pages
- As a user, I can see article title, summary, source, and publish date

#### API Endpoint

##### GET /articles

**Query Parameters**:
```typescript
interface ArticlesQuery {
  page?: number;      // Page number (default: 1, min: 1)
  limit?: number;     // Items per page (default: 10, max: 100)
  source_id?: number; // Filter by source ID
}
```

**Response** (200 OK):
```typescript
interface PaginatedArticlesResponse {
  data: Article[];
  pagination: PaginationMetadata;
}

interface Article {
  id: number;
  source_id: number;
  source_name: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;  // ISO 8601 format
  created_at: string;    // ISO 8601 format
}

interface PaginationMetadata {
  page: number;        // Current page (1-indexed)
  limit: number;       // Items per page
  total: number;       // Total items across all pages
  total_pages: number; // Total number of pages
}
```

**Example**:
```
GET /articles?page=1&limit=20&source_id=5
```

#### Data Fetching

**Hook**: `useArticles(query, options)`

**Location**: `/src/hooks/useArticles.ts`

**Signature**:
```typescript
function useArticles(
  query?: ArticlesQuery,
  options?: UseArticlesOptions
): UseArticlesReturn

interface UseArticlesOptions {
  enabled?: boolean;  // Enable/disable query (default: true)
}

interface UseArticlesReturn {
  articles: Article[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**React Query Configuration**:
- **Query Key**: `['articles', { page, limit, source_id }]`
- **Stale Time**: 60 seconds
- **Retry**: 1 attempt
- **Refetch on Focus**: Enabled

**Business Logic**:
1. Build query string from parameters
2. Fetch from `/articles?page=X&limit=Y`
3. Validate paginated response structure
4. Validate each article with `validateArticle()`
5. Normalize `source_name` field
6. Track performance with metrics
7. Return articles and pagination info

#### Components

##### ArticleCard

**Location**: `/src/components/articles/ArticleCard.tsx`

**Props**:
```typescript
interface ArticleCardProps {
  article: Article;
  sourceName?: string;  // Override source name
  className?: string;
}
```

**Display**:
- Link to `/articles/[id]`
- Title (xl font, bold, hover color transition)
- Summary (2-line clamp, 150 char truncation)
- Source badge (secondary variant)
- Relative publish date (e.g., "2 hours ago")
- Hover effects (border glow, shadow)

**Memoization**: React.memo to prevent re-renders in lists

##### Pagination

**Location**: `/src/components/common/Pagination.tsx`

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
  availablePageSizes: number[];
}
```

**Features**:
- Previous/Next buttons
- Page number buttons (max 7 visible)
- Ellipsis for large page counts
- Items per page selector
- Total items display
- Keyboard navigation support

**Validation**:
- Page must be >= 1 and <= totalPages
- If page exceeds total, redirect to last page

### Feature: Article Detail

**Purpose**: View full article content with AI-generated summary.

**Route**: `/articles/[id]`

**Page Component**: `/src/app/(protected)/articles/[id]/page.tsx`

#### User Stories

- As a user, I can view full article details
- As a user, I can read an AI-generated summary
- As a user, I can click through to the original article URL

#### API Endpoint

##### GET /articles/{id}

**Path Parameters**:
- `id`: Article ID (number)

**Response** (200 OK):
```typescript
interface ArticleResponse {
  id: number;
  source_id: number;
  source_name: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
}
```

**Errors**:
- `404 Not Found`: Article does not exist
- `401 Unauthorized`: No valid token

#### Data Fetching

**Hook**: `useArticle(id)`

**Location**: `/src/hooks/useArticle.ts`

**Signature**:
```typescript
function useArticle(id: number): UseArticleReturn

interface UseArticleReturn {
  article: Article | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**React Query Configuration**:
- **Query Key**: `['article', id]`
- **Stale Time**: 60 seconds
- **Retry**: 1 attempt
- **Enabled**: Only if `id > 0`

#### Components

##### ArticleHeader

**Location**: `/src/components/articles/ArticleHeader.tsx`

**Props**:
```typescript
interface ArticleHeaderProps {
  title: string;
  sourceName: string;
  publishedAt: string;
  url: string;
}
```

**Display**:
- Large title (3xl font)
- Source badge
- Publish date (relative time)
- External link button to original article

##### AISummaryCard

**Location**: `/src/components/articles/AISummaryCard.tsx`

**Props**:
```typescript
interface AISummaryCardProps {
  summary: string;
  className?: string;
}
```

**Display**:
- Card with primary-themed border and background
- Sparkles icon (Lucide React)
- "AI Summary" title with glow effect
- Summary text with line breaks preserved
- Disclaimer footer
- Fallback for empty summaries

---

## Source Management

### Feature: Source List

**Purpose**: Browse and manage RSS/Atom feed sources.

**Route**: `/sources`

**Page Component**: `/src/app/(protected)/sources/page.tsx`

#### User Stories

- As a user, I can view all feed sources
- As a user, I can see source name, URL, active status, and last crawl time
- As an admin, I can toggle source active status
- As an admin, I can add new sources
- As an admin, I can edit existing sources

#### API Endpoints

##### GET /sources

**Response** (200 OK):
```typescript
type SourcesResponse = Source[];

interface Source {
  id: number;
  name: string;
  feed_url: string;
  last_crawled_at: string | null;  // ISO 8601 or null
  active: boolean;
}
```

**Note**: Backend returns array directly, not wrapped in object.

##### PUT /sources/{id}

**Purpose**: Update source active status

**Path Parameters**:
- `id`: Source ID (number)

**Request**:
```typescript
interface UpdateSourceActiveRequest {
  active: boolean;
}
```

**Response** (200 OK):
```typescript
type SourceResponse = Source;
```

**Errors**:
- `403 Forbidden`: User is not admin
- `404 Not Found`: Source does not exist

##### POST /sources

**Purpose**: Create new RSS/Atom feed source

**Request**:
```typescript
interface CreateSourceInput {
  name: string;     // Max 255 characters
  feedURL: string;  // Valid URL, max 2048 characters
}
```

**Response** (201 Created): Empty body

**Errors**:
- `400 Bad Request`: Invalid input (validation failure)
- `403 Forbidden`: User is not admin
- `500 Internal Server Error`: Server error

##### PUT /sources/{id}

**Purpose**: Update existing source

**Path Parameters**:
- `id`: Source ID (number)

**Request**:
```typescript
interface UpdateSourceInput {
  name: string;     // Max 255 characters
  feedURL: string;  // Valid URL, max 2048 characters
  active: boolean;  // Source active status
}
```

**Response** (200 OK): Updated source object

**Errors**:
- `400 Bad Request`: Invalid input (validation failure)
- `403 Forbidden`: User is not admin
- `404 Not Found`: Source does not exist
- `500 Internal Server Error`: Server error

#### Data Fetching

**Hook**: `useSources(options)`

**Location**: `/src/hooks/useSources.ts`

**Signature**:
```typescript
function useSources(options?: UseSourcesOptions): UseSourcesReturn

interface UseSourcesOptions {
  enabled?: boolean;
}

interface UseSourcesReturn {
  sources: Source[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**React Query Configuration**:
- **Query Key**: `['sources']`
- **Stale Time**: 60 seconds
- **Retry**: 1 attempt

**Mutation Hook**: `useCreateSource()`

**Location**: `/src/hooks/useCreateSource.ts`

**Signature**:
```typescript
function useCreateSource(): UseCreateSourceReturn

interface UseCreateSourceReturn {
  createSource: (data: CreateSourceInput) => void;
  mutateAsync: (data: CreateSourceInput) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
  isSuccess: boolean;
}
```

**On Success**: Invalidates `['sources']` cache to refresh list

**Mutation Hook**: `useUpdateSource()`

**Location**: `/src/hooks/useUpdateSource.ts`

**Signature**:
```typescript
function useUpdateSource(): UseUpdateSourceReturn

interface UseUpdateSourceReturn {
  updateSource: (params: { id: number; data: UpdateSourceInput }) => void;
  mutateAsync: (params: { id: number; data: UpdateSourceInput }) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
  isSuccess: boolean;
}
```

**Features**:
- Optimistic updates: Updates UI immediately before server confirmation
- Automatic rollback on error: Reverts to previous state if update fails
- Cache invalidation: Refreshes `['sources']` cache on success

**On Success**: Invalidates `['sources']` cache to refresh list

**Mutation Hook**: `useDeleteSource()`

**Location**: `/src/hooks/useDeleteSource.ts`

**Signature**:
```typescript
function useDeleteSource(): UseDeleteSourceReturn

interface UseDeleteSourceReturn {
  deleteSource: (params: { id: number }) => void;
  mutateAsync: (params: { id: number }) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
  isSuccess: boolean;
}
```

**Features**:
- Optimistic updates: Removes source from UI immediately
- Automatic rollback on error: Reverts to previous state if deletion fails
- Cache invalidation: Refreshes `['sources']` cache on success

**On Success**: Invalidates `['sources']` cache to refresh list

#### Components

##### StatusBadge

**Location**: `/src/components/sources/StatusBadge.tsx`

**Props**:
```typescript
interface StatusBadgeProps {
  active: boolean;
}
```

**Display**:
- Green badge for active sources
- Gray badge for inactive sources
- Text: "Active" or "Inactive"

##### ActiveToggle

**Location**: `/src/components/sources/ActiveToggle.tsx`

**Props**:
```typescript
interface ActiveToggleProps {
  sourceId: number;
  active: boolean;
  onToggle?: (sourceId: number, newStatus: boolean) => Promise<void>;
}
```

**Features**:
- Switch UI component (Radix UI)
- Optimistic updates
- Error handling with rollback
- Loading state during mutation

##### SourceForm

**Location**: `/src/components/sources/SourceForm.tsx`

**Props**:
```typescript
interface SourceFormProps {
  mode: 'create' | 'edit';
  initialData?: SourceFormData;
  onSubmit: (data: SourceFormData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  onCancel: () => void;
}

interface SourceFormData {
  name: string;
  feedURL: string;
}
```

**Features**:
- Reusable form for both create and edit modes
- Client-side validation with real-time feedback
- Accessible form controls with ARIA labels
- Input trimming before submission
- Max length constraints (name: 255, URL: 2048)

**Validation**:
- Name: Required, 1-255 characters after trimming
- Feed URL: Required, valid HTTP/HTTPS URL, max 2048 characters

##### EditSourceDialog

**Location**: `/src/components/sources/EditSourceDialog.tsx`

**Props**:
```typescript
interface EditSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source;
  onSuccess?: () => void;
}
```

**Features**:
- Pre-populates SourceForm with current source data
- Uses useUpdateSource hook for mutation
- Optimistic updates with rollback on error
- Automatic cache invalidation on success
- Focus management (dialog open/close)
- Accessible dialog with ARIA labels

##### DeleteSourceDialog

**Location**: `/src/components/sources/DeleteSourceDialog.tsx`

**Props**:
```typescript
interface DeleteSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  source: Source;
  onSuccess?: () => void;
}
```

**Features**:
- Displays source name in confirmation message
- Uses useDeleteSource hook for mutation
- Optimistic updates with rollback on error
- Automatic cache invalidation on success
- Error message display for failed deletions
- Focus management (dialog open/close)
- Accessible dialog with ARIA labels
- Destructive button styling (red) to indicate danger

---

## Search & Filtering

### Feature: Article Search

**Purpose**: Search articles by keyword, source, and date range.

**Route**: `/articles?keyword=...&source_id=...&from=...&to=...`

#### User Stories

- As a user, I can search articles by keyword
- As a user, I can filter articles by source
- As a user, I can filter articles by date range
- As a user, I can clear all filters at once

#### API Endpoint

##### GET /articles/search

**Query Parameters**:
```typescript
interface ArticleSearchParams {
  keyword?: string;   // Search in title and summary
  source_id?: number; // Filter by source ID
  from?: string;      // Start date (ISO 8601)
  to?: string;        // End date (ISO 8601)
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 10)
}
```

**Response** (200 OK):
```typescript
interface PaginatedArticlesResponse {
  data: Article[];
  pagination: PaginationMetadata;
}
```

**Example**:
```
GET /articles/search?keyword=typescript&source_id=1&from=2025-01-01&to=2025-12-31&page=1&limit=20
```

#### Data Fetching

**Hook**: `useArticleSearch(params, options)`

**Location**: `/src/hooks/useArticleSearch.ts`

**Signature**:
```typescript
function useArticleSearch(
  params?: ArticleSearchParams,
  options?: UseArticleSearchOptions
): UseArticleSearchReturn

interface UseArticleSearchOptions {
  enabled?: boolean;
}

interface UseArticleSearchReturn {
  articles: Article[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Debouncing**: Keyword input is debounced by 300ms via `useDebounce` hook

#### Components

##### ArticleSearch

**Location**: `/src/components/articles/ArticleSearch.tsx`

**Props**:
```typescript
interface ArticleSearchProps {
  searchState: ArticleSearchState;
  onSearchChange: (state: ArticleSearchState) => void;
  isLoading?: boolean;
  className?: string;
}

interface ArticleSearchState {
  keyword: string;
  sourceId: number | null;
  fromDate: string | null;
  toDate: string | null;
}
```

**Features**:
- Keyword search input with debouncing
- Source dropdown filter (populated from API)
- Date range picker
- "Clear All Filters" button

**URL Synchronization**:
- Search state is synced to URL query parameters
- On state change, updates URL and resets to page 1
- On page load, restores state from URL

##### SearchInput

**Location**: `/src/components/search/SearchInput.tsx`

**Props**:
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}
```

**Features**:
- Search icon (Lucide React)
- Debounced onChange (300ms)
- Loading spinner when searching
- Clear button when value exists

##### SourceFilter

**Location**: `/src/components/search/SourceFilter.tsx`

**Props**:
```typescript
interface SourceFilterProps {
  value: number | null;
  onChange: (sourceId: number | null) => void;
  className?: string;
  disabled?: boolean;
  filterPredicate?: SourceFilterPredicate;  // Optional custom filter
}
```

**Features**:
- Dropdown with active sources by default (filters inactive sources)
- "All Sources" option (null value) always available
- Fetches sources via `useSources()` hook
- Uses `filterSources()` utility with `sourceFilters.active` predicate
- Extensible filtering via optional `filterPredicate` prop
- Observability logging for filtered source counts

**Default Behavior**:
By default, the SourceFilter displays only active sources (`active: true`) on the Articles page. This prevents users from filtering by inactive or defunct sources that are no longer being crawled.

**Active Source Filtering**:
```typescript
// Default filtering behavior
const filteredSources = filterSources(sources, sourceFilters.active);
// Users only see active sources in dropdown
```

**Customization**:
```typescript
// Show all sources (including inactive)
<SourceFilter filterPredicate={sourceFilters.all} />

// Custom filter predicate
<SourceFilter filterPredicate={(s) => s.active && s.name.includes('Tech')} />
```

**Edge Cases**:
- If all sources are inactive: Displays only "All Sources" option
- If no sources exist: Displays only "All Sources" option
- Undefined `active` field: Treated as inactive (defensive filtering)

### Feature: Source Search

**Purpose**: Search and filter feed sources.

**Route**: `/sources?keyword=...&source_type=...&active=...`

#### API Endpoint

##### GET /sources/search

**Query Parameters**:
```typescript
interface SourceSearchParams {
  keyword?: string;      // Search in name and URL
  source_type?: string;  // Filter by type (e.g., "RSS", "Atom")
  active?: boolean;      // Filter by active status
}
```

**Response** (200 OK):
```typescript
type SourcesResponse = Source[];
```

#### Components

##### SourceSearch

**Location**: `/src/components/sources/SourceSearch.tsx`

**Props**:
```typescript
interface SourceSearchProps {
  searchState: SourceSearchState;
  onSearchChange: (state: SourceSearchState) => void;
  isLoading?: boolean;
  className?: string;
}

interface SourceSearchState {
  keyword: string;
  sourceType: string | null;
  active: boolean | null;
}
```

**Features**:
- Keyword search input
- Type filter dropdown ("RSS", "Atom", "All")
- Active status filter ("Active", "Inactive", "All")
- "Clear All Filters" button

---

## Data Models

### Core Entities

#### Article

```typescript
interface Article {
  id: number;                // Primary key
  source_id: number;         // Foreign key to Source
  source_name: string;       // Denormalized source name
  title: string;             // Article title
  url: string;               // Original article URL
  summary: string;           // AI-generated summary
  published_at: string;      // ISO 8601 datetime
  created_at: string;        // ISO 8601 datetime
}
```

**Validation**:
- `id`: Must be positive integer
- `title`: Non-empty string
- `url`: Valid URL format
- `source_name`: Normalized (trimmed, lowercase)
- `published_at`: Valid ISO 8601 datetime
- `created_at`: Valid ISO 8601 datetime

**Normalization**:
- `source_name` is trimmed and lowercased
- Summary text preserves line breaks

#### Source

```typescript
interface Source {
  id: number;                      // Primary key
  name: string;                    // Source name
  feed_url: string;                // RSS/Atom feed URL
  last_crawled_at: string | null;  // Last crawl timestamp
  active: boolean;                 // Enable/disable flag
}
```

**Validation**:
- `name`: Non-empty, max 255 characters
- `feed_url`: Valid URL, max 2048 characters
- `active`: Boolean
- `last_crawled_at`: ISO 8601 or null

### Pagination Models

#### PaginationMetadata (Backend Format)

```typescript
interface PaginationMetadata {
  page: number;        // Current page (1-indexed)
  limit: number;       // Items per page
  total: number;       // Total items
  total_pages: number; // Total pages
}
```

**Backend Contract**: snake_case fields

#### PaginationInfo (Frontend Format)

```typescript
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;  // Converted from total_pages
}
```

**Frontend Usage**: camelCase fields

**Conversion Function**: `extractPaginationMetadata()`

**Location**: `/src/lib/api/utils/pagination.ts`

### Response Wrappers

#### PaginatedResponse

```typescript
interface PaginatedResponse<T> {
  data: T[];                      // Array of items
  pagination: PaginationMetadata; // Pagination metadata
}
```

**Used For**:
- Article lists
- Search results

#### ApiErrorResponse

```typescript
interface ApiErrorResponse {
  error: string;                       // Error type
  message: string;                     // Human-readable message
  statusCode: number;                  // HTTP status code
  details?: Record<string, unknown>;   // Additional error details
}
```

---

## API Integration

### HTTP Client

**Location**: `/src/lib/api/client.ts`

**Class**: `ApiClient`

**Base URL**: `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:8080`)

#### Core Methods

```typescript
class ApiClient {
  // Make a GET request
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>

  // Make a POST request
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>

  // Make a PUT request
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>

  // Make a DELETE request
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>
}
```

#### Request Options

```typescript
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;  // Default: true
  timeout?: number;        // Default: 30000ms
  retry?: RetryConfig | false;
}

interface RetryConfig {
  maxRetries?: number;       // Default: 3
  initialDelay?: number;     // Default: 1000ms
  maxDelay?: number;         // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
}
```

#### Automatic Features

1. **Authentication**:
   - Injects `Authorization: Bearer {token}` header
   - Automatically refreshes token if expiring soon
   - Prevents concurrent refresh requests

2. **CSRF Protection**:
   - Adds CSRF token header for POST/PUT/PATCH/DELETE
   - Extracts and stores CSRF token from responses
   - Handles CSRF validation failures (403)

3. **Error Handling**:
   - Converts HTTP errors to `ApiError` instances
   - Clears tokens on 401 and redirects to login
   - Throws `NetworkError` on connection failures
   - Throws `TimeoutError` on request timeouts

4. **Retry Logic**:
   - Retries on 5xx errors, network errors, and timeouts
   - Uses exponential backoff (2x multiplier)
   - Adds ±10% jitter to prevent thundering herd
   - Does NOT retry CSRF errors (requires page reload)

5. **Observability**:
   - Tracks API latency metrics
   - Logs request/response for debugging
   - Adds distributed tracing headers
   - Measures performance with `performance.mark()`

#### Error Classes

```typescript
class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  isAuthError(): boolean;      // status === 401
  isServerError(): boolean;    // status >= 500
  isClientError(): boolean;    // status >= 400 && < 500
}

class NetworkError extends Error {
  // Thrown on connection failures
}

class TimeoutError extends Error {
  // Thrown on request timeouts
}
```

### API Endpoint Functions

**Location**: `/src/lib/api/endpoints/`

#### Articles

```typescript
// Fetch paginated articles
getArticles(query?: ArticlesQuery): Promise<PaginatedArticlesResponse>

// Search articles
searchArticles(params?: ArticleSearchParams): Promise<PaginatedArticlesResponse>

// Fetch single article
getArticle(id: number): Promise<ArticleResponse>
```

#### Sources

```typescript
// Fetch all sources
getSources(): Promise<SourcesResponse>

// Search sources
searchSources(params?: SourceSearchParams): Promise<SourcesResponse>

// Fetch single source
getSource(id: number): Promise<SourceResponse>

// Update source active status
updateSourceActive(id: number, active: boolean): Promise<SourceResponse>

// Create new source
createSource(data: CreateSourceInput): Promise<void>

// Delete source
deleteSource(id: number): Promise<void>
```

#### Authentication

```typescript
// Login with email/password
login(email: string, password: string): Promise<LoginResponse>

// Logout (client-side only)
logout(): void

// Refresh access token
refreshToken(): Promise<RefreshTokenResponse>
```

---

## State Management

### Server State (TanStack Query)

**Provider**: `/src/providers/QueryProvider.tsx`

**Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,           // 60 seconds
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
```

**Query Keys**:
- `['articles', { page, limit, source_id }]` - Article list
- `['article', id]` - Single article
- `['sources']` - Source list
- `['articleSearch', { keyword, source_id, from, to, page, limit }]` - Article search
- `['sourceSearch', { keyword, source_type, active }]` - Source search

**Cache Invalidation**:
- After source creation: Invalidate `['sources']`
- After source toggle: Invalidate `['sources']`

### Client State (React Hooks)

**Form State**: React Hook Form
- Login form
- Source creation form
- Search forms

**UI State**: React useState
- Loading states
- Error messages
- Modal visibility
- Search input debouncing

### URL State (Next.js Router)

**Synchronized State**:
- Pagination (page, limit)
- Search filters (keyword, source_id, from, to)
- Active filters (source_type, active)

**Pattern**:
```typescript
// Read from URL
const searchParams = useSearchParams();
const page = parseInt(searchParams.get('page') || '1', 10);

// Write to URL
const router = useRouter();
router.push(`/articles?page=${newPage}&limit=${limit}`);
```

---

## Error Handling

### Error Boundaries

**Global Error Boundary**: `/src/app/error.tsx`

**Features**:
- Catches React errors
- Displays error message
- Reset button to retry
- Logs to console in development

### API Error Handling

**Pattern**:
```typescript
try {
  const data = await apiClient.get('/endpoint');
  // Success handling
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      // Redirect to login
    } else if (error.status === 404) {
      // Show not found message
    } else {
      // Show generic error
    }
  } else if (error instanceof NetworkError) {
    // Show network error message
  } else if (error instanceof TimeoutError) {
    // Show timeout error message
  }
}
```

### Error Components

#### ErrorMessage

**Location**: `/src/components/common/ErrorMessage.tsx`

**Props**:
```typescript
interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}
```

**Display**:
- Red alert box
- Error message
- Retry button (if `onRetry` provided)

#### EmptyState

**Location**: `/src/components/common/EmptyState.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}
```

**Use Cases**:
- No articles available
- No search results
- No sources configured

---

## Security Features

### CSRF Protection

**Implementation**: Double Submit Cookie pattern

**Proxy**: `/src/proxy.ts` (renamed from middleware.ts in Next.js 16)

**Token Manager**: `/src/lib/security/CsrfTokenManager.ts`

#### Flow

1. **Token Generation** (Server):
   - Proxy function generates random UUID
   - Sets `x-csrf-token` cookie (HttpOnly, Secure, SameSite=Lax)
   - Returns token in response header

2. **Token Storage** (Client):
   - `setCsrfTokenFromResponse()` extracts token from header
   - Stores in memory (not localStorage for security)

3. **Token Injection** (Client):
   - `addCsrfTokenToHeaders()` adds `X-CSRF-Token` header
   - Applied to POST/PUT/PATCH/DELETE requests

4. **Token Validation** (Server):
   - Middleware compares header token with cookie token
   - Returns 403 if mismatch or missing

5. **Error Handling** (Client):
   - Detects 403 CSRF errors
   - Clears invalid token
   - Reloads page to get fresh token
   - Prevents infinite reload loops

**Exempt Routes**:
- `/api/health`
- `/api/webhooks`

### JWT Security

**Storage**: localStorage (trade-off for SSR compatibility)

**Cookie Synchronization**:
- Token stored in `catchup_feed_auth_token` cookie
- Used by middleware for route protection
- Automatically synced on login/logout

**Token Rotation**:
- Access token: Short-lived (backend configured)
- Refresh token: Long-lived
- Automatic refresh before expiration

**Validation**:
- Client: Expiration check only
- Server: Full signature verification

---

## Testing Strategy

### Unit Tests

**Framework**: Vitest

**Coverage Areas**:
- React hooks (useArticles, useSources, etc.)
- Utility functions (validation, formatting, truncation)
- API client error handling
- Form validation schemas

### Integration Tests

**Framework**: Vitest + Testing Library

**Coverage Areas**:
- Component rendering
- User interactions (click, input, submit)
- Form submission flows
- Error states
- Loading states

### Component Tests

**Pattern**:
```typescript
describe('ArticleCard', () => {
  it('renders article information', () => {
    const article = mockArticle();
    render(<ArticleCard article={article} />);

    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getByText(article.summary)).toBeInTheDocument();
  });

  it('navigates to detail page on click', () => {
    const article = mockArticle();
    render(<ArticleCard article={article} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/articles/${article.id}`);
  });
});
```

### E2E Tests

**Framework**: Playwright (configured, not fully implemented)

**Planned Coverage**:
- Login flow
- Article browsing
- Search and filtering
- Source management (admin)

---

## Appendix

### Constants

**Pagination** (`/src/lib/constants/pagination.ts`):
```typescript
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100],
};
```

### Utilities

**Date Formatting** (`/src/lib/utils/formatDate.ts`):
```typescript
// Convert ISO datetime to relative time (e.g., "2 hours ago")
formatRelativeTime(date: string): string
```

**Text Truncation** (`/src/lib/utils/truncate.ts`):
```typescript
// Truncate text to max length with ellipsis
truncateText(text: string, maxLength: number): string
```

**Article Validation** (`/src/utils/article.ts`):
```typescript
// Validate article structure
validateArticle(article: unknown): article is Article

// Normalize source name (trim, lowercase)
normalizeSourceName(sourceName: string): string
```

**Source Filtering** (`/src/utils/sourceFilters.ts`):
```typescript
// Filter predicate function type
export type SourceFilterPredicate = (source: Source) => boolean;

// Pre-defined filter predicates
export const sourceFilters = {
  active: (source: Source) => source.active === true,  // Only active sources
  all: (_source: Source) => true,                      // All sources
};

// Helper function to filter sources with default active filter
export const filterSources = (
  sources: Source[],
  predicate: SourceFilterPredicate = sourceFilters.active
): Source[];

// Compose multiple predicates with AND/OR logic
export const composeFilters = (
  predicates: SourceFilterPredicate[],
  mode: 'AND' | 'OR' = 'AND'
): SourceFilterPredicate;
```

**Usage Examples**:
```typescript
// Filter to active sources only (default)
const activeSources = filterSources(sources);

// Show all sources
const allSources = filterSources(sources, sourceFilters.all);

// Compose filters (active AND contains keyword)
const filtered = filterSources(sources,
  composeFilters([
    sourceFilters.active,
    (s) => s.name.toLowerCase().includes('tech')
  ])
);
```

---

**End of Functional Design Specification**
