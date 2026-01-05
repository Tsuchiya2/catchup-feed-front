# Repository Structure

## Overview

Catchup Feed is a Next.js 15 TypeScript application using the App Router architecture. The project follows a modern frontend stack with React 19, TanStack Query for data fetching, Tailwind CSS for styling, and comprehensive testing with Vitest and Playwright.

**Project Name**: catchup-feed-web
**Version**: 1.1.0
**Framework**: Next.js 15 (App Router)
**Language**: TypeScript 5.0
**Package Manager**: npm

## Directory Tree

```
catchup-feed-frontend/
├── .claude/                    # Claude Code agent configurations
│   ├── agents/                 # Agent definitions for different phases
│   ├── commands/               # Custom Claude commands
│   ├── scripts/                # Automation scripts
│   └── skills/                 # Reusable agent skills
├── .next/                      # Next.js build output (generated)
├── .storybook/                 # Storybook configuration
├── coverage/                   # Test coverage reports (generated)
├── docs/                       # Documentation
│   ├── reports/                # Generated reports
│   └── screenshots/            # UI screenshots
├── evaluator-driven-agent-flow/ # EDAF workflow artifacts
├── public/                     # Static assets
│   ├── icons/                  # PWA icons and app icons
│   ├── catch-feed-icon.webp    # Main app logo
│   ├── manifest.json           # PWA manifest
│   ├── og-image.webp           # Open Graph image
│   └── sw.js                   # Service worker (generated)
├── scripts/                    # Build and utility scripts
├── src/                        # Source code (detailed below)
├── storybook-static/           # Storybook build output (generated)
├── temp-next/                  # Temporary Next.js files
├── tests/                      # E2E tests with Playwright
│   ├── e2e/                    # End-to-end test suites
│   │   ├── articles/           # Article-related E2E tests
│   │   ├── auth/               # Authentication E2E tests
│   │   ├── dashboard/          # Dashboard E2E tests
│   │   └── sources/            # Sources E2E tests
│   └── fixtures/               # Test fixtures and mock data
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── playwright.config.ts        # Playwright E2E test configuration
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest unit test configuration
```

## Source Directory (`src/`)

The `src/` directory contains all application source code, organized by feature and layer.

### Complete Source Structure

```
src/
├── __test__/                   # Test utilities and factories
│   └── factories/              # Mock data factories for tests
│       ├── articleFactory.ts   # Article entity factory
│       └── articleFactory.test.ts
├── app/                        # Next.js App Router (pages & routes)
│   ├── __tests__/              # App-level integration tests
│   ├── (auth)/                 # Auth route group (no layout)
│   │   ├── login/              # Login page
│   │   │   └── page.tsx        # Login page component
│   │   └── layout.tsx          # Auth layout (minimal)
│   ├── (legal)/                # Legal pages route group
│   │   ├── privacy/            # Privacy policy page
│   │   └── terms/              # Terms of service page
│   ├── (protected)/            # Protected route group (requires auth)
│   │   ├── articles/           # Articles feature
│   │   │   ├── [id]/           # Article detail page (dynamic route)
│   │   │   │   └── page.tsx    # Article detail view
│   │   │   └── page.tsx        # Articles list page
│   │   ├── dashboard/          # Dashboard feature
│   │   │   └── page.tsx        # Dashboard page (stats + recent articles)
│   │   ├── sources/            # Sources feature
│   │   │   ├── __tests__/      # Sources page tests
│   │   │   └── page.tsx        # Sources management page
│   │   └── layout.tsx          # Protected layout (with Header)
│   ├── api/                    # API routes (server-side)
│   │   ├── articles/           # Article-related API routes
│   │   │   └── search/         # Article search endpoint
│   │   │       └── route.ts    # GET /api/articles/search
│   │   └── health/             # Health check endpoint
│   │       └── route.ts        # GET /api/health
│   ├── error.tsx               # Global error boundary
│   ├── layout.tsx              # Root layout (providers, metadata)
│   ├── not-found.tsx           # 404 error page
│   ├── page.tsx                # Landing page (public)
│   └── globals.css             # Global styles and Tailwind base
├── components/                 # React components (organized by feature)
│   ├── articles/               # Article-related components
│   │   ├── AISummaryCard.tsx   # AI-generated summary display
│   │   ├── ArticleCard.tsx     # Article list item component
│   │   ├── ArticleHeader.tsx   # Article detail header
│   │   ├── ArticleSearch.tsx   # Article search form
│   │   └── *.test.tsx          # Component tests
│   ├── auth/                   # Authentication components
│   │   ├── LoginForm.tsx       # Login form with validation
│   │   └── *.test.tsx          # Component tests
│   ├── common/                 # Shared/common components
│   │   ├── __tests__/          # Common component tests
│   │   ├── Breadcrumb.tsx      # Navigation breadcrumbs
│   │   ├── EmptyState.tsx      # Empty state placeholder
│   │   ├── ErrorMessage.tsx    # Error message display
│   │   ├── FeatureGate.tsx     # Feature flag wrapper
│   │   ├── LoadingSpinner.tsx  # Loading indicator
│   │   ├── PageHeader.tsx      # Page header component
│   │   ├── Pagination.tsx      # Pagination controls
│   │   ├── PWAInstallPrompt.tsx # PWA installation prompt
│   │   ├── PWAUpdateNotification.tsx # PWA update notification
│   │   └── ThemeToggle.tsx     # Dark/light theme toggle
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── RecentArticlesList.tsx # Recent articles widget
│   │   ├── StatisticsCard.tsx  # Stat card component
│   │   └── *.test.tsx          # Component tests
│   ├── errors/                 # Error handling components
│   │   ├── __tests__/          # Error component tests
│   │   └── index.ts            # Error component exports
│   ├── layout/                 # Layout components
│   │   └── Header.tsx          # Main navigation header
│   ├── search/                 # Search-related components
│   │   ├── ActiveFilter.tsx    # Active filter chips
│   │   ├── SearchInput.tsx     # Search input field
│   │   ├── SourceFilter.tsx    # Source filter dropdown
│   │   ├── TypeFilter.tsx      # Type filter dropdown
│   │   └── *.test.tsx          # Component tests
│   ├── sources/                # Source management components
│   │   ├── __tests__/          # Source component tests
│   │   ├── ActiveToggle.tsx    # Source active/inactive toggle
│   │   ├── EditSourceDialog.tsx # Edit source dialog
│   │   ├── SourceForm.tsx      # Reusable form for create/edit
│   │   ├── SourceSearch.tsx    # Source search component
│   │   └── StatusBadge.tsx     # Source status badge
│   └── ui/                     # Shadcn/ui base components
│       ├── alert.tsx           # Alert component
│       ├── badge.tsx           # Badge component
│       ├── button.tsx          # Button component
│       ├── card.tsx            # Card component
│       ├── input.tsx           # Input component
│       ├── label.tsx           # Label component
│       ├── select.tsx          # Select dropdown component
│       ├── skeleton.tsx        # Skeleton loader
│       └── switch.tsx          # Switch toggle component
├── config/                     # Application configuration
│   ├── app.config.ts           # Main app config (API, auth, features)
│   ├── index.ts                # Config exports
│   ├── logging.config.ts       # Logging configuration
│   ├── pwa.config.ts           # PWA configuration
│   ├── security.config.ts      # Security settings
│   └── sourceConfig.ts         # Source management configuration
├── hooks/                      # Custom React hooks
│   ├── __tests__/              # Hook tests
│   ├── useArticle.ts           # Fetch single article
│   ├── useArticles.ts          # Fetch articles list with pagination
│   ├── useArticleSearch.ts     # Article search with filters
│   ├── useAuth.ts              # Authentication hook
│   ├── useCreateSource.ts      # Create source mutation
│   ├── useDashboardStats.ts    # Dashboard statistics
│   ├── useDebounce.ts          # Debounce utility hook
│   ├── useSources.ts           # Fetch sources list
│   ├── useSourceSearch.ts      # Source search with filters
│   └── useUpdateSource.ts      # Update source mutation
├── lib/                        # Library code (business logic & utilities)
│   ├── __tests__/              # Library tests
│   ├── api/                    # API client and endpoints
│   │   ├── endpoints/          # API endpoint functions
│   │   │   ├── __tests__/      # Endpoint tests
│   │   │   ├── articles.ts     # Article API endpoints
│   │   │   ├── auth.ts         # Authentication endpoints
│   │   │   └── sources.ts      # Source API endpoints
│   │   ├── utils/              # API utilities
│   │   │   ├── __tests__/      # API util tests
│   │   │   └── pagination.ts   # Pagination helpers
│   │   ├── client.ts           # API client (fetch wrapper)
│   │   └── errors.ts           # API error classes
│   ├── auth/                   # Authentication logic
│   │   ├── __tests__/          # Auth tests
│   │   ├── role.ts             # Role-based access control
│   │   ├── token.ts            # Token utilities
│   │   └── TokenManager.ts     # Token storage manager
│   ├── cache/                  # Caching utilities
│   ├── constants/              # Application constants
│   │   └── pagination.ts       # Pagination constants
│   ├── errors/                 # Error handling
│   │   └── __tests__/          # Error tests
│   ├── features/               # Feature flag management
│   │   ├── __tests__/          # Feature flag tests
│   │   └── index.ts            # Feature flag utilities
│   ├── logging/                # Logging utilities
│   ├── metrics/                # Metrics collection
│   ├── observability/          # Observability (tracing, metrics)
│   │   ├── index.ts            # Observability exports
│   │   ├── metrics.ts          # Custom metrics
│   │   └── tracing.ts          # Distributed tracing
│   ├── security/               # Security utilities
│   │   ├── __tests__/          # Security tests
│   │   ├── csrf.ts             # CSRF protection (server-side)
│   │   └── CsrfTokenManager.ts # CSRF token manager (client-side)
│   ├── utils/                  # General utilities
│   │   ├── formatDate.ts       # Date formatting
│   │   └── truncate.ts         # Text truncation
│   ├── validation/             # Validation schemas and utilities
│   │   └── __tests__/          # Validation tests
│   ├── logger.ts               # Structured logging
│   └── utils.ts                # Common utilities (cn, etc.)
├── providers/                  # React context providers
│   ├── QueryProvider.tsx       # TanStack Query provider
│   └── ThemeProvider.tsx       # Next-themes provider
├── stories/                    # Storybook stories
│   └── *.stories.tsx           # Component stories
├── types/                      # TypeScript type definitions
│   ├── api.d.ts                # API response types
│   └── next-pwa.d.ts           # PWA type augmentations
├── utils/                      # Utility functions
│   ├── article.ts              # Article utilities (validation, normalization)
│   ├── errorMessages.ts        # Error message utilities
│   ├── logger.ts               # Migration logger
│   ├── sourceTransformers.ts   # Source data transformers
│   └── validation/             # Validation utilities
│       └── sourceValidation.ts # Source form validation
└── middleware.ts               # Next.js middleware (auth & CSRF)
```

## Key Files and Their Purposes

### Root Configuration Files

#### `package.json`
- **Purpose**: Project metadata, dependencies, and npm scripts
- **Key Dependencies**:
  - Next.js 15.0.0 (React framework)
  - React 19.0.0 (UI library)
  - TanStack Query 5.90.11 (data fetching)
  - Tailwind CSS 4.0.0 (styling)
  - Zod 4.1.13 (validation)
  - Sentry (error tracking)
  - Jose (JWT handling)
- **Key Scripts**:
  - `dev`: Run development server
  - `build`: Build for production
  - `test`: Run Vitest unit tests
  - `test:e2e`: Run Playwright E2E tests
  - `generate:api`: Generate TypeScript types from OpenAPI spec
  - `storybook`: Run Storybook component explorer

#### `next.config.ts`
- **Purpose**: Next.js configuration
- **Features**:
  - PWA configuration with next-pwa
  - Security headers (CSP, HSTS, X-Frame-Options)
  - Bundle analyzer integration
  - Service worker caching strategies

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Key Settings**:
  - Strict mode enabled
  - Path alias: `@/*` maps to `./src/*`
  - JSX: preserve (handled by Next.js)
  - Target: ES2017

#### `vitest.config.ts`
- **Purpose**: Vitest unit test configuration
- **Settings**:
  - Environment: jsdom (DOM simulation)
  - Coverage provider: v8
  - Coverage thresholds: 80% lines, 80% functions, 75% branches
  - Excludes: E2E tests, Storybook stories, UI components

#### `playwright.config.ts`
- **Purpose**: Playwright E2E test configuration
- **Features**:
  - Multiple browsers: Chromium, Firefox, WebKit
  - Parallel execution
  - Screenshot on failure
  - Video recording for failed tests

### Application Entry Points

#### `src/app/layout.tsx`
- **Purpose**: Root layout for all pages
- **Responsibilities**:
  - Sets up global providers (QueryProvider, ThemeProvider)
  - Configures metadata and SEO
  - Includes PWA components (install prompt, update notification)
  - Applies global styles

#### `src/app/page.tsx`
- **Purpose**: Landing page (public homepage)
- **Features**:
  - Hero section with app branding
  - Feature highlights
  - Call-to-action button linking to login
  - Cyber/tech themed design

#### `src/middleware.ts`
- **Purpose**: Next.js Edge middleware for route protection
- **Responsibilities**:
  1. CSRF validation for state-changing requests (POST, PUT, DELETE, PATCH)
  2. JWT token validation and expiry checking
  3. Redirect unauthenticated users to /login
  4. Redirect authenticated users away from /login to /dashboard
  5. Set CSRF tokens for authenticated users

### Core Application Modules

#### API Client (`src/lib/api/`)

**`client.ts`**: Type-safe HTTP client
- Automatic JWT token injection
- Token refresh before expiry
- CSRF token handling (Double Submit Cookie pattern)
- Retry logic with exponential backoff
- Request timeout handling
- Distributed tracing headers
- Metrics collection (API latency, errors)
- Error handling (401 redirects to login)

**`endpoints/articles.ts`**: Article API functions
- `getArticles(query)`: Fetch paginated articles
- `searchArticles(params)`: Search articles with filters
- `getArticle(id)`: Fetch single article
- Article validation and normalization
- Performance measurement

**`endpoints/auth.ts`**: Authentication API
- Login with email/password
- Token refresh
- Logout

**`endpoints/sources.ts`**: Source management API
- Fetch sources list
- Create new source
- Update source
- Delete source

#### Authentication (`src/lib/auth/`)

**`TokenManager.ts`**: Centralized token storage
- In-memory storage with localStorage fallback
- Multi-tab synchronization via BroadcastChannel
- JWT expiry extraction and validation
- Automatic cleanup of expired tokens
- Private browsing mode support

**`token.ts`**: Token utility functions
- Token encoding/decoding
- Expiry checking
- Role extraction

**`role.ts`**: Role-based access control
- User role definitions
- Permission checking

#### Security (`src/lib/security/`)

**`csrf.ts`**: Server-side CSRF protection
- `generateCsrfToken()`: Cryptographically secure token generation (32 bytes)
- `setCsrfToken(response)`: Set CSRF token in cookie and header
- `validateCsrfToken(request)`: Validate Double Submit Cookie pattern
- `timingSafeEqual()`: Constant-time string comparison (prevents timing attacks)
- Used in middleware for all state-changing requests

**`CsrfTokenManager.ts`**: Client-side CSRF token management
- Read CSRF token from response headers
- Store token in memory
- Add token to request headers
- Clear token on logout

#### Observability (`src/lib/observability/`)

**`tracing.ts`**: Distributed tracing
- Request ID generation
- Span creation for operations
- User context tracking
- Breadcrumb logging

**`metrics.ts`**: Custom metrics collection
- API latency tracking
- Error rate monitoring
- User interaction metrics
- Performance metrics

**`logger.ts`**: Structured logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Environment-based formatting (JSON in production, pretty in dev)
- Sampling for high-volume logs
- Error stack traces

#### Configuration (`src/config/`)

**`app.config.ts`**: Centralized application configuration
- App identity (name, description, URLs)
- API configuration (base URL, timeout, retries)
- Auth configuration (token refresh threshold, storage keys)
- Feature flags (PWA, dark mode, AI summary, token refresh)
- Observability configuration (Sentry DSN, trace sample rate)
- Environment detection (development, production, test)

### Custom Hooks (`src/hooks/`)

All hooks use TanStack Query for data fetching with:
- Automatic caching (60s stale time, 5min garbage collection)
- Retry logic (1 retry attempt)
- Window focus refetch
- Loading and error states

**Data Fetching Hooks**:
- `useArticles(query)`: Fetch paginated articles with filters
- `useArticle(id)`: Fetch single article by ID
- `useArticleSearch(params)`: Search articles with keyword, date range, source filter
- `useSources()`: Fetch all sources
- `useSourceSearch(query)`: Search sources
- `useDashboardStats()`: Fetch dashboard statistics

**Mutation Hooks**:
- `useCreateSource()`: Create new source with optimistic updates
- `useUpdateSource()`: Update existing source with optimistic updates and rollback

**Utility Hooks**:
- `useAuth()`: Authentication state and actions (login, logout)
- `useDebounce(value, delay)`: Debounce value changes for search inputs

### Components (`src/components/`)

#### UI Components (`src/components/ui/`)
Shadcn/ui base components with Tailwind CSS and Radix UI primitives:
- `button.tsx`: Button with variants (default, outline, ghost, glow)
- `card.tsx`: Card container with header, content, footer sections
- `input.tsx`: Form input field
- `select.tsx`: Dropdown select with Radix UI
- `badge.tsx`: Badge for labels and tags
- `alert.tsx`: Alert messages
- `skeleton.tsx`: Loading skeleton placeholder
- `switch.tsx`: Toggle switch

#### Feature Components

**Articles (`src/components/articles/`)**:
- `ArticleCard.tsx`: Article list item with title, summary, metadata, hover effects
- `ArticleHeader.tsx`: Article detail page header with title, metadata, actions
- `AISummaryCard.tsx`: AI-generated summary display (feature-gated)
- `ArticleSearch.tsx`: Search form with keyword, date range, source filter

**Auth (`src/components/auth/`)**:
- `LoginForm.tsx`: Login form with email/password validation, error handling

**Dashboard (`src/components/dashboard/`)**:
- `StatisticsCard.tsx`: Stat card showing count with icon
- `RecentArticlesList.tsx`: Recent articles widget with loading states

**Common (`src/components/common/`)**:
- `Pagination.tsx`: Pagination controls with page numbers, previous/next, items per page selector
- `PageHeader.tsx`: Page header with title, description, actions
- `ErrorMessage.tsx`: Error message display with retry button
- `EmptyState.tsx`: Empty state placeholder with icon and message
- `LoadingSpinner.tsx`: Loading spinner with cyber glow effect
- `Breadcrumb.tsx`: Navigation breadcrumbs
- `FeatureGate.tsx`: Feature flag wrapper component
- `PWAInstallPrompt.tsx`: PWA installation prompt banner
- `PWAUpdateNotification.tsx`: PWA update notification
- `ThemeToggle.tsx`: Dark/light theme toggle button

**Layout (`src/components/layout/`)**:
- `Header.tsx`: Main navigation header with logo, nav links, theme toggle, logout

#### Search Components (`src/components/search/`)
- `SearchInput.tsx`: Search input with debounce
- `SourceFilter.tsx`: Source filter dropdown
- `TypeFilter.tsx`: Type filter dropdown
- `ActiveFilter.tsx`: Active filter chips with remove button

#### Source Components (`src/components/sources/`)
- `SourceSearch.tsx`: Source search form
- `StatusBadge.tsx`: Source status badge (active/inactive)
- `ActiveToggle.tsx`: Toggle source active/inactive

### Type Definitions (`src/types/`)

**`api.d.ts`**: TypeScript types for API responses
- Authentication types: `LoginRequest`, `LoginResponse`, `RefreshTokenResponse`
- Article types: `Article`, `ArticlesQuery`, `ArticlesResponse`
- Source types: `Source`, `SourcesResponse`
- Pagination types: `PaginatedResponse<T>`, `PaginationMetadata`, `PaginationInfo`
- Error types: `ApiErrorResponse`

### Routing Structure

#### App Router Organization

**Route Groups**: Next.js route groups organize routes without affecting URL structure.

1. **`(auth)`**: Minimal layout for authentication pages
   - `/login`: Login page
   - Layout: No header, centered content

2. **`(protected)`**: Requires authentication, includes Header navigation
   - `/dashboard`: Dashboard with stats and recent articles
   - `/articles`: Articles list with search and filters
   - `/articles/[id]`: Article detail page (dynamic route)
   - `/sources`: Source management page
   - Layout: Header with navigation, logout button

3. **`(legal)`**: Public legal pages
   - `/terms`: Terms of service
   - `/privacy`: Privacy policy

4. **Public Routes** (no group):
   - `/`: Landing page

#### API Routes (`src/app/api/`)

Server-side API routes for backend proxy and health checks:
- `GET /api/health`: Health check endpoint
- `GET /api/articles/search`: Article search (server-side)

### Testing Structure

#### Unit Tests (Vitest)
- Co-located with source files: `*.test.ts`, `*.test.tsx`
- Test factories in `src/__test__/factories/`
- Coverage thresholds: 80% lines, 75% branches

#### E2E Tests (Playwright)
Organized by feature in `tests/e2e/`:
- `articles/`: Article browsing, search, detail view
- `auth/`: Login, logout, token refresh
- `dashboard/`: Dashboard stats, navigation
- `sources/`: Source management (CRUD operations)

#### Component Stories (Storybook)
Stories in `src/stories/` and co-located `*.stories.tsx` files:
- UI components: Button, Card, Input, etc.
- Feature components: ArticleCard, LoginForm, etc.

### Build Output

#### `.next/`
Next.js build artifacts:
- Server-side code
- Client-side bundles
- Static assets
- Type definitions

#### `public/`
Static files served at root:
- `catch-feed-icon.webp`: App logo (119KB WebP image)
- `manifest.json`: PWA manifest with app metadata, icons, theme colors
- `og-image.webp`: Open Graph image for social sharing
- `sw.js`: Service worker (generated by next-pwa)
- `icons/`: PWA icons in multiple sizes (192x192, 512x512)

## Module Architecture

### Layered Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, Hooks)             │
│  - src/app/                             │
│  - src/components/                      │
│  - src/hooks/                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (Domain Logic, Validation)             │
│  - src/lib/validation/                  │
│  - src/utils/                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (API Client, Endpoints)                │
│  - src/lib/api/client.ts                │
│  - src/lib/api/endpoints/               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  (Auth, Logging, Metrics)               │
│  - src/lib/auth/                        │
│  - src/lib/observability/               │
│  - src/lib/security/                    │
└─────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: User interacts with component (e.g., click "Load Articles")
2. **Hook Invocation**: Component calls custom hook (e.g., `useArticles()`)
3. **TanStack Query**: Hook uses TanStack Query for caching and state management
4. **API Endpoint**: Query calls endpoint function (e.g., `getArticles()`)
5. **API Client**: Endpoint uses `apiClient.get()` for HTTP request
6. **Backend API**: Client sends authenticated request to backend
7. **Response**: Data flows back through layers with transformations
8. **Cache Update**: TanStack Query updates cache
9. **Component Re-render**: Component re-renders with new data

### Import/Export Patterns

#### Path Aliases
All imports use `@/` alias for clean imports:
```typescript
import { apiClient } from '@/lib/api/client';
import { useArticles } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
```

#### Barrel Exports
Index files re-export for cleaner imports:
```typescript
// src/lib/observability/index.ts
export { startSpan, addTracingHeaders } from './tracing';
export { metrics } from './metrics';

// Usage
import { startSpan, metrics } from '@/lib/observability';
```

#### Type-Only Imports
Separate type imports for clarity:
```typescript
import type { Article, ArticlesQuery } from '@/types/api';
import { getArticles } from '@/lib/api/endpoints/articles';
```

### Code Organization Principles

1. **Feature-Based Organization**: Components grouped by feature (articles, auth, dashboard, sources)
2. **Separation of Concerns**: UI (components), logic (hooks, lib), types (types/)
3. **Colocation**: Tests co-located with source files
4. **Single Responsibility**: Each file has a clear, focused purpose
5. **Dependency Direction**: Higher layers depend on lower layers, never the reverse

### Naming Conventions

- **Files**: PascalCase for components (`ArticleCard.tsx`), camelCase for utilities (`formatDate.ts`)
- **Directories**: lowercase for features (`articles/`), PascalCase for components with barrel exports
- **Components**: PascalCase with descriptive names (`AISummaryCard`, `RecentArticlesList`)
- **Hooks**: camelCase starting with "use" (`useArticles`, `useDebounce`)
- **Functions**: camelCase descriptive verbs (`getArticles`, `validateCsrfToken`)
- **Constants**: UPPER_SNAKE_CASE (`PAGINATION_CONFIG`, `DEFAULT_RETRY_CONFIG`)
- **Types/Interfaces**: PascalCase (`Article`, `PaginationInfo`, `LoginRequest`)

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run tests: `npm run test`
4. Run E2E tests: `npm run test:e2e`
5. Launch Storybook: `npm run storybook`

### Type Generation
Generate API types from backend OpenAPI spec:
```bash
npm run generate:api
```
This creates `src/types/api.d.ts` from `http://localhost:8080/swagger/doc.json`

### Testing Strategy
- **Unit Tests**: Component logic, hooks, utilities (Vitest)
- **Integration Tests**: API endpoints, page interactions (Vitest)
- **E2E Tests**: User flows, critical paths (Playwright)
- **Visual Tests**: Component variations (Storybook)

### Build Process
1. Type checking: TypeScript compiler
2. Linting: ESLint
3. Formatting: Prettier
4. Unit tests: Vitest with coverage
5. E2E tests: Playwright
6. Build: Next.js production build
7. PWA generation: Service worker and manifest

## Key Technical Decisions

### Why App Router?
- Server Components for better performance
- Streaming and Suspense support
- Improved data fetching patterns
- Built-in layouts and nested routing

### Why TanStack Query?
- Automatic caching and background refetching
- Request deduplication
- Optimistic updates
- Error and loading states management
- DevTools for debugging

### Why Tailwind CSS?
- Utility-first approach for rapid development
- Consistent design system
- Small bundle size (unused styles purged)
- Easy theming (dark mode support)

### Why Double Submit Cookie for CSRF?
- No server-side session state required
- Works with stateless JWT authentication
- Simple to implement in middleware
- Cryptographically secure token generation
- Constant-time comparison prevents timing attacks

### Why Middleware for Auth?
- Edge runtime for fast execution
- Runs before page rendering
- Centralized auth logic
- Automatic redirects
- CSRF validation for all state-changing requests

## Security Features

1. **Authentication**: JWT tokens with automatic refresh
2. **CSRF Protection**: Double Submit Cookie pattern
3. **Security Headers**: CSP, HSTS, X-Frame-Options
4. **Token Storage**: In-memory with localStorage fallback
5. **Constant-Time Comparison**: Prevents timing attacks
6. **Token Expiry**: Automatic cleanup of expired tokens
7. **Multi-Tab Sync**: BroadcastChannel for token synchronization

## Performance Optimizations

1. **Code Splitting**: Automatic by Next.js App Router
2. **Image Optimization**: Next.js Image component
3. **Font Optimization**: Next.js Font with Inter variable font
4. **Caching**: TanStack Query with 60s stale time
5. **PWA**: Service worker for offline support
6. **Lazy Loading**: Dynamic imports for heavy components
7. **Memoization**: React.memo for list items
8. **Debouncing**: Search inputs with useDebounce hook

## Observability

1. **Logging**: Structured logging with log levels
2. **Tracing**: Distributed tracing with request IDs
3. **Metrics**: Custom metrics for API latency, errors
4. **Error Tracking**: Sentry integration
5. **Performance**: Performance API measurements

---

**Last Updated**: 2026-01-05
**Maintained By**: Development Team
**Related Docs**:
- [Product Requirements](./product-requirements.md)
- [Functional Design](./functional-design.md)
- [Development Guidelines](./development-guidelines.md)
