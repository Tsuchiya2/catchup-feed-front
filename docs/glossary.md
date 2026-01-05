# Glossary

Comprehensive glossary of domain terms, technical terminology, acronyms, and entity definitions used in the Catchup Feed Web application.

---

## Table of Contents

- [Domain Entities](#domain-entities)
- [Authentication & Security](#authentication--security)
- [API & Network](#api--network)
- [Frontend Architecture](#frontend-architecture)
- [User Interface](#user-interface)
- [Observability & Monitoring](#observability--monitoring)
- [Technical Acronyms](#technical-acronyms)
- [Development Concepts](#development-concepts)

---

## Domain Entities

### Article

A content item fetched from an RSS/Atom feed source.

**TypeScript Definition:**
```typescript
interface Article {
  id: number;                  // Unique article identifier
  source_id: number;           // ID of the source this article belongs to
  source_name: string;         // Human-readable source name
  title: string;               // Article headline
  url: string;                 // Original article URL
  summary: string;             // Article excerpt or AI-generated summary
  published_at: string;        // Publication timestamp (ISO 8601)
  created_at: string;          // Timestamp when article was added to system (ISO 8601)
}
```

**Related Types:**
- `ArticleSearchParams`: Query parameters for article search (keyword, source_id, from, to, page, limit)
- `ArticlesQuery`: Basic query parameters (page, limit, source_id)
- `ArticleResponse`: Single article response from API
- `PaginatedArticlesResponse`: Paginated list of articles

---

### Source

An RSS or Atom feed source that provides articles.

**TypeScript Definition:**
```typescript
interface Source {
  id: number;                    // Unique source identifier
  name: string;                  // Human-readable source name
  feed_url: string;              // RSS/Atom feed URL
  last_crawled_at?: string | null; // Last crawl timestamp (ISO 8601)
  active: boolean;               // Whether source is actively being crawled
}
```

**Related Types:**
- `CreateSourceInput`: Input for creating a new source (name, feedURL)
- `UpdateSourceInput`: Input for updating an existing source (name, feedURL, active)
- `SourceFormData`: Form state for source creation and editing UI
- `SourceFormErrors`: Validation errors for source form
- `SourceSearchParams`: Query parameters for source search (keyword, source_type, active)

---

### User

An authenticated user of the system.

**Roles:**
- **admin**: Full access to all features including source management
- **user**: Standard user with read-only access to articles

**TypeScript Definition:**
```typescript
type UserRole = 'admin' | 'user' | null;

interface UserContext {
  id: string;                  // Unique user identifier
  email?: string;              // User email address
  username?: string;           // Display name
}
```

---

## Authentication & Security

### JWT (JSON Web Token)

A compact, URL-safe token used for authentication and authorization.

**Structure:** `header.payload.signature` (three base64url-encoded parts separated by dots)

**Payload Claims:**
- `exp`: Expiration timestamp (Unix seconds)
- `role`: User role ('admin' or 'user')
- `sub`: Subject (user ID)
- `iat`: Issued at timestamp

**Usage:**
- Stored in localStorage with key `catchup_feed_auth_token`
- Sent in `Authorization: Bearer <token>` header
- Validated by backend for signature and expiration
- Frontend checks expiration only (not signature)

---

### Access Token

Short-lived JWT token used to authenticate API requests.

**Properties:**
- Expires after configurable duration (default: 1 hour)
- Automatically refreshed when expiring soon (within 5 minutes of expiry)
- Stored in memory and localStorage via TokenManager
- Cleared on logout or 401 response

---

### Refresh Token

Long-lived token used to obtain new access tokens without re-authentication.

**Properties:**
- Longer expiration than access token
- Used only for `/auth/refresh` endpoint
- Stored separately from access token
- Cleared on logout or failed refresh

---

### CSRF (Cross-Site Request Forgery)

Attack where unauthorized commands are transmitted from a user the web application trusts.

**Protection Pattern:** Double Submit Cookie
- Server generates cryptographically secure token
- Token set in both HttpOnly cookie and response header
- Client reads header and sends in custom header for state-changing requests
- Server validates cookie matches header

**Token Format:**
- 43 characters (base64url encoding of 32 bytes)
- 256 bits of entropy
- URL-safe (no +, /, or = characters)

**Headers:**
- Cookie: `csrf_token` (HttpOnly, Secure, SameSite=Strict)
- Header: `X-CSRF-Token` (readable by JavaScript)

**Protected Methods:** POST, PUT, PATCH, DELETE

---

### Token Manager

Singleton class for centralized token storage and management.

**Features:**
- In-memory storage with localStorage fallback
- Multi-tab synchronization via BroadcastChannel
- Automatic token expiry checking
- Graceful degradation when localStorage unavailable (private browsing)

**Storage Keys:**
- Access token: `catchup_feed_auth_token`
- Refresh token: `catchup_feed_refresh_token`
- CSRF token: `catchup_feed_csrf_token` (sessionStorage)

---

### CSRF Token Manager

Client-side manager for CSRF tokens using Double Submit Cookie pattern.

**Features:**
- Extracts tokens from `X-CSRF-Token` response header
- Stores in sessionStorage (session-scoped)
- Automatically injects into state-changing request headers
- Cleared on logout or CSRF validation failure

---

### Authentication Flow

1. **Login**: User submits credentials → Receives JWT tokens → Stored by TokenManager
2. **Protected Request**: Client includes access token in Authorization header
3. **Token Refresh**: When token expiring soon → Use refresh token → Get new tokens
4. **Logout**: Clear all tokens → Redirect to login page

---

## API & Network

### API Client

Type-safe HTTP client for backend API communication.

**Features:**
- Automatic JWT token injection
- CSRF token management
- Request timeout handling (default: 30 seconds)
- Retry logic with exponential backoff
- Distributed tracing headers
- Automatic 401 handling (redirect to login)

**Error Types:**
- `ApiError`: HTTP error responses (4xx, 5xx)
- `NetworkError`: Network connectivity failures
- `TimeoutError`: Request timeout exceeded

**Methods:**
- `get<T>(endpoint, options)`: GET request
- `post<T>(endpoint, body, options)`: POST request
- `put<T>(endpoint, body, options)`: PUT request
- `delete<T>(endpoint, options)`: DELETE request

---

### Pagination

Server-side pagination for large datasets.

**Metadata Structure:**
```typescript
interface PaginationMetadata {
  page: number;         // Current page (1-indexed)
  limit: number;        // Items per page
  total: number;        // Total items across all pages
  total_pages: number;  // Total number of pages
}
```

**Response Wrapper:**
```typescript
interface PaginatedResponse<T> {
  data: T[];                      // Items for current page
  pagination: PaginationMetadata; // Pagination metadata
}
```

**Default Configuration:**
- Default page: 1
- Default limit: 20
- Available page sizes: [10, 20, 50, 100]

---

### API Error

Custom error class for API failures.

```typescript
class ApiError extends Error {
  status: number;                      // HTTP status code
  details?: Record<string, unknown>;   // Additional error context

  isAuthError(): boolean;     // Check if 401 Unauthorized
  isServerError(): boolean;   // Check if 5xx Server Error
  isClientError(): boolean;   // Check if 4xx Client Error
}
```

**Common Status Codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions or CSRF validation failed)
- `404`: Not Found
- `500`: Internal Server Error

---

### Retry Strategy

Automatic retry mechanism for failed requests.

**Configuration:**
```typescript
interface RetryConfig {
  maxRetries: number;          // Max retry attempts (default: 3)
  initialDelay: number;        // Initial delay ms (default: 1000)
  maxDelay: number;            // Max delay ms (default: 10000)
  backoffMultiplier: number;   // Exponential factor (default: 2)
}
```

**Retry Logic:**
- Retries network errors and 5xx server errors
- Uses exponential backoff: delay = initialDelay × (backoffMultiplier ^ attempt)
- Adds jitter (±10%) to prevent thundering herd
- Does NOT retry CSRF errors (requires page reload)

---

### Endpoint

An API route that handles specific operations.

**Format:** `/resource[/id][/action]`

**Examples:**
- `/auth/token`: Obtain JWT token (POST)
- `/auth/refresh`: Refresh access token (POST)
- `/articles`: List articles (GET)
- `/articles/:id`: Get article details (GET)
- `/articles/search`: Search articles (GET)
- `/sources`: List sources (GET)
- `/sources/:id`: Get source details (GET, PUT)

---

## Frontend Architecture

### App Router

Next.js 15 routing system based on file-system conventions.

**Route Groups:**
- `(auth)`: Public authentication routes (/login)
- `(protected)`: Authenticated routes (/dashboard, /articles, /sources)
- `(legal)`: Legal pages (/privacy, /terms)

**Special Files:**
- `page.tsx`: Route component
- `layout.tsx`: Shared layout wrapper
- `error.tsx`: Error boundary
- `loading.tsx`: Loading UI
- `not-found.tsx`: 404 page

---

### Server Component

React component rendered on the server (default in Next.js App Router).

**Benefits:**
- Direct database access (if needed)
- Zero client-side JavaScript
- Better SEO
- Faster initial page load

**Restrictions:**
- Cannot use hooks (useState, useEffect)
- Cannot use browser APIs
- Cannot handle user interactions directly

---

### Client Component

React component rendered in the browser.

**Marker:** `"use client"` directive at top of file

**Use Cases:**
- Interactive components (forms, buttons)
- State management
- Browser APIs (localStorage, fetch)
- Event handlers

---

### Middleware

Edge runtime function that runs before route handlers.

**Location:** `src/middleware.ts`

**Responsibilities:**
- Route protection (authentication check)
- CSRF token validation for state-changing requests
- CSRF token generation for authenticated users
- Redirect unauthenticated users to login

**Execution:** Runs on Cloudflare/Vercel Edge (no Node.js APIs)

---

### React Query (TanStack Query)

Server state management library for data fetching and caching.

**Core Concepts:**
- **Query**: Declarative data fetching
- **Mutation**: Data modification operations
- **Cache**: Automatic caching with invalidation
- **Refetch**: Background updates and revalidation

**Query Keys:** Unique identifiers for cached data
```typescript
['articles', { page: 1, limit: 20 }]
['article', articleId]
['sources']
```

---

### Feature Flag

Runtime toggle for enabling/disabling features.

**Configuration:**
```typescript
interface FeatureFlags {
  pwa: boolean;              // Progressive Web App features
  darkMode: boolean;         // Dark mode toggle
  aiSummary: boolean;        // AI-powered summaries
  tokenRefresh: boolean;     // Automatic token refresh
}
```

**Environment Variables:**
- `NEXT_PUBLIC_FEATURE_PWA`
- `NEXT_PUBLIC_FEATURE_DARK_MODE`
- `NEXT_PUBLIC_FEATURE_AI_SUMMARY`
- `NEXT_PUBLIC_FEATURE_TOKEN_REFRESH`

---

## User Interface

### Skeleton

Loading placeholder component that mimics content layout.

**Purpose:** Improve perceived performance by showing structure before data loads

**Usage:**
```typescript
{isLoading ? <Skeleton className="h-4 w-full" /> : <p>{content}</p>}
```

---

### Empty State

UI displayed when no data is available.

**Components:**
- Icon (illustrative)
- Heading (descriptive message)
- Subtext (helpful guidance)
- Action button (optional)

**Example:** "No articles found" with "Refresh" button

---

### Badge

Small label component for status indicators.

**Variants:**
- `default`: Primary accent color
- `secondary`: Muted background
- `destructive`: Error/warning state
- `outline`: Bordered style

**Usage:** Source names, status indicators, tags

---

### Card

Container component with consistent spacing and elevation.

**Anatomy:**
- `Card`: Wrapper container
- `CardHeader`: Top section with title
- `CardContent`: Main content area
- `CardFooter`: Bottom section with actions

---

### Toast

Temporary notification displayed at screen edge.

**Properties:**
- Auto-dismiss after timeout
- Manual dismiss via close button
- Variants: default, success, error, warning
- Position: top-right, bottom-right, etc.

---

### Breadcrumb

Navigation aid showing current page's location in hierarchy.

**Format:** Home > Articles > Article Title

**Implementation:**
```typescript
<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: article.title }
]} />
```

---

## Observability & Monitoring

### Sentry

Error tracking and performance monitoring platform.

**Features:**
- Automatic error capture
- Source map support for debugging
- User context tracking
- Performance metrics (Core Web Vitals)
- Distributed tracing

**Configuration:**
- DSN: `NEXT_PUBLIC_SENTRY_DSN`
- Environment: development, staging, production
- Traces Sample Rate: 0.1 (10% of requests)

---

### Distributed Tracing

Correlation of requests across frontend and backend services.

**Headers:**
- `X-Request-ID`: Unique request identifier (UUID v4)
- `X-Trace-ID`: Trace correlation ID (Sentry trace ID or UUID)

**Span:** Unit of work in a trace (e.g., API request, database query)

**Usage:**
```typescript
await startSpan('API Request: GET /articles', 'http.client', async () => {
  return await apiClient.get('/articles');
});
```

---

### Metrics

Quantitative measurements of application behavior.

**Categories:**
- **Authentication**: login success/failure, token refresh
- **Performance**: API latency, page load time, bundle size
- **Business**: article views, searches, source interactions
- **Errors**: API errors, network failures, JavaScript errors

**Implementation:**
```typescript
metrics.login.success();
metrics.performance.apiLatency('/articles', 150, 200);
metrics.article.view('123');
```

---

### Logger

Structured logging utility for development and production.

**Log Levels:**
- `debug`: Verbose debugging information
- `info`: Informational messages
- `warn`: Warning conditions
- `error`: Error conditions

**Format:**
- **Development**: Pretty format with emojis
- **Production**: JSON format for log aggregation

**Configuration:**
- Level filtering via `NEXT_PUBLIC_LOG_LEVEL`
- Sampling rate to reduce volume

---

## Technical Acronyms

### API (Application Programming Interface)

Interface for communication between software components.

**In this project:** RESTful HTTP API for frontend-backend communication

---

### CSRF (Cross-Site Request Forgery)

See [CSRF](#csrf-cross-site-request-forgery) in Authentication & Security

---

### DSN (Data Source Name)

Connection string for external services.

**Example:** Sentry DSN for error reporting

---

### DTO (Data Transfer Object)

Object that carries data between processes.

**In this project:** API response types (Article, Source)

---

### HTTP (HyperText Transfer Protocol)

Application protocol for distributed hypermedia systems.

**Methods:**
- GET: Retrieve resource
- POST: Create resource
- PUT: Update/replace resource
- PATCH: Partial update
- DELETE: Remove resource

---

### ISO 8601

International standard for date/time representation.

**Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`

**Example:** `2025-01-05T10:30:00.000Z`

---

### JWT (JSON Web Token)

See [JWT](#jwt-json-web-token) in Authentication & Security

---

### PWA (Progressive Web App)

Web application with native-like capabilities.

**Features:**
- Offline support (service worker)
- Installable (Add to Home Screen)
- Push notifications
- App-like experience

**Implementation:**
- next-pwa plugin
- Service worker registration
- Web manifest (`manifest.json`)

---

### REST (Representational State Transfer)

Architectural style for distributed systems.

**Constraints:**
- Stateless communication
- Resource-based URLs
- Standard HTTP methods
- JSON payload format

---

### RSS (Really Simple Syndication)

XML format for web feed distribution.

**Purpose:** Content syndication from websites

**Common Elements:**
- `<title>`: Feed/item title
- `<link>`: URL
- `<description>`: Content summary
- `<pubDate>`: Publication date

---

### SameSite

Cookie attribute controlling cross-site sending.

**Values:**
- `Strict`: Never send in cross-site requests
- `Lax`: Send only for top-level navigation
- `None`: Always send (requires Secure)

**CSRF Protection:** `SameSite=Strict` prevents cookie leakage

---

### SSR (Server-Side Rendering)

Rendering React components on the server.

**Benefits:**
- Faster initial page load
- Better SEO
- Improved Core Web Vitals

**In Next.js:** Default for Server Components

---

### TLS/SSL (Transport Layer Security / Secure Sockets Layer)

Cryptographic protocol for secure communication.

**Usage:**
- HTTPS (HTTP over TLS)
- Secure cookies (Secure attribute)
- Certificate validation

---

### TypeScript

Typed superset of JavaScript.

**Benefits:**
- Static type checking
- IntelliSense/autocomplete
- Refactoring safety
- Documentation via types

**Configuration:** `tsconfig.json` with strict mode enabled

---

### UUID (Universally Unique Identifier)

128-bit identifier guaranteed to be unique.

**Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` (hyphen-separated hex)

**Usage:** Request IDs, trace IDs

---

## Development Concepts

### Reusable Form Component

A form component designed to handle multiple use cases (create, edit) with a single implementation.

**SourceForm Pattern:**
```typescript
interface SourceFormProps {
  mode: 'create' | 'edit';        // Determines behavior
  initialData?: SourceFormData;   // Pre-populate for edit
  onSubmit: (data: SourceFormData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  onCancel: () => void;
}
```

**Design Principles:**
- **Single Responsibility**: Form only handles UI and validation
- **Inversion of Control**: Parent controls submission logic
- **Mode-based Behavior**: Adjusts labels and messages based on mode
- **Accessibility First**: ARIA labels, error descriptions, keyboard navigation

**Benefits:**
- Reduces code duplication
- Consistent validation across create/edit
- Easier to test and maintain

### Exponential Backoff

Retry strategy with exponentially increasing delays.

**Formula:** `delay = initialDelay × (multiplier ^ attempt)`

**Example:**
- Attempt 1: 1s delay
- Attempt 2: 2s delay (1 × 2^1)
- Attempt 3: 4s delay (1 × 2^2)

**Jitter:** Random variation added to prevent synchronized retries

---

### Lazy Loading

Deferring loading of resources until needed.

**Techniques:**
- Dynamic imports: `const Component = lazy(() => import('./Component'))`
- Image loading: `loading="lazy"`
- Route-based code splitting (automatic in Next.js)

---

### Memoization

Caching function results to avoid recomputation.

**React:**
- `React.memo()`: Component memoization
- `useMemo()`: Value memoization
- `useCallback()`: Function memoization

**Usage:**
```typescript
export const ArticleCard = React.memo(function ArticleCard({ article }) {
  // Component only re-renders if article changes
});
```

---

### Optimistic Update

UI update before server confirmation.

**Flow:**
1. User action triggers update
2. UI updates immediately (optimistic)
3. API request sent
4. On success: Keep update
5. On failure: Rollback update + show error

**Benefits:** Instant feedback, perceived performance

**Implementation in Source Edit:**
```typescript
// useUpdateSource hook performs optimistic updates
onMutate: async ({ id, data }) => {
  // Cancel outgoing queries
  await queryClient.cancelQueries({ queryKey: ['sources'] });

  // Snapshot current state
  const previousSources = queryClient.getQueryData(['sources']);

  // Optimistically update cache
  queryClient.setQueryData(['sources'], (old) =>
    old.map(s => s.id === id ? { ...s, ...data } : s)
  );

  return { previousSources }; // For rollback
},
onError: (_error, _variables, context) => {
  // Roll back on error
  queryClient.setQueryData(['sources'], context.previousSources);
}
```

---

### Race Condition

Situation where system behavior depends on timing of uncontrollable events.

**Example:** Multiple token refresh requests in parallel

**Solution:** Singleton pattern, request deduplication

---

### Singleton Pattern

Design pattern ensuring only one instance of a class.

**Implementation:**
```typescript
class TokenManager {
  private static instance: TokenManager | null = null;

  private constructor() { /* ... */ }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
}
```

**Usage:** TokenManager, CsrfTokenManager, API client

---

### Tree Shaking

Elimination of unused code during build.

**Requirements:**
- ES6 modules (import/export)
- Side-effect-free code
- Production build

**Benefits:** Smaller bundle size, faster load times

---

### Type Safety

Compile-time guarantee of type correctness.

**TypeScript Features:**
- Strict mode (`strict: true`)
- No implicit any (`noImplicitAny`)
- Null safety (`strictNullChecks`)
- Generated API types from OpenAPI spec

---

### Web Vitals

Google's metrics for web performance.

**Core Web Vitals:**
- **LCP (Largest Contentful Paint)**: Loading performance (< 2.5s)
- **FID (First Input Delay)**: Interactivity (< 100ms)
- **CLS (Cumulative Layout Shift)**: Visual stability (< 0.1)

---

## Related Documentation

- [Product Requirements](/Users/yujitsuchiya/catchup-feed-frontend/docs/product-requirements.md)
- [Functional Design](/Users/yujitsuchiya/catchup-feed-frontend/docs/functional-design.md)
- [Architecture](/Users/yujitsuchiya/catchup-feed-frontend/docs/architecture.md)
- [Repository Structure](/Users/yujitsuchiya/catchup-feed-frontend/docs/repository-structure.md)
- [Development Guidelines](/Users/yujitsuchiya/catchup-feed-frontend/docs/development-guidelines.md)

---

**Last Updated:** 2025-01-05
