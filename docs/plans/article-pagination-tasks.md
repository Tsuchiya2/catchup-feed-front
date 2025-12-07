# Article Pagination Implementation Tasks

## Overview

This task plan provides a detailed breakdown for implementing frontend support for the new paginated API response format. The backend API has been updated to return article lists with pagination metadata, and the frontend needs to be adapted to handle this new structure while adding user-configurable page sizes and comprehensive observability features.

### Goals

- Update type definitions to reflect the new API response format
- Modify API client functions to handle the new paginated structure
- Update React hooks to extract and provide pagination metadata
- Add items per page selector for user-configurable page sizes
- Implement comprehensive observability for performance and debugging
- Ensure reliability through input validation and edge case handling
- Design reusable abstractions for future entity pagination

## Prerequisites

- Backend API already returns paginated response format
- All authentication and routing infrastructure is in place
- Existing `Pagination` component is functional
- TypeScript and React Query are configured

## Task Breakdown

### Phase 1: Type Definitions and Configuration

#### Task 1.1: Add Pagination Type Definitions

**Description:** Add core pagination interfaces to the TypeScript type definitions file.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/types/api.d.ts`

**Implementation Details:**
```typescript
/**
 * Pagination metadata from backend API
 */
export interface PaginationMetadata {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 * Enables pagination for any entity type
 * @template T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Paginated articles response
 */
export interface PaginatedArticlesResponse extends PaginatedResponse<Article> {}
```

**Acceptance Criteria:**
- `PaginationMetadata` interface is defined with all required fields
- Generic `PaginatedResponse<T>` type is defined
- `PaginatedArticlesResponse` interface extends the generic type
- All types have proper JSDoc comments
- TypeScript compilation succeeds

**Estimated Complexity:** Low

---

#### Task 1.2: Update ArticlesResponse Type

**Description:** Update the existing `ArticlesResponse` type to use the new paginated format.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/types/api.d.ts`

**Implementation Details:**
```typescript
/**
 * Articles list response
 * Updated to use paginated format
 */
export type ArticlesResponse = PaginatedArticlesResponse;
```

**Acceptance Criteria:**
- `ArticlesResponse` now aliases to `PaginatedArticlesResponse`
- No breaking changes to other type definitions
- TypeScript compilation succeeds

**Estimated Complexity:** Low

**Dependencies:** Task 1.1

---

#### Task 1.3: Add Pagination Configuration Constants

**Description:** Create centralized pagination configuration that can be imported and reused across the application.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/types/api.d.ts`

**Implementation Details:**
```typescript
/**
 * Centralized pagination configuration
 */
export const PAGINATION_CONFIG = {
  /** Default page number */
  DEFAULT_PAGE: 1,
  /** Default items per page */
  DEFAULT_LIMIT: 10,
  /** Available page size options */
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const,
  /** Maximum items per page */
  MAX_LIMIT: 100,
  /** Minimum items per page */
  MIN_LIMIT: 10,
} as const;

export type PageSize = typeof PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES[number];
```

**Acceptance Criteria:**
- `PAGINATION_CONFIG` constant is defined with all configuration values
- `PageSize` type is derived from available page sizes
- Configuration is exported and can be imported elsewhere
- TypeScript compilation succeeds

**Estimated Complexity:** Low

**Dependencies:** Task 1.1

---

#### Task 1.4: Create Pagination Utility Module

**Description:** Create a new utility module with reusable pagination functions that can be used across different entities.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/utils/pagination.ts` (new file)

**Implementation Details:**
```typescript
import { PAGINATION_CONFIG } from '@/types/api';

/**
 * Build pagination query string from parameters
 */
export function buildPaginationQuery(page?: number, limit?: number): string {
  const params = new URLSearchParams();

  const validPage = page && page > 0 ? page : PAGINATION_CONFIG.DEFAULT_PAGE;
  const validLimit = limit && PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES.includes(limit as any)
    ? limit
    : PAGINATION_CONFIG.DEFAULT_LIMIT;

  params.set('page', validPage.toString());
  params.set('limit', validLimit.toString());

  return `?${params.toString()}`;
}

/**
 * Extract pagination metadata from API response
 * Converts snake_case to camelCase
 */
export function extractPaginationMetadata(pagination: {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: pagination.total_pages,
  };
}

/**
 * Validate query parameters from URL
 */
export function validatePaginationParams(params: URLSearchParams): {
  page: number;
  limit: number;
} {
  const pageParam = params.get('page');
  const limitParam = params.get('limit');

  let page = PAGINATION_CONFIG.DEFAULT_PAGE;
  let limit = PAGINATION_CONFIG.DEFAULT_LIMIT;

  if (pageParam) {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed;
    }
  }

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES.includes(parsed as any)) {
      limit = parsed;
    }
  }

  return { page, limit };
}

/**
 * Check if page number is valid for given total pages
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page > 0 && page <= totalPages;
}
```

**Acceptance Criteria:**
- New file `pagination.ts` is created in the correct directory
- All four utility functions are implemented
- Functions use `PAGINATION_CONFIG` for defaults
- Functions handle edge cases (negative numbers, invalid values)
- TypeScript compilation succeeds
- Functions can be imported in other modules

**Estimated Complexity:** Medium

**Dependencies:** Task 1.3

---

### Phase 2: API Client Updates

#### Task 2.1: Add Response Validation Function

**Description:** Create a validation function to verify the structure of paginated API responses.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/endpoints/articles.ts`

**Implementation Details:**
```typescript
/**
 * Validate paginated response structure
 */
function validatePaginatedResponse<T>(
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
    console.error(`[API] Invalid response from ${endpoint}: Missing or invalid 'pagination' object`);
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

**Acceptance Criteria:**
- Function validates response is an object
- Function validates `data` is an array
- Function validates `pagination` object exists
- Function validates all required pagination fields are numbers
- Function logs detailed error messages for debugging
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 1.1

---

#### Task 2.2: Update getArticles() Function

**Description:** Update the `getArticles()` function to handle the new paginated response format, add validation, and implement performance monitoring.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/endpoints/articles.ts`

**Implementation Details:**
- Change API response type to `PaginatedArticlesResponse`
- Update iteration loop to use `response.data` instead of `response`
- Add performance measurement using Performance API
- Add response validation using `validatePaginatedResponse()`
- Update logging to reflect new structure
- Enhance error logging with full context (timestamp, query, stack)
- Return paginated response object

**Acceptance Criteria:**
- Function returns `Promise<PaginatedArticlesResponse>`
- Performance marks are created at start and end of function
- Performance measurement is logged to console
- Response structure is validated before processing
- Article validation loop iterates over `response.data`
- Normalized articles are returned in `{ data, pagination }` format
- Error logging includes timestamp, endpoint, query, and stack trace
- Performance marks are cleaned up on error
- All existing article validation logic is preserved
- TypeScript compilation succeeds

**Estimated Complexity:** High

**Dependencies:** Task 1.1, Task 2.1

---

#### Task 2.3: Update searchArticles() Function

**Description:** Apply the same updates to `searchArticles()` as were done to `getArticles()`.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/endpoints/articles.ts`

**Implementation Details:**
- Same pattern as Task 2.2 but for search endpoint
- Change response type to `PaginatedArticlesResponse`
- Add performance monitoring
- Add response validation
- Update logging
- Enhance error handling

**Acceptance Criteria:**
- Function returns `Promise<PaginatedArticlesResponse>`
- Performance measurement is implemented
- Response validation is implemented
- Article iteration uses `response.data`
- Paginated response is returned
- Error logging includes full context
- Search-specific query parameters are preserved
- TypeScript compilation succeeds

**Estimated Complexity:** High

**Dependencies:** Task 2.2

---

### Phase 3: Hook Updates

#### Task 3.1: Update useArticles Hook

**Description:** Update the `useArticles` hook to extract pagination metadata from the new API response format.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/useArticles.ts`

**Implementation Details:**
- Extract `data` and `pagination` from API response
- Remove manual pagination calculations
- Use backend pagination metadata for all pagination info
- Use `extractPaginationMetadata()` utility for consistency
- Provide sensible defaults when data is undefined

**Current code to replace:**
```typescript
const articles = Array.isArray(data) ? data : [];
const total = articles.length;

return {
  articles,
  pagination: {
    page: query?.page ?? 1,
    limit: query?.limit ?? 10,
    total,
    totalPages: Math.ceil(total / (query?.limit ?? 10)),
  },
  // ...
};
```

**New code:**
```typescript
const articles = data?.data ?? [];
const paginationMetadata = data?.pagination;

return {
  articles,
  pagination: paginationMetadata
    ? extractPaginationMetadata(paginationMetadata)
    : {
        page: query?.page ?? 1,
        limit: query?.limit ?? 10,
        total: 0,
        totalPages: 0,
      },
  // ...
};
```

**Acceptance Criteria:**
- Hook extracts articles from `data?.data`
- Hook extracts pagination from `data?.pagination`
- Manual pagination calculation is removed
- `extractPaginationMetadata()` utility is used
- Sensible defaults are provided for undefined data
- Return type remains unchanged
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 2.2, Task 1.4

---

#### Task 3.2: Update useArticleSearch Hook

**Description:** Apply the same updates to `useArticleSearch` hook as were done to `useArticles`.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/useArticleSearch.ts`

**Implementation Details:**
- Same pattern as Task 3.1
- Extract `data` and `pagination` from response
- Remove manual calculation
- Use `extractPaginationMetadata()` utility
- Maintain search-specific query key structure

**Acceptance Criteria:**
- Hook extracts pagination metadata correctly
- Manual calculation is removed
- Utility function is used
- Search query key remains separate from regular articles
- Return type remains unchanged
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 3.1

---

### Phase 4: UI Component Updates

#### Task 4.1: Add Items Per Page Selector to Pagination Component

**Description:** Update the `Pagination` component to include an items per page selector dropdown.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/components/common/Pagination.tsx`

**Implementation Details:**
- Add new props: `onItemsPerPageChange?`, `availablePageSizes?`
- Create select dropdown for page size selection
- Display current `itemsPerPage` as selected value
- Trigger `onItemsPerPageChange` callback when selection changes
- Style dropdown to match existing design system
- Add proper ARIA labels for accessibility

**New Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  // New props
  onItemsPerPageChange?: (limit: number) => void;
  availablePageSizes?: number[];
}
```

**Acceptance Criteria:**
- New props are added to `PaginationProps` interface
- Items per page selector is rendered in the component
- Default `availablePageSizes` is `[10, 20, 50, 100]`
- Current `itemsPerPage` is displayed as selected option
- Changing selection calls `onItemsPerPageChange` callback
- Component maintains existing styling and layout
- ARIA labels are added for accessibility
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 1.3

---

#### Task 4.2: Add Page Size Change Handler to Articles Page

**Description:** Add functionality to the Articles page to handle items per page changes and update the URL accordingly.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/app/(protected)/articles/page.tsx`

**Implementation Details:**
- Add `handleItemsPerPageChange` function
- Update URL with new `limit` parameter
- Reset to page 1 when limit changes
- Pass `onItemsPerPageChange` to Pagination component
- Pass `availablePageSizes` from `PAGINATION_CONFIG`

**New Handler:**
```typescript
const handleItemsPerPageChange = (newLimit: number) => {
  const params = new URLSearchParams(searchParams);
  params.set('limit', newLimit.toString());
  params.set('page', '1'); // Reset to first page
  router.push(`/articles?${params.toString()}`);
};
```

**Acceptance Criteria:**
- `handleItemsPerPageChange` function is implemented
- Function updates URL with new limit parameter
- Function resets page to 1
- `onItemsPerPageChange` prop is passed to Pagination component
- `availablePageSizes` from `PAGINATION_CONFIG` is passed to component
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 4.1, Task 1.3

---

#### Task 4.3: Add URL Parameter Validation

**Description:** Add validation for URL query parameters to prevent invalid page numbers and limits.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/app/(protected)/articles/page.tsx`

**Implementation Details:**
- Import `validatePaginationParams` from pagination utils
- Validate URL parameters before passing to hooks
- Use validated parameters for API calls

**Code to add:**
```typescript
import { validatePaginationParams } from '@/lib/api/utils/pagination';

// Inside component
const validatedParams = validatePaginationParams(new URLSearchParams(searchParams));
const { page, limit } = validatedParams;

// Use validated params
const { articles, pagination, isLoading, error } = useArticles({
  page,
  limit,
  // other params...
});
```

**Acceptance Criteria:**
- `validatePaginationParams` is imported
- URL parameters are validated before use
- Invalid page numbers default to 1
- Invalid limits default to 10
- Only valid page sizes from `AVAILABLE_PAGE_SIZES` are accepted
- TypeScript compilation succeeds

**Estimated Complexity:** Low

**Dependencies:** Task 1.4

---

#### Task 4.4: Add Edge Case Handling for Invalid Pages

**Description:** Add logic to handle edge cases such as when the requested page exceeds the total number of pages.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/app/(protected)/articles/page.tsx`

**Implementation Details:**
- Add `useEffect` to detect invalid page numbers
- Redirect to last valid page when `page > totalPages`
- Handle single-page results by conditionally hiding pagination

**Code to add:**
```typescript
// Redirect if page exceeds total pages
useEffect(() => {
  if (!isLoading && pagination.totalPages > 0 && pagination.page > pagination.totalPages) {
    const params = new URLSearchParams(searchParams);
    params.set('page', pagination.totalPages.toString());
    router.replace(`/articles?${params.toString()}`);
  }
}, [pagination.page, pagination.totalPages, isLoading, searchParams, router]);

// Conditionally render pagination
{pagination.totalPages > 1 && (
  <Pagination
    currentPage={pagination.page}
    totalPages={pagination.totalPages}
    onPageChange={handlePageChange}
    onItemsPerPageChange={handleItemsPerPageChange}
    availablePageSizes={PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES}
  />
)}
```

**Acceptance Criteria:**
- `useEffect` detects when page exceeds total pages
- Automatic redirect to last valid page occurs
- Pagination controls are hidden when `totalPages <= 1`
- No infinite redirect loops occur
- TypeScript compilation succeeds

**Estimated Complexity:** Medium

**Dependencies:** Task 4.2, Task 4.3

---

### Phase 5: Testing

#### Task 5.1: Write Unit Tests for Pagination Utilities

**Description:** Create comprehensive unit tests for the pagination utility functions.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/utils/__tests__/pagination.test.ts` (new file)

**Test Cases:**
- `buildPaginationQuery()` with valid inputs
- `buildPaginationQuery()` with invalid inputs (negative, zero, out of range)
- `buildPaginationQuery()` with undefined inputs
- `extractPaginationMetadata()` converts snake_case to camelCase
- `validatePaginationParams()` with valid URL params
- `validatePaginationParams()` with invalid URL params
- `validatePaginationParams()` with missing params
- `isValidPage()` with valid page numbers
- `isValidPage()` with invalid page numbers

**Acceptance Criteria:**
- All utility functions have at least 3 test cases
- Edge cases are covered (negative, zero, undefined, invalid types)
- All tests pass
- Code coverage for pagination utilities is > 90%

**Estimated Complexity:** Medium

**Dependencies:** Task 1.4

---

#### Task 5.2: Write Unit Tests for API Endpoints

**Description:** Update and create unit tests for the modified `getArticles()` and `searchArticles()` functions.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/endpoints/__tests__/articles.test.ts`

**Test Cases:**
- `getArticles()` handles paginated response format
- `getArticles()` validates response structure
- `getArticles()` logs performance measurements
- `getArticles()` handles validation errors
- `getArticles()` handles network errors with enhanced logging
- `getArticles()` normalizes article source names
- `validatePaginatedResponse()` validates correct structure
- `validatePaginatedResponse()` rejects invalid structure
- Same test cases for `searchArticles()`

**Acceptance Criteria:**
- All API endpoint functions have updated tests
- Tests verify paginated response handling
- Tests verify validation logic
- Tests verify performance logging
- Tests verify enhanced error logging
- All tests pass
- Existing test coverage is maintained or improved

**Estimated Complexity:** High

**Dependencies:** Task 2.2, Task 2.3

---

#### Task 5.3: Write Unit Tests for Hooks

**Description:** Update unit tests for `useArticles` and `useArticleSearch` hooks.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/__tests__/useArticles.test.ts`
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/__tests__/useArticleSearch.test.ts`

**Test Cases:**
- Hook extracts pagination metadata from response
- Hook uses `extractPaginationMetadata()` utility
- Hook provides default pagination when data is undefined
- Hook converts `total_pages` to `totalPages`
- Hook maintains existing query key structure
- Hook handles loading states correctly

**Acceptance Criteria:**
- Both hooks have updated tests for new behavior
- Tests verify pagination metadata extraction
- Tests verify use of utility functions
- Tests verify default values
- All tests pass
- Existing test coverage is maintained

**Estimated Complexity:** Medium

**Dependencies:** Task 3.1, Task 3.2

---

#### Task 5.4: Write Integration Tests for Articles Page

**Description:** Create integration tests for the articles page with pagination functionality.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/app/(protected)/articles/__tests__/page.test.tsx` (new or existing)

**Test Cases:**
- Page loads with default pagination (page 1, limit 10)
- Page navigation updates URL correctly
- Items per page change updates URL and resets to page 1
- Invalid page numbers are handled (redirect to valid page)
- Single page results hide pagination controls
- Empty results display empty state
- URL parameters are validated and sanitized

**Acceptance Criteria:**
- Integration tests cover full pagination flow
- Tests verify URL synchronization
- Tests verify edge case handling
- Tests verify items per page selector functionality
- All tests pass

**Estimated Complexity:** High

**Dependencies:** Task 4.1, Task 4.2, Task 4.3, Task 4.4

---

#### Task 5.5: Perform Manual Testing

**Description:** Execute manual testing checklist to verify all functionality works as expected in the browser.

**Files to modify:** None

**Testing Checklist:**
- [ ] Load articles page without query params (defaults to page 1, limit 10)
- [ ] Click through pagination controls (Next, Previous, page numbers)
- [ ] Verify "Showing X-Y of Z items" displays correct counts
- [ ] Change items per page using dropdown (10, 20, 50, 100)
- [ ] Verify page resets to 1 when items per page changes
- [ ] Verify URL contains both `page` and `limit` parameters
- [ ] Search for articles and paginate through results
- [ ] Verify URL state persists across page refresh
- [ ] Test edge cases (empty results, single page, many pages)
- [ ] Navigate to invalid page number (e.g., page 999)
- [ ] Verify automatic redirect to last valid page
- [ ] Verify pagination is hidden for single page results
- [ ] Verify loading states display correctly
- [ ] Verify error states display correctly
- [ ] Check browser console for performance logs
- [ ] Check browser console for error logs (should have context)
- [ ] Test mobile responsive pagination

**Acceptance Criteria:**
- All checklist items are tested and pass
- No console errors (except expected validation logs)
- Performance logs appear in console
- UI/UX matches design specifications
- URL synchronization works correctly
- Edge cases are handled gracefully

**Estimated Complexity:** Medium

**Dependencies:** Task 5.1, Task 5.2, Task 5.3, Task 5.4

---

### Phase 6: Documentation

#### Task 6.1: Update API Endpoint Documentation

**Description:** Update JSDoc comments and documentation for API endpoint functions.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/lib/api/endpoints/articles.ts`

**Implementation Details:**
- Update JSDoc comments for `getArticles()`
- Update JSDoc comments for `searchArticles()`
- Document return type as `PaginatedArticlesResponse`
- Document performance logging behavior
- Document validation behavior
- Add examples of response structure

**Acceptance Criteria:**
- All functions have updated JSDoc comments
- Return types are documented
- Performance and validation features are documented
- Examples are provided
- Documentation is clear and complete

**Estimated Complexity:** Low

**Dependencies:** Task 2.2, Task 2.3

---

#### Task 6.2: Update Hook Documentation

**Description:** Update documentation for React hooks to reflect new pagination handling.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/useArticles.ts`
- `/Users/yujitsuchiya/catchup-feed-web/src/hooks/useArticleSearch.ts`

**Implementation Details:**
- Update JSDoc comments for hooks
- Document pagination metadata extraction
- Document use of utility functions
- Add usage examples

**Acceptance Criteria:**
- All hooks have updated documentation
- Pagination extraction is documented
- Usage examples are provided
- Documentation is clear

**Estimated Complexity:** Low

**Dependencies:** Task 3.1, Task 3.2

---

#### Task 6.3: Document Reusable Pagination System

**Description:** Create comprehensive documentation for the reusable pagination system to enable future entity pagination.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/docs/guides/pagination-guide.md` (new file)

**Documentation Sections:**
- Overview of pagination architecture
- Type definitions (`PaginatedResponse<T>`, `PaginationMetadata`)
- Configuration (`PAGINATION_CONFIG`)
- Utility functions and their usage
- Complete example: Paginating a new entity (e.g., Sources)
- Performance monitoring and logging
- Edge case handling best practices
- Testing guidelines

**Acceptance Criteria:**
- Guide covers all aspects of pagination system
- Complete example for paginating a new entity is provided
- Code snippets are accurate and tested
- Guide is clear and easy to follow
- Guide includes observability features

**Estimated Complexity:** Medium

**Dependencies:** Task 1.4, Task 2.2, Task 3.1

---

#### Task 6.4: Document Observability Features

**Description:** Document the observability features (performance monitoring, error logging) for developers.

**Files to modify:**
- `/Users/yujitsuchiya/catchup-feed-web/docs/guides/observability.md` (new or existing)

**Documentation Sections:**
- Performance monitoring with Performance API
- Structured error logging format
- Console log examples
- How to interpret performance measurements
- Analytics integration points (for future use)

**Acceptance Criteria:**
- All observability features are documented
- Examples of console output are provided
- Guidance on interpreting logs is clear
- Analytics integration points are identified

**Estimated Complexity:** Low

**Dependencies:** Task 2.2

---

## Dependencies

### Task Dependency Graph

```
Phase 1: Type Definitions
1.1 (Pagination Types)
  └─> 1.2 (ArticlesResponse Update)
  └─> 1.3 (Config Constants)
       └─> 1.4 (Utility Module)

Phase 2: API Client
1.1 ─> 2.1 (Validation Function)
        └─> 2.2 (Update getArticles)
             └─> 2.3 (Update searchArticles)

Phase 3: Hooks
2.2 + 1.4 ─> 3.1 (Update useArticles)
              └─> 3.2 (Update useArticleSearch)

Phase 4: UI Components
1.3 ─> 4.1 (Items Per Page Selector)
        └─> 4.2 (Page Size Handler)
             └─> 4.3 (URL Validation)
                  └─> 4.4 (Edge Case Handling)

Phase 5: Testing
1.4 ─> 5.1 (Utility Tests)
2.2 + 2.3 ─> 5.2 (API Tests)
3.1 + 3.2 ─> 5.3 (Hook Tests)
4.1 + 4.2 + 4.3 + 4.4 ─> 5.4 (Integration Tests)
5.1 + 5.2 + 5.3 + 5.4 ─> 5.5 (Manual Testing)

Phase 6: Documentation
2.2 + 2.3 ─> 6.1 (API Docs)
3.1 + 3.2 ─> 6.2 (Hook Docs)
1.4 + 2.2 + 3.1 ─> 6.3 (Pagination Guide)
2.2 ─> 6.4 (Observability Docs)
```

### Critical Path

The critical path for this implementation is:

1. Task 1.1 → Task 1.3 → Task 1.4 (Type definitions and utilities)
2. Task 2.1 → Task 2.2 → Task 2.3 (API client updates)
3. Task 3.1 → Task 3.2 (Hook updates)
4. Task 4.1 → Task 4.2 → Task 4.3 → Task 4.4 (UI updates)
5. Task 5.4 → Task 5.5 (Integration and manual testing)

## Risk Assessment

### High Risks

1. **Breaking Changes in API Response Format**
   - **Risk:** If API response format is different than expected, frontend will break
   - **Mitigation:** Use `validatePaginatedResponse()` to catch malformed responses early
   - **Mitigation:** Comprehensive error logging will help debug issues quickly
   - **Contingency:** Can add backward compatibility layer if needed

2. **Performance Degradation**
   - **Risk:** Additional validation and logging could slow down API calls
   - **Mitigation:** Performance API measurements will detect any slowdown
   - **Mitigation:** Validation is minimal and only runs once per response
   - **Contingency:** Can disable verbose logging in production if needed

### Medium Risks

1. **URL Parameter Conflicts**
   - **Risk:** Existing URL parameters could conflict with new `limit` parameter
   - **Mitigation:** Validate all URL parameters before use
   - **Mitigation:** Use `validatePaginationParams()` for consistent parsing
   - **Contingency:** Can namespace parameters if conflicts arise

2. **Edge Case Bugs**
   - **Risk:** Edge cases (empty results, invalid pages) could cause errors
   - **Mitigation:** Comprehensive edge case handling in Task 4.4
   - **Mitigation:** Integration tests cover all edge cases
   - **Contingency:** Additional `useEffect` guards can be added if needed

### Low Risks

1. **TypeScript Compilation Issues**
   - **Risk:** Type changes could cause compilation errors in other files
   - **Mitigation:** Incremental compilation after each task
   - **Mitigation:** Type checking before committing each phase
   - **Contingency:** Can revert to previous commit if issues arise

2. **Test Coverage Gaps**
   - **Risk:** Some edge cases might not be covered by tests
   - **Mitigation:** Manual testing checklist ensures broad coverage
   - **Mitigation:** Integration tests cover full user flows
   - **Contingency:** Can add additional tests if issues are discovered

## Success Criteria

### Core Functionality

- [ ] Article list page displays correct pagination metadata from backend
- [ ] Search results show correct total counts
- [ ] URL state synchronization works correctly
- [ ] Items per page selector allows user to choose page sizes (10, 20, 50, 100)
- [ ] URL includes both `page` and `limit` parameters
- [ ] Pagination resets to page 1 when limit changes

### Reliability

- [ ] Input validation prevents invalid page numbers and limits
- [ ] Edge cases handled: empty results, invalid pages, single pages
- [ ] Pagination response validation catches malformed API responses
- [ ] Automatic redirect when requested page > total_pages
- [ ] No infinite redirect loops
- [ ] Graceful error handling with helpful messages

### Observability

- [ ] Performance measurements logged for all API calls
- [ ] Structured error logs include timestamp, query params, and stack traces
- [ ] State transition logging for pagination events (page change, limit change)
- [ ] Console output is helpful for debugging
- [ ] Analytics integration points are defined for future use

### Reusability

- [ ] Generic `PaginatedResponse<T>` supports any entity type
- [ ] Shared utilities in `src/lib/api/utils/pagination.ts`
- [ ] Centralized `PAGINATION_CONFIG` for consistent behavior
- [ ] Documentation includes example for paginating other entities
- [ ] Code is modular and easy to reuse

### Testing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing checklist completed
- [ ] Code coverage > 80% for new code
- [ ] No regressions in existing functionality
- [ ] Edge case tests verify validation and error handling

### User Experience

- [ ] Pagination controls display accurate page counts
- [ ] "Showing X-Y of Z items" displays correct values
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Mobile responsive design works
- [ ] No breaking changes for end users

## Estimated Timeline

### By Complexity

- **Low Complexity Tasks:** 6 tasks × 0.5 hours = 3 hours
- **Medium Complexity Tasks:** 10 tasks × 1.5 hours = 15 hours
- **High Complexity Tasks:** 4 tasks × 3 hours = 12 hours

**Total Estimated Time:** ~30 hours (approximately 4-5 working days)

### By Phase

- **Phase 1 (Type Definitions):** 3 hours
- **Phase 2 (API Client):** 8 hours
- **Phase 3 (Hooks):** 3 hours
- **Phase 4 (UI Components):** 6 hours
- **Phase 5 (Testing):** 8 hours
- **Phase 6 (Documentation):** 2 hours

### Suggested Sprint Plan

**Sprint 1 (Days 1-2):**
- Complete Phase 1 (Type Definitions)
- Complete Phase 2 (API Client)

**Sprint 2 (Day 3):**
- Complete Phase 3 (Hooks)
- Start Phase 4 (UI Components)

**Sprint 3 (Day 4):**
- Complete Phase 4 (UI Components)
- Start Phase 5 (Testing)

**Sprint 4 (Day 5):**
- Complete Phase 5 (Testing)
- Complete Phase 6 (Documentation)
- Final review and deployment

## Notes

### Important Reminders

1. **Test After Each Phase:** Don't wait until Phase 5 to test. Run existing tests after each phase to catch issues early.

2. **Commit Frequently:** Commit after completing each task to maintain clean git history and enable easy rollback.

3. **Console Logging:** Keep performance and error logs enabled during development. They will be invaluable for debugging.

4. **Type Safety:** Let TypeScript guide you. If types don't match, fix them immediately rather than using `any`.

5. **Reusability First:** Keep the reusability goal in mind. Future developers should be able to paginate any entity with minimal effort.

6. **Edge Cases Matter:** Don't skip edge case handling. It's the difference between a good implementation and a great one.

### Future Considerations

After this implementation is complete, consider:

- Persisting user's preferred page size in localStorage
- Implementing infinite scroll as an alternative to pagination
- Adding page prefetching for instant navigation
- Implementing total count badge in page header
- Creating analytics dashboards from logged events

---

**Document Version:** 1.0
**Created:** 2025-12-07
**Author:** EDAF Planner Agent
**Status:** Ready for Implementation
**Estimated Duration:** 4-5 days (30 hours)
**Total Tasks:** 20 tasks across 6 phases
