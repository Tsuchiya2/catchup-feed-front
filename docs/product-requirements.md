# Product Requirements Document

**Product Name**: Catchup Feed Web
**Version**: 1.1.0
**Document Version**: 1.0
**Last Updated**: 2026-01-05

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [Target Users](#target-users)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [User Stories](#user-stories)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Success Metrics](#success-metrics)
9. [Technical Constraints](#technical-constraints)

---

## Product Vision

### Overview

Catchup Feed Web is a modern, web-based RSS/Atom feed aggregation platform that provides users with a centralized interface to consume content from multiple sources. The application leverages AI-powered summarization to help users quickly understand article content without reading full articles, addressing the information overload problem in today's digital landscape.

### Mission Statement

To provide knowledge workers, researchers, and information consumers with an efficient, privacy-respecting feed reader that saves time through AI-powered article summarization while maintaining a clean, accessible user interface.

### Value Proposition

- **Time Efficiency**: AI-generated summaries reduce reading time by 70%
- **Centralized Management**: Single interface for all RSS/Atom feeds
- **Modern UX**: Mobile-first responsive design with intuitive navigation
- **Security First**: JWT-based authentication with CSRF protection
- **Progressive Web App**: Installable app with offline capabilities

### Product Scope

**In Scope**:
- Article browsing and reading with AI summaries
- Feed source management (view, search, admin controls)
- User authentication and session management
- Responsive mobile and desktop interfaces
- Search and filtering capabilities
- Dashboard with statistics overview

**Out of Scope** (Current Version):
- Article bookmarking/favorites
- User-generated content or comments
- RSS feed subscription by end users (admin-only)
- Social sharing features
- Multi-language support

---

## Target Users

### Primary Audience

1. **Knowledge Workers** (40%)
   - Software developers, product managers, researchers
   - Need to stay updated on industry trends
   - Value time efficiency and content quality

2. **Content Curators** (30%)
   - Bloggers, writers, journalists
   - Aggregate content from multiple sources
   - Need quick content overview capabilities

3. **Tech Enthusiasts** (20%)
   - Early adopters of new technologies
   - Follow multiple tech blogs and news sites
   - Appreciate modern UI/UX patterns

4. **System Administrators** (10%)
   - Manage feed sources and user access
   - Monitor system health and content flow
   - Require advanced control features

### User Characteristics

**Technical Proficiency**:
- Intermediate to advanced computer users
- Comfortable with web applications
- Familiar with RSS/feed concepts

**Usage Patterns**:
- Daily to weekly check-ins
- Mobile and desktop usage (60/40 split)
- Average session: 5-15 minutes
- Peak usage: Morning (7-9 AM), Lunch (12-1 PM), Evening (6-8 PM)

**Geographic Distribution**:
- Global audience
- Primary markets: North America, Europe, Asia-Pacific
- English language interface

---

## User Personas

### Persona 1: Alex - Software Engineer

**Demographics**:
- Age: 28
- Location: San Francisco, CA
- Occupation: Full-stack Developer
- Tech Savvy: High

**Goals**:
- Stay updated on React, TypeScript, and Next.js developments
- Discover new tools and libraries
- Read during commute and lunch breaks

**Pain Points**:
- Too many blog subscriptions to manage
- Limited time to read full articles
- Difficulty finding relevant content

**Usage Scenario**:
```
Morning: Opens app on phone during commute
- Scans AI summaries of 10-15 new articles
- Marks 2-3 for detailed reading later
- Total time: 5 minutes

Lunch: Desktop review
- Reads full content of marked articles
- Searches for specific framework updates
- Total time: 15 minutes
```

### Persona 2: Sarah - Content Manager

**Demographics**:
- Age: 34
- Location: London, UK
- Occupation: Content Marketing Manager
- Tech Savvy: Medium

**Goals**:
- Curate industry news for team newsletter
- Identify trending topics in digital marketing
- Quickly assess article relevance

**Pain Points**:
- Information overload from multiple sources
- Need to quickly determine article quality
- Limited time for content curation

**Usage Scenario**:
```
Daily routine:
- Reviews dashboard statistics
- Searches articles by keyword (e.g., "SEO", "content strategy")
- Uses AI summaries to filter relevant content
- Exports links for team newsletter
- Total time: 20 minutes/day
```

### Persona 3: Mike - System Administrator

**Demographics**:
- Age: 42
- Location: Tokyo, Japan
- Occupation: DevOps Engineer
- Tech Savvy: Expert

**Goals**:
- Manage RSS feed sources for organization
- Monitor system health and data flow
- Ensure content quality and relevance

**Pain Points**:
- Need fine-grained control over feed sources
- Require visibility into system operations
- Must handle inactive or broken feeds

**Usage Scenario**:
```
Weekly maintenance:
- Reviews all feed sources (50+ sources)
- Toggles inactive sources on/off
- Adds new high-quality feeds
- Monitors last crawl timestamps
- Total time: 30 minutes/week
```

---

## Core Features

### 1. Authentication & Authorization

**Description**: Secure user authentication using JWT tokens with role-based access control.

**Implementation Details**:
```typescript
// JWT-based authentication (src/lib/api/endpoints/auth.ts)
- Login endpoint: POST /auth/token
- Token storage: localStorage with secure cookie backup
- Automatic token refresh with 5-minute threshold
- Grace period: 60 seconds for expired tokens
- Protected routes via Next.js middleware

// Role-based permissions (src/lib/auth/role.ts)
- Roles: 'admin' | 'user'
- Admin privileges: Toggle source active/inactive status
- User privileges: Read-only access to sources
```

**Security Measures**:
- CSRF protection with Double Submit Cookie pattern
- HTTP-only cookies for token storage
- Automatic session expiration handling
- Secure redirect flows on authentication failure

**Code Reference**:
```typescript
// src/middleware.ts (lines 42-157)
// Protected routes: /dashboard, /articles, /sources
// Public routes: /, /login
// Token validation with 30-second clock skew buffer
```

### 2. Dashboard

**Description**: Centralized overview page showing key statistics and recent articles.

**Features**:
- Total article count across all sources
- Total active feed sources count
- List of 10 most recent articles
- Real-time loading states with skeleton UI
- Error handling with retry capability

**Data Integration**:
```typescript
// src/hooks/useDashboardStats.ts
interface DashboardStats {
  totalArticles: number;      // From pagination.total
  totalSources: number;        // From sources.length
  recentArticles: Article[];   // Limited to 10 items
}

// API calls executed in parallel:
// - GET /articles?limit=10
// - GET /sources
```

**UI Components**:
- `StatisticsCard`: Displays metric with icon and loading state
- `RecentArticlesList`: Grid of recent article cards
- `ErrorMessage`: User-friendly error display with retry button

**Code Reference**: `src/app/(protected)/dashboard/page.tsx`

### 3. Article Management

#### 3.1 Article List View

**Description**: Paginated, searchable list of all articles with filtering capabilities.

**Features**:
- Pagination with configurable page sizes (10, 20, 50, 100 items)
- Search by keyword (title/content)
- Filter by source
- Filter by date range (from/to)
- Responsive card layout
- Empty states for no results

**Pagination Implementation**:
```typescript
// src/lib/constants/pagination.ts
DEFAULT_PAGE_SIZE: 20
MIN_PAGE_SIZE: 1
MAX_PAGE_SIZE: 100
AVAILABLE_PAGE_SIZES: [10, 20, 50, 100]

// Backend API returns:
{
  "data": Article[],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "total_pages": 13
  }
}
```

**Search Parameters**:
```typescript
interface ArticleSearchParams {
  keyword?: string;      // Search in title and summary
  source_id?: number;    // Filter by specific source
  from?: string;         // ISO 8601 date (e.g., "2025-01-01")
  to?: string;           // ISO 8601 date
  page?: number;         // Current page (1-indexed)
  limit?: number;        // Items per page
}
```

**Code Reference**: `src/app/(protected)/articles/page.tsx` (lines 1-230)

#### 3.2 Article Detail View

**Description**: Full article view with AI-generated summary and metadata.

**Features**:
- Article title and source attribution
- Publication date (relative time format)
- AI-generated summary in highlighted card
- Link to original article
- Breadcrumb navigation
- Back button to article list

**Article Data Model**:
```typescript
interface Article {
  id: number;
  source_id: number;
  source_name: string;        // Normalized display name
  title: string;
  url: string;                // Original article URL
  summary: string;            // AI-generated summary
  published_at: string;       // ISO 8601 timestamp
  created_at: string;         // ISO 8601 timestamp
}
```

**AI Summary Display**:
- Sparkles icon indicating AI-generated content
- Glowing border effect (cyber theme)
- Disclaimer footer about AI limitations
- Graceful fallback for missing summaries

**Code Reference**:
- Page: `src/app/(protected)/articles/[id]/page.tsx`
- Component: `src/components/articles/AISummaryCard.tsx`

#### 3.3 Article Search

**Description**: Advanced search interface with multiple filter types.

**Filter Components**:
1. **Keyword Search** (`SearchInput.tsx`)
   - Debounced input (300ms delay)
   - Real-time search as user types
   - Clear button to reset

2. **Source Filter** (`SourceFilter.tsx`)
   - Dropdown select of all sources
   - "All Sources" option
   - Live update on selection

3. **Date Range Filter** (`TypeFilter.tsx`)
   - From date picker
   - To date picker
   - ISO 8601 format

**Active Filters Display**:
- Visible chips showing applied filters
- Individual remove buttons per filter
- Clear all filters action

**Code Reference**: `src/components/articles/ArticleSearch.tsx`

### 4. Source Management

**Description**: RSS/Atom feed source catalog with admin controls.

**Features**:
- Grid layout of all feed sources
- Source search by keyword
- Active/inactive status indicators
- Last crawled timestamp
- Admin-only toggle controls

**Source Data Model**:
```typescript
interface Source {
  id: number;
  name: string;               // Feed display name
  feed_url: string;           // RSS/Atom feed URL
  active: boolean;            // Whether feed is being crawled
  last_crawled_at?: string | null;  // Last successful crawl
}
```

**Role-Based UI**:
```typescript
// Admin users see:
<ActiveToggle
  sourceId={source.id}
  isActive={source.active}
  onToggle={handleToggle}
/>

// Regular users see:
<StatusBadge active={source.active} />
// Badge shows "Active" (green) or "Inactive" (gray)
```

**Admin Operations**:
```typescript
// src/lib/api/endpoints/sources.ts
updateSourceActive(id: number, active: boolean): Promise<Source>

// Optimistic updates:
// 1. Update UI immediately
// 2. Call API endpoint: PUT /sources/{id} { active: boolean }
// 3. Invalidate query cache on success
// 4. Revert UI on error
```

**Add Source Dialog** (Admin Only):
```typescript
interface CreateSourceInput {
  name: string;        // Max 255 characters
  feedURL: string;     // Max 2048 characters, must be valid URL
}

// Validation:
// - Name: Required, trimmed, 1-255 characters
// - Feed URL: Required, valid HTTP/HTTPS URL
// - Duplicate check: Not implemented (backend handles)

// API: POST /sources
```

**Edit Source Dialog** (Admin Only):
```typescript
interface UpdateSourceInput {
  name: string;        // Max 255 characters
  feedURL: string;     // Max 2048 characters, must be valid URL
  active: boolean;     // Whether source is actively crawled
}

// Features:
// - Pre-populates form with current source data
// - Optimistic updates with rollback on error
// - Automatic cache invalidation on success
// - Full client-side validation matching backend requirements

// API: PUT /sources/{id}
```

**Code Reference**:
- Page: `src/app/(protected)/sources/__tests__/page.test.tsx` (comprehensive test suite)
- Components: `src/components/sources/`
  - `EditSourceDialog.tsx`: Edit source dialog wrapper
  - `SourceForm.tsx`: Reusable form for create/edit operations
- Hooks: `src/hooks/useUpdateSource.ts`
- Validation: `src/utils/validation/sourceValidation.ts`
- Config: `src/config/sourceConfig.ts`, `src/constants/source.ts`

### 5. Search & Filter System

**Description**: Global search and filtering across articles with debouncing and performance optimization.

**Search Modes**:
1. **Browse Mode**: Default article list (GET /articles)
2. **Search Mode**: Activated when filters applied (GET /articles/search)

**Debouncing Implementation**:
```typescript
// src/hooks/useDebounce.ts
function useDebounce<T>(value: T, delay: number = 300): T

// Usage in ArticleSearch component:
const debouncedKeyword = useDebounce(searchState.keyword, 300);
// Prevents API calls on every keystroke
// 300ms delay balances responsiveness and API load
```

**Search State Management**:
```typescript
interface ArticleSearchState {
  keyword: string;
  sourceId: number | null;
  fromDate: string | null;
  toDate: string | null;
}

// URL synchronization:
// - Search state persists in URL query params
// - Browser back/forward navigation works correctly
// - Shareable search result URLs
```

**Performance Optimizations**:
- React Query caching (60-second stale time)
- Conditional query execution (list OR search, not both)
- Skeleton loading states
- Optimistic UI updates

**Code Reference**: `src/hooks/useArticleSearch.ts`, `src/hooks/useDebounce.ts`

### 6. Progressive Web App (PWA)

**Description**: Installable web application with offline capabilities and native app feel.

**PWA Configuration**:
```typescript
// next.config.ts (lines 10-88)
withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})
```

**Caching Strategies**:

1. **Google Fonts** (CacheFirst):
   - 1-year cache lifetime
   - Max 10 entries

2. **Images** (CacheFirst):
   - 30-day cache lifetime
   - Max 100 entries
   - Formats: png, jpg, jpeg, svg, gif, webp

3. **Static Resources** (StaleWhileRevalidate):
   - JS, CSS, fonts
   - 1-day cache lifetime
   - Max 50 entries

4. **API Calls** (NetworkFirst):
   - 1-hour cache lifetime
   - 10-second network timeout
   - Fallback to cache on network failure

**Manifest Features**:
```json
{
  "name": "Catchup Feed",
  "short_name": "Catchup",
  "description": "Your personal feed aggregator and reader",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

**Code Reference**: `next.config.ts`, `src/config/pwa.config.ts`

### 7. Error Handling & User Feedback

**Description**: Comprehensive error handling with user-friendly messages and recovery options.

**Error Scenarios**:

1. **API Errors** (`src/lib/api/errors.ts`):
```typescript
class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;
}

class NetworkError extends Error {}
class TimeoutError extends Error {}
```

2. **HTTP Status Handlers**:
- **401 Unauthorized**: Auto-redirect to login, clear tokens
- **403 Forbidden**: Permission denied message
- **404 Not Found**: Resource not found message
- **500+ Server Errors**: Retry with exponential backoff

3. **CSRF Validation Failures**:
```typescript
// src/lib/api/client.ts (lines 189-278)
// - Clear invalid CSRF token
// - Reload page to obtain fresh token
// - Prevent infinite reload loops
// - Session storage flag for error state
```

**Retry Logic**:
```typescript
// Default retry configuration
{
  maxRetries: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2     // Exponential backoff
}

// Retryable errors:
// - Network errors
// - Timeout errors
// - 5xx server errors

// Non-retryable:
// - CSRF validation failures
// - 4xx client errors
```

**User Feedback Components**:
- `ErrorMessage`: Displays error with icon, message, and retry button
- `EmptyState`: Shows when no content available (with icon, title, description)
- `LoadingSpinner`: Animated loading indicator
- `Skeleton`: Placeholder loading states

**Code Reference**: `src/components/common/`, `src/lib/api/client.ts`

### 8. Observability & Monitoring

**Description**: Application performance monitoring and error tracking integration.

**Sentry Integration**:
```typescript
// sentry.client.config.ts, sentry.server.config.ts
{
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
}
```

**Custom Metrics** (`src/lib/observability/metrics.ts`):
```typescript
metrics.performance.apiLatency(endpoint, duration, statusCode);
metrics.error.api(endpoint, statusCode);
metrics.error.network();
metrics.login.tokenRefresh('success' | 'failure', reason?);
```

**Distributed Tracing**:
```typescript
// src/lib/observability/tracing.ts
addTracingHeaders(headers): Headers
startSpan(name, type, operation): Promise<T>

// Automatic trace ID propagation:
// - X-Trace-Id: Generated UUID for request correlation
// - X-Span-Id: Nested span identification
```

**Performance Monitoring**:
```typescript
// Performance marks in API calls
performance.mark('api-get-articles-start');
performance.mark('api-get-articles-end');
performance.measure('API: getArticles', start, end);

// Logged metrics:
// - API response time
// - Items returned
// - Pagination state
```

**Code Reference**: `src/lib/observability/`, `src/lib/api/client.ts`

---

## User Stories

### Epic 1: User Authentication

**US-1.1**: As a user, I want to log in with email and password so that I can access my personalized feed.
**US-1.2**: As a user, I want my session to persist across browser refreshes so that I don't have to log in repeatedly.
**US-1.3**: As a user, I want to be automatically redirected to my intended page after login so that I can continue where I left off.
**US-1.4**: As a user, I want my session to automatically refresh before expiration so that I'm not interrupted during use.

### Epic 2: Article Consumption

**US-2.1**: As a reader, I want to see a list of recent articles so that I can stay updated on new content.
**US-2.2**: As a reader, I want to read AI-generated summaries so that I can quickly understand article content.
**US-2.3**: As a reader, I want to click through to original articles so that I can read full content when interested.
**US-2.4**: As a reader, I want to see when articles were published so that I can prioritize recent content.
**US-2.5**: As a reader, I want to navigate through pages of articles so that I can browse all available content.

### Epic 3: Content Discovery

**US-3.1**: As a user, I want to search articles by keyword so that I can find specific topics.
**US-3.2**: As a user, I want to filter articles by source so that I can read content from preferred publications.
**US-3.3**: As a user, I want to filter articles by date range so that I can find content from specific time periods.
**US-3.4**: As a user, I want to see active filters so that I know what constraints are applied.
**US-3.5**: As a user, I want to clear filters easily so that I can reset my search.

### Epic 4: Source Management

**US-4.1**: As a user, I want to see all RSS feed sources so that I know what content is being aggregated.
**US-4.2**: As an admin, I want to add new feed sources so that I can expand content coverage.
**US-4.3**: As an admin, I want to toggle sources active/inactive so that I can control which feeds are crawled.
**US-4.4**: As a user, I want to see when sources were last crawled so that I know content freshness.
**US-4.5**: As a user, I want to search sources by name so that I can quickly find specific feeds.
**US-4.6**: As an admin, I want to edit existing sources so that I can correct errors or update feed URLs.

### Epic 5: Dashboard & Overview

**US-5.1**: As a user, I want to see total article count so that I understand content volume.
**US-5.2**: As a user, I want to see total source count so that I know how many feeds are tracked.
**US-5.3**: As a user, I want to see recent articles on the dashboard so that I can quickly access new content.

### Epic 6: Mobile Experience

**US-6.1**: As a mobile user, I want a responsive interface so that I can use the app on my phone.
**US-6.2**: As a mobile user, I want to install the app on my home screen so that I can access it like a native app.
**US-6.3**: As a mobile user, I want touch-friendly controls so that I can navigate easily.

### Epic 7: Performance & Reliability

**US-7.1**: As a user, I want fast page loads so that I can browse content efficiently.
**US-7.2**: As a user, I want to see loading indicators so that I know the app is working.
**US-7.3**: As a user, I want clear error messages so that I understand what went wrong.
**US-7.4**: As a user, I want a retry button on errors so that I can recover from failures.

---

## Acceptance Criteria

### Authentication (US-1.x)

**AC-1.1.1**: Login form validates email format before submission
**AC-1.1.2**: Login form shows error message for invalid credentials
**AC-1.1.3**: Successful login stores JWT token in localStorage and cookies
**AC-1.1.4**: Successful login redirects to /dashboard or original destination

**AC-1.2.1**: Page refresh with valid token maintains authenticated state
**AC-1.2.2**: Page refresh with expired token redirects to /login
**AC-1.2.3**: Protected routes check token validity via middleware

**AC-1.3.1**: Login page captures redirect parameter from URL
**AC-1.3.2**: After successful login, user is redirected to captured URL
**AC-1.3.3**: If no redirect parameter, default to /dashboard

**AC-1.4.1**: Token refresh triggers when less than 5 minutes remain
**AC-1.4.2**: Token refresh happens silently without user interaction
**AC-1.4.3**: Failed token refresh redirects to /login
**AC-1.4.4**: Maximum 3 retry attempts with exponential backoff (1s, 2s, 4s)

### Article List (US-2.1)

**AC-2.1.1**: Article list displays 20 articles per page by default
**AC-2.1.2**: Each article card shows: title, summary (150 chars max), source, published date
**AC-2.1.3**: Published dates display in relative format (e.g., "2 hours ago", "3 days ago")
**AC-2.1.4**: Articles are ordered by published_at descending (newest first)
**AC-2.1.5**: Loading state shows 10 skeleton cards
**AC-2.1.6**: Empty state shows when no articles exist with icon and message

### Article Detail (US-2.2, US-2.3)

**AC-2.2.1**: AI Summary card displays with sparkle icon and glow border
**AC-2.2.2**: Summary text preserves line breaks and formatting
**AC-2.2.3**: Summary card includes disclaimer footer about AI limitations
**AC-2.2.4**: Missing summary shows "No summary available" message

**AC-2.3.1**: Article header displays title, source name, published date
**AC-2.3.2**: Original article link opens in new tab
**AC-2.3.3**: Breadcrumb shows path: Articles > Article Title
**AC-2.3.4**: Back button returns to previous page

### Search & Filter (US-3.x)

**AC-3.1.1**: Keyword search debounces with 300ms delay
**AC-3.1.2**: Search triggers on Enter key or automatic after debounce
**AC-3.1.3**: Search matches against article title and summary
**AC-3.1.4**: Minimum 1 character required for search
**AC-3.1.5**: Clear button (X) resets search field

**AC-3.2.1**: Source filter dropdown lists all available sources
**AC-3.2.2**: "All Sources" option clears source filter
**AC-3.2.3**: Source filter updates URL with source_id parameter
**AC-3.2.4**: Selected source persists across page navigation

**AC-3.3.1**: Date range accepts ISO 8601 format (YYYY-MM-DD)
**AC-3.3.2**: From date must be before or equal to To date
**AC-3.3.3**: Invalid date formats show validation error
**AC-3.3.4**: Date range updates URL with from and to parameters

**AC-3.4.1**: Active filters display as dismissible chips
**AC-3.4.2**: Each filter chip shows filter type and value
**AC-3.4.3**: Clicking chip remove button clears individual filter
**AC-3.4.4**: Filter chips update in real-time with changes

**AC-3.5.1**: "Clear All" button visible when any filter is active
**AC-3.5.2**: Clear All resets all filters and URL parameters
**AC-3.5.3**: Clear All returns to page 1 of unfiltered results

### Pagination (US-2.5)

**AC-2.5.1**: Pagination controls show: Page X of Y, Total: Z articles
**AC-2.5.2**: First/Previous buttons disabled on page 1
**AC-2.5.3**: Next/Last buttons disabled on final page
**AC-2.5.4**: Page size selector offers: 10, 20, 50, 100 items
**AC-2.5.5**: Changing page size resets to page 1
**AC-2.5.6**: Page number persists in URL as ?page=X parameter
**AC-2.5.7**: Accessing invalid page number redirects to valid page

### Source Management (US-4.x)

**AC-4.1.1**: Sources display in responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
**AC-4.1.2**: Each source card shows: name, feed URL, active status, last crawled time
**AC-4.1.3**: Last crawled time shows relative format or "Never" if null
**AC-4.1.4**: Total source count displays: "Total: X source(s)"

**AC-4.2.1**: Add Source button visible only to admin users
**AC-4.2.2**: Add Source dialog validates name (1-255 chars, required)
**AC-4.2.3**: Add Source dialog validates feed URL (valid HTTP/HTTPS, required)
**AC-4.2.4**: Successful creation shows success message and closes dialog
**AC-4.2.5**: Failed creation shows error message inline
**AC-4.2.6**: API endpoint: POST /sources with { name, feedURL }

**AC-4.3.1**: Admin users see toggle switch for each source
**AC-4.3.2**: Regular users see status badge (Active/Inactive)
**AC-4.3.3**: Toggle switch reflects current active state
**AC-4.3.4**: Clicking toggle updates optimistically (instant UI feedback)
**AC-4.3.5**: Failed toggle reverts to previous state with error message
**AC-4.3.6**: API endpoint: PUT /sources/{id} with { active: boolean }

**AC-4.4.1**: Last crawled timestamp shows in timezone-aware format
**AC-4.4.2**: "Never" displays if last_crawled_at is null
**AC-4.4.3**: Timestamp updates automatically after successful crawl

**AC-4.5.1**: Source search filters by name (case-insensitive)
**AC-4.5.2**: Search results update as user types
**AC-4.5.3**: Empty search returns all sources
**AC-4.5.4**: No results shows empty state message

### Source Editing (US-4.6)

**AC-4.6.1**: Edit button visible only to admin users on source cards
**AC-4.6.2**: Edit dialog pre-populates with current source data (name, feed URL)
**AC-4.6.3**: Edit dialog validates name (1-255 chars, required)
**AC-4.6.4**: Edit dialog validates feed URL (valid HTTP/HTTPS, required)
**AC-4.6.5**: Successful edit shows optimistic update, then confirms from server
**AC-4.6.6**: Failed edit shows error message and rolls back optimistic update
**AC-4.6.7**: API endpoint: PUT /sources/{id} with { name, feedURL, active }
**AC-4.6.8**: Edit button has accessible ARIA label: "Edit source: {source_name}"
**AC-4.6.9**: Editing preserves source active status
**AC-4.6.10**: Cancel button closes dialog without saving changes

### Dashboard (US-5.x)

**AC-5.1.1**: Total articles displays numeric count from pagination.total
**AC-5.1.2**: Count updates automatically when new articles added
**AC-5.1.3**: Loading state shows skeleton card with pulsing animation
**AC-5.1.4**: Error state shows error message with retry button

**AC-5.2.1**: Total sources displays count of all sources (active + inactive)
**AC-5.2.2**: Count updates when sources added/removed
**AC-5.2.3**: Loading state shows skeleton card

**AC-5.3.1**: Recent articles limited to 10 most recent
**AC-5.3.2**: Articles ordered by published_at descending
**AC-5.3.3**: Each article clickable to detail page
**AC-5.3.4**: Empty state shows when no articles exist

### Mobile Experience (US-6.x)

**AC-6.1.1**: Layout responsive from 320px to 1920px viewport width
**AC-6.1.2**: Navigation menu collapses to hamburger on mobile (<768px)
**AC-6.1.3**: Touch targets minimum 44x44px for finger tapping
**AC-6.1.4**: Cards stack vertically on mobile, grid on desktop

**AC-6.2.1**: manifest.json defines app name, icons, theme colors
**AC-6.2.2**: Service worker registers for offline functionality
**AC-6.2.3**: "Add to Home Screen" prompt appears on supported browsers
**AC-6.2.4**: Installed app opens in standalone mode (no browser chrome)

**AC-6.3.1**: Buttons have minimum 44x44px touch target
**AC-6.3.2**: Swipe gestures supported for navigation where appropriate
**AC-6.3.3**: Form inputs have appropriate keyboard types (email, url, etc.)
**AC-6.3.4**: Inputs zoom to focus without zooming entire page

### Performance (US-7.x)

**AC-7.1.1**: Initial page load under 3 seconds on 3G connection
**AC-7.1.2**: Time to Interactive (TTI) under 5 seconds
**AC-7.1.3**: API responses cached for 60 seconds
**AC-7.1.4**: Images lazy-loaded below the fold

**AC-7.2.1**: Skeleton screens show during data fetching
**AC-7.2.2**: Loading spinner displays during mutations (create, update, delete)
**AC-7.2.3**: Button disabled states prevent double-submission
**AC-7.2.4**: Progress indicators show percentage for long operations

**AC-7.3.1**: Error messages identify specific failure reason
**AC-7.3.2**: 401 errors show "Authentication required" message
**AC-7.3.3**: 403 errors show "Permission denied" message
**AC-7.3.4**: 404 errors show "Resource not found" message
**AC-7.3.5**: 500 errors show "Server error, please try again" message
**AC-7.3.6**: Network errors show "Connection failed, check your internet" message

**AC-7.4.1**: Retry button visible on all error states
**AC-7.4.2**: Retry executes same request without page reload
**AC-7.4.3**: Retry shows loading indicator during execution
**AC-7.4.4**: Maximum 3 automatic retries for 5xx errors with exponential backoff

---

## Non-Functional Requirements

### Performance

**Response Time**:
- Page load (initial): < 3 seconds (3G connection)
- Page load (cached): < 1 second
- API response time: < 500ms (p95)
- Search results: < 1 second
- Filter application: < 300ms

**Throughput**:
- Support 100 concurrent users
- Handle 1000 API requests/minute
- Database queries: < 100ms (p95)

**Resource Usage**:
- Initial bundle size: < 500KB (gzipped)
- Runtime memory: < 50MB per session
- Cache storage: < 100MB per user

### Scalability

**Horizontal Scaling**:
- Stateless frontend (can add instances)
- Load balancer ready
- CDN integration for static assets

**Data Volume**:
- Support 10,000+ articles
- Support 100+ feed sources
- Handle 1000 articles/day ingestion rate

**User Load**:
- Design for 1000 daily active users
- Peak concurrent users: 100
- Graceful degradation under load

### Security

**Authentication**:
- JWT token-based authentication
- Token expiration: 24 hours (configurable)
- Automatic token refresh at 5-minute threshold
- Secure token storage (localStorage + httpOnly cookies)

**Authorization**:
- Role-based access control (admin/user)
- Middleware-level route protection
- API endpoint authorization checks

**Data Protection**:
- HTTPS only in production (enforced)
- CSRF protection (Double Submit Cookie pattern)
- XSS prevention (React auto-escaping)
- SQL injection prevention (parameterized queries backend)

**Security Headers**:
```typescript
// Implemented in next.config.ts
'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
'X-Frame-Options': 'SAMEORIGIN'
'X-Content-Type-Options': 'nosniff'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
'Content-Security-Policy': [CSP directives]
```

### Reliability

**Availability**:
- Target uptime: 99.5% (43.8 hours downtime/year)
- Planned maintenance windows: < 4 hours/month
- Automatic health checks every 30 seconds

**Error Handling**:
- Graceful degradation on API failures
- User-friendly error messages
- Automatic retry with exponential backoff (3 attempts)
- Error logging to Sentry

**Data Integrity**:
- Optimistic UI updates with rollback on failure
- Data validation on client and server
- Idempotent API operations

**Fault Tolerance**:
- Circuit breaker pattern for API calls
- Fallback to cached data when available
- Offline mode for previously loaded content (PWA)

### Usability

**Accessibility (WCAG 2.1 AA)**:
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels on interactive elements
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible
- Error messages announced to screen readers

**Internationalization**:
- Date/time formatting respects locale
- Number formatting (future: multi-language support)
- UTF-8 character support

**Browser Support**:
- Chrome 90+ (last 2 versions)
- Firefox 88+ (last 2 versions)
- Safari 14+ (last 2 versions)
- Edge 90+ (last 2 versions)
- Mobile Safari iOS 14+
- Chrome Android 90+

**Device Support**:
- Desktop: 1920x1080, 1366x768, 1280x720
- Tablet: 1024x768, 768x1024
- Mobile: 375x667, 414x896, 360x640

### Maintainability

**Code Quality**:
- TypeScript strict mode (no implicit any)
- ESLint + Prettier enforcement
- 80%+ test coverage target
- JSDoc comments on public APIs
- Component documentation with examples

**Testing**:
- Unit tests: Vitest + Testing Library
- Integration tests: Component interaction tests
- E2E tests: Playwright (planned)
- Visual regression tests (future)

**Development Workflow**:
- Git-based version control
- Conventional Commits for changelog generation
- Semantic versioning (SemVer)
- Automated CI/CD pipeline
- Code review required for merges

**Documentation**:
- README with setup instructions
- API documentation (OpenAPI spec)
- Component Storybook (planned)
- Architecture Decision Records (ADRs)

### Compatibility

**API Compatibility**:
- Backend API version: v1
- OpenAPI 3.0 specification
- Content-Type: application/json
- Character encoding: UTF-8

**Data Formats**:
- Dates: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- Timestamps: Unix epoch (seconds)
- URLs: RFC 3986 compliant

**Third-Party Dependencies**:
- React 19
- Next.js 15
- TanStack Query 5
- Tailwind CSS 4

---

## Success Metrics

### User Engagement

**Primary Metrics**:
- Daily Active Users (DAU): Target 500 in first 3 months
- Weekly Active Users (WAU): Target 1000 in first 3 months
- Monthly Active Users (MAU): Target 2000 in first 3 months
- DAU/MAU Ratio: Target > 25% (indicates sticky product)

**Session Metrics**:
- Average session duration: Target 10 minutes
- Sessions per user per week: Target 5
- Articles viewed per session: Target 8
- Bounce rate: Target < 40%

**Retention**:
- Day 1 retention: Target > 50%
- Day 7 retention: Target > 30%
- Day 30 retention: Target > 20%

### Feature Adoption

**Search & Filter Usage**:
- % of users using search: Target > 40%
- % of users using filters: Target > 30%
- Average filters applied per search: Target 1.5

**Article Consumption**:
- Articles with summary viewed: Target 80%
- Click-through to original article: Target 15%
- Average articles read per day: Target 12

**Source Management** (Admin Only):
- Active sources ratio: Target > 80%
- Average sources per admin: Target 20
- Source additions per week: Target 5

### Performance Metrics

**Page Load**:
- Initial load (P95): < 3 seconds
- Subsequent loads (P95): < 1 second
- Time to Interactive (P95): < 5 seconds

**API Performance**:
- API response time (P95): < 500ms
- API error rate: < 1%
- API timeout rate: < 0.5%

**User Experience**:
- Successful search rate: > 95%
- Error recovery rate: > 90% (users who retry after error)
- Zero-error sessions: > 80%

### Business Metrics

**Cost Efficiency**:
- Cost per active user: < $0.50/month
- Infrastructure cost: < $100/month (1000 users)
- API calls per user: Target 100/day

**Growth**:
- User acquisition rate: 10% month-over-month
- Viral coefficient: Target 0.5 (organic sharing)
- Content coverage: 100+ unique sources

### Quality Metrics

**Availability**:
- Uptime: > 99.5%
- Mean Time Between Failures (MTBF): > 720 hours (30 days)
- Mean Time To Recovery (MTTR): < 1 hour

**Code Quality**:
- Test coverage: > 80%
- TypeScript errors: 0
- ESLint errors: 0
- Lighthouse score: > 90 (Performance, Accessibility, Best Practices, SEO)

**User Satisfaction**:
- Net Promoter Score (NPS): Target > 30
- Customer Satisfaction (CSAT): Target > 4/5
- Support tickets per 100 users: < 5

---

## Technical Constraints

### Platform Constraints

**Frontend Framework**:
- Next.js 15 (App Router)
- React 19 (Server Components)
- Constraint: Cannot use class components (hooks only)
- Constraint: Server components cannot use browser APIs

**Backend Integration**:
- RESTful API (not GraphQL)
- JWT authentication (no OAuth providers)
- API base URL: Configurable via environment variable
- Constraint: Backend API must be running for development

**Browser APIs**:
- localStorage (token storage)
- sessionStorage (temporary flags)
- Cookies (CSRF tokens, session backup)
- Service Workers (PWA functionality)

### Development Constraints

**Language**:
- TypeScript 5.x (strict mode)
- No JavaScript (.js) files allowed
- No `any` types (enforced by ESLint)

**Build System**:
- Next.js build system (Webpack/Turbopack)
- No custom webpack configuration
- Build time: < 2 minutes (production)

**Package Manager**:
- npm (no yarn/pnpm requirement)
- Node.js 18+ required
- Dependency lock file required (package-lock.json)

**Code Style**:
- ESLint configuration: next/core-web-vitals
- Prettier for formatting
- Pre-commit hooks enforce style

### Runtime Constraints

**Memory**:
- Browser heap: < 50MB per session
- Node.js (SSR): < 512MB per instance

**Network**:
- API timeout: 30 seconds
- Retry delay: 1s, 2s, 4s (exponential backoff)
- Maximum payload size: 5MB

**Storage**:
- localStorage: < 10MB (browser limit ~5-10MB)
- Cache storage (PWA): < 100MB
- Session storage: < 5MB

### Security Constraints

**Token Management**:
- JWT tokens stored in localStorage (readable by JS)
- CSRF tokens in cookies (httpOnly where possible)
- Token expiration: Maximum 24 hours
- No sensitive data in localStorage

**API Communication**:
- HTTPS only in production
- CORS restrictions enforced
- Rate limiting: 100 requests/minute per user

**Content Security Policy**:
- No inline scripts (except 'unsafe-eval' for React)
- No external script domains (except trusted CDNs)
- Images allowed from any HTTPS source
- API calls restricted to configured backend URL

### Operational Constraints

**Deployment**:
- Vercel platform (primary)
- Cloudflare Pages (alternative)
- Static site generation not supported (uses SSR)
- Environment variables required for production

**Monitoring**:
- Sentry for error tracking
- Google Analytics for user analytics (future)
- Custom metrics via console logs (development)

**Backup & Recovery**:
- No database on frontend (stateless)
- User data stored on backend
- No backup requirements for frontend

### Third-Party Dependencies

**Required Libraries**:
- React 19 (framework)
- Next.js 15 (meta-framework)
- TanStack Query 5 (state management)
- Tailwind CSS 4 (styling)
- Radix UI (component primitives)
- Zod (validation)
- React Hook Form (forms)

**Optional Libraries**:
- Sentry (observability)
- next-pwa (PWA support)
- Storybook (component development)

**Version Constraints**:
- Major version updates require testing
- Security patches applied within 7 days
- Deprecated packages removed within 30 days

---

## Appendix

### Glossary

**AI Summary**: Machine-generated article summary created by backend AI service (Claude/OpenAI)

**Article**: Content item fetched from RSS/Atom feed, including title, URL, summary, and metadata

**CSRF Token**: Cross-Site Request Forgery protection token using Double Submit Cookie pattern

**Dashboard**: Overview page showing statistics and recent articles

**Feed Source**: RSS or Atom feed URL that the system crawls for articles

**JWT**: JSON Web Token used for stateless authentication

**Pagination**: Splitting large result sets across multiple pages

**Progressive Web App (PWA)**: Web application installable on devices with offline capabilities

**Protected Route**: Page requiring authentication to access

**Role**: User permission level (admin or user)

**Source**: RSS/Atom feed that provides article content

**Stale Time**: Duration React Query considers cached data fresh before refetching

### API Endpoints Reference

```
Authentication:
POST   /auth/token                    Login
POST   /auth/refresh                  Refresh token

Articles:
GET    /articles                      List articles (paginated)
GET    /articles/{id}                 Get article by ID
GET    /articles/search               Search articles

Sources:
GET    /sources                       List all sources
GET    /sources/{id}                  Get source by ID
POST   /sources                       Create source (admin only)
PUT    /sources/{id}                  Update source (admin only)
GET    /sources/search                Search sources

Health:
GET    /api/health                    Frontend health check
```

### Technology Stack Details

**Frontend**:
- Framework: Next.js 15.0.0 (App Router, React Server Components)
- UI Library: React 19.0.0
- Language: TypeScript 5.x (strict mode)
- Styling: Tailwind CSS 4.0.0
- UI Components: shadcn/ui (Radix UI primitives)
- State Management: TanStack Query 5.90.11
- Forms: React Hook Form 7.67.0 + Zod 4.1.13
- Icons: lucide-react 0.555.0

**Development Tools**:
- Testing: Vitest 4.0.14 + Testing Library 16.3.0
- E2E Testing: Playwright (configured, not actively used)
- Linting: ESLint 8.x + Prettier 3.7.2
- Type Generation: openapi-typescript 7.10.1
- Bundle Analysis: @next/bundle-analyzer 16.1.0
- Storybook: 8.5.0 (configured)

**Observability**:
- Error Tracking: Sentry 10.32.1
- Performance: Custom metrics + console logs
- Distributed Tracing: Custom implementation with trace IDs

**PWA**:
- Service Worker: next-pwa 5.6.0
- Workbox: 7.4.0

### Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:8080

# Optional - Observability
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ENV=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# Optional - Feature Flags
NEXT_PUBLIC_FEATURE_PWA=false
NEXT_PUBLIC_FEATURE_DARK_MODE=true
NEXT_PUBLIC_FEATURE_AI_SUMMARY=false
NEXT_PUBLIC_FEATURE_TOKEN_REFRESH=true

# Optional - Auth Configuration
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300
NEXT_PUBLIC_TOKEN_GRACE_PERIOD=60

# Optional - API Configuration
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRY_ATTEMPTS=3
NEXT_PUBLIC_API_RETRY_DELAY=1000

# Optional - App Identity
NEXT_PUBLIC_APP_NAME=Catchup Feed
NEXT_PUBLIC_APP_SHORT_NAME=Catchup
NEXT_PUBLIC_APP_DESCRIPTION=Your personal feed aggregator
NEXT_PUBLIC_APP_URL=https://catchup.example.com
```

### Data Models

**Article**:
```typescript
interface Article {
  id: number;              // Unique identifier
  source_id: number;       // Foreign key to source
  source_name: string;     // Denormalized source name
  title: string;           // Article title
  url: string;             // Original article URL
  summary: string;         // AI-generated summary
  published_at: string;    // ISO 8601 timestamp
  created_at: string;      // ISO 8601 timestamp
}
```

**Source**:
```typescript
interface Source {
  id: number;                      // Unique identifier
  name: string;                    // Display name
  feed_url: string;                // RSS/Atom feed URL
  active: boolean;                 // Crawling enabled
  last_crawled_at?: string | null; // Last successful crawl
}
```

**Pagination Metadata**:
```typescript
interface PaginationMetadata {
  page: number;          // Current page (1-indexed)
  limit: number;         // Items per page
  total: number;         // Total items across all pages
  total_pages: number;   // Total number of pages
}
```

---

**Document History**:
- 2026-01-05: Initial version created based on codebase analysis
- Generated from actual source code in /Users/yujitsuchiya/catchup-feed-frontend
