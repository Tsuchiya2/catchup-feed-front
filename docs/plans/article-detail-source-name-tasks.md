# Task Plan: Article Detail Source Name Migration

**Design Document**: `docs/designs/article-detail-source-name.md` (Version 2.0)
**Status**: Ready for Implementation
**Created**: 2025-12-06
**Estimated Total Time**: ~5 hours

---

## Overview

This implementation plan details the migration from `source_id` (number) to `source_name` (string) in the Article type. The migration includes comprehensive error handling, logging, monitoring, and rollback capabilities to ensure production-ready quality.

### Key Objectives

1. Update TypeScript type definitions to use `source_name` instead of `source_id`
2. Implement robust error handling with fallback to "Unknown Source"
3. Add runtime validation layer for API responses
4. Create comprehensive logging and monitoring capabilities
5. Update all test files with new mock data and edge case coverage
6. Ensure zero-downtime deployment with rollback plan

### Implementation Approach

- **Sequential phases** with validation gates between each phase
- **Comprehensive testing** including edge cases and rollback scenarios
- **Production-ready** with logging, monitoring, and observability
- **Backward compatibility** during transition period (if needed)

---

## Prerequisites

### Before Starting Implementation

- [ ] Confirm backend API is deployed or scheduled to deploy `source_name` field
- [ ] Verify development environment is running (`npm run dev`)
- [ ] Ensure all existing tests pass (`npm test`)
- [ ] Verify TypeScript compilation is clean (`npm run build`)
- [ ] Confirm access to staging environment for validation
- [ ] Review rollback procedure with team

### Backend API Verification

```bash
# Test backend API returns source_name
curl https://staging-api.example.com/articles/1 | grep "source_name"
```

Expected response should include:
```json
{
  "id": 1,
  "source_name": "Example Source",
  ...
}
```

---

## Task List

### Phase 1: Core Type and Utility Infrastructure

#### TASK-001: Update Article Type Definition

**Title**: Update Article interface to use source_name

**Description**: Replace `source_id: number` with `source_name: string` in the Article type definition.

**Files to Modify**:
- `/src/types/api.d.ts`

**Changes**:
```typescript
// Before
export interface Article {
  id: number;
  source_id: number;  // Remove
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
}

// After
export interface Article {
  id: number;
  source_name: string;  // Add
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
}
```

**Estimated Complexity**: Low

**Dependencies**: None

**Acceptance Criteria**:
- [ ] `source_id` field is removed from Article interface
- [ ] `source_name` field is added as required string
- [ ] TypeScript compilation identifies all affected code locations
- [ ] No other type definitions are affected

**Testing**:
```bash
# Verify TypeScript catches usage of old source_id field
npm run build
# Expected: Compilation errors showing source_id usage
```

---

#### TASK-002: Create Article Utility Functions

**Title**: Implement normalizeSourceName and validateArticle utilities

**Description**: Create utility functions for source name normalization and article validation with comprehensive edge case handling.

**Files to Create**:
- `/src/utils/article.ts`

**Implementation**:
```typescript
/**
 * Normalizes source name with fallback for invalid values
 * @param sourceName - The source name from API response
 * @returns Normalized source name or "Unknown Source"
 */
export function normalizeSourceName(sourceName: string | null | undefined): string {
  // Handle null, undefined, empty string, or whitespace-only strings
  if (!sourceName || typeof sourceName !== 'string' || sourceName.trim() === '') {
    return 'Unknown Source';
  }

  // Return trimmed value
  return sourceName.trim();
}

/**
 * Validates Article object has required fields
 * @param article - Article object from API
 * @returns true if valid, false otherwise
 */
export function validateArticle(article: any): article is Article {
  return (
    article &&
    typeof article.id === 'number' &&
    typeof article.title === 'string' &&
    typeof article.url === 'string' &&
    typeof article.summary === 'string' &&
    typeof article.published_at === 'string' &&
    typeof article.created_at === 'string'
    // Note: source_name is optional for validation, will be normalized
  );
}
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001

**Acceptance Criteria**:
- [ ] `normalizeSourceName` handles null, undefined, empty string, whitespace
- [ ] `normalizeSourceName` trims whitespace from valid strings
- [ ] `normalizeSourceName` returns "Unknown Source" for invalid inputs
- [ ] `validateArticle` checks all required Article fields
- [ ] TypeScript exports are properly defined
- [ ] JSDoc comments are complete and accurate

**Testing**:
- Will be covered by TASK-010 (utility function tests)

---

#### TASK-003: Create Logging Utilities

**Title**: Implement ArticleMigrationLogger for tracking migration events

**Description**: Create structured logging utilities to track migration events, errors, and validation failures.

**Files to Create/Modify**:
- `/src/utils/logger.ts` (create new or extend existing)

**Implementation**:
```typescript
export const ArticleMigrationLogger = {
  /**
   * Log missing source_name in API response
   */
  logMissingSourceName(articleId: number, context: string) {
    console.warn('[Article Migration] Missing source_name:', {
      articleId,
      context,
      timestamp: new Date().toISOString(),
      fallbackUsed: 'Unknown Source',
    });
  },

  /**
   * Log validation failure
   */
  logValidationFailure(articleId: number | undefined, receivedData: any) {
    console.error('[Article Migration] Validation failure:', {
      articleId,
      receivedData: JSON.stringify(receivedData),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log successful migration event
   */
  logMigrationSuccess(articleCount: number, context: string) {
    console.info('[Article Migration] Success:', {
      articleCount,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log API response format (for debugging during transition)
   */
  logApiResponseFormat(response: any, endpoint: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Article Migration] API response format:', {
        endpoint,
        hasSourceId: 'source_id' in response,
        hasSourceName: 'source_name' in response,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
```

**Estimated Complexity**: Low

**Dependencies**: None

**Acceptance Criteria**:
- [ ] All logger methods properly structured with timestamps
- [ ] Appropriate console methods used (warn, error, info, debug)
- [ ] Development-only logging respects NODE_ENV
- [ ] JSDoc comments are complete
- [ ] No runtime errors when calling logger methods

**Testing**:
- Will be verified during integration testing in TASK-013

---

### Phase 2: API Client and Validation Layer

#### TASK-004: Update API Client with Validation

**Title**: Add validation and normalization to article API endpoints

**Description**: Enhance `fetchArticle` and `fetchArticles` functions with runtime validation and source name normalization.

**Files to Modify**:
- `/src/lib/api/endpoints/articles.ts`

**Changes**:
```typescript
// Add imports
import { validateArticle, normalizeSourceName } from '@/utils/article';
import { ArticleMigrationLogger } from '@/utils/logger';

// Update fetchArticle function
export async function fetchArticle(id: number): Promise<Article> {
  const response = await apiClient.get<Article>(`/articles/${id}`);

  // Log API response format (dev only)
  ArticleMigrationLogger.logApiResponseFormat(response, `/articles/${id}`);

  // Validate response structure
  if (!validateArticle(response)) {
    ArticleMigrationLogger.logValidationFailure(id, response);
    throw new Error(`Invalid article data received from API for article ID: ${id}`);
  }

  // Normalize source_name
  return {
    ...response,
    source_name: normalizeSourceName(response.source_name),
  };
}

// Update fetchArticles function
export async function fetchArticles(params?: ArticlesQuery): Promise<ArticlesResponse> {
  const response = await apiClient.get<ArticlesResponse>('/articles', { params });

  // Validate and normalize all articles
  const validatedArticles = response.data.map((article) => {
    if (!validateArticle(article)) {
      ArticleMigrationLogger.logValidationFailure(article?.id, article);
      // Skip invalid articles instead of crashing
      return null;
    }

    return {
      ...article,
      source_name: normalizeSourceName(article.source_name),
    };
  }).filter((article): article is Article => article !== null);

  // Log success
  ArticleMigrationLogger.logMigrationSuccess(
    validatedArticles.length,
    'fetchArticles'
  );

  return {
    ...response,
    data: validatedArticles,
  };
}
```

**Estimated Complexity**: Medium

**Dependencies**: TASK-002, TASK-003

**Acceptance Criteria**:
- [ ] `fetchArticle` validates response structure before returning
- [ ] `fetchArticle` normalizes source_name
- [ ] `fetchArticle` logs validation failures with article ID
- [ ] `fetchArticles` validates each article in the list
- [ ] `fetchArticles` filters out invalid articles instead of crashing
- [ ] Both functions log API response format in development
- [ ] Error messages are clear and actionable

**Testing**:
- Will be covered by TASK-011 (API client tests)

---

### Phase 3: Component Updates

#### TASK-005: Update ArticleHeader Component

**Title**: Add source name normalization to ArticleHeader

**Description**: Import and use `normalizeSourceName` utility when rendering SourceBadge.

**Files to Modify**:
- `/src/components/articles/ArticleHeader.tsx`

**Changes**:
```typescript
// Add import at top of file
import { normalizeSourceName } from '@/utils/article';

// Update source badge rendering (around line 30-40)
{sourceName && (
  <SourceBadge name={normalizeSourceName(sourceName)} />
)}
```

**Estimated Complexity**: Low

**Dependencies**: TASK-002

**Acceptance Criteria**:
- [ ] Import statement added for `normalizeSourceName`
- [ ] SourceBadge receives normalized source name
- [ ] Component still renders correctly when `sourceName` is undefined
- [ ] No TypeScript compilation errors
- [ ] No visual regression in component rendering

**Testing**:
- Will be covered by TASK-008 (ArticleHeader test updates)

---

#### TASK-006: Update ArticleCard Component

**Title**: Add source name normalization to ArticleCard

**Description**: Import and use `normalizeSourceName` utility when rendering SourceBadge.

**Files to Modify**:
- `/src/components/articles/ArticleCard.tsx`

**Changes**:
```typescript
// Add import at top of file
import { normalizeSourceName } from '@/utils/article';

// Update source badge rendering
{sourceName && (
  <SourceBadge name={normalizeSourceName(sourceName)} />
)}
```

**Estimated Complexity**: Low

**Dependencies**: TASK-002

**Acceptance Criteria**:
- [ ] Import statement added for `normalizeSourceName`
- [ ] SourceBadge receives normalized source name
- [ ] Component still renders correctly when `sourceName` is undefined
- [ ] No TypeScript compilation errors
- [ ] No visual regression in component rendering

**Testing**:
- Will be covered by TASK-009 (ArticleCard test updates)

---

#### TASK-007: Update Article Detail Page

**Title**: Pass source_name to ArticleHeader component

**Description**: Update Article Detail page to pass `article.source_name` prop to ArticleHeader.

**Files to Modify**:
- `/src/app/(protected)/articles/[id]/page.tsx`

**Changes**:
```typescript
// Before (around line 90)
<ArticleHeader article={article} />

// After
<ArticleHeader article={article} sourceName={article.source_name} />
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001, TASK-005

**Acceptance Criteria**:
- [ ] `sourceName` prop is passed to ArticleHeader
- [ ] Uses `article.source_name` from new type definition
- [ ] No TypeScript compilation errors
- [ ] Page renders correctly with source badge
- [ ] No visual regression

**Testing**:
- Will be verified during manual testing in TASK-013

---

### Phase 4: Test Infrastructure and Reusable Patterns

#### TASK-008: Create Centralized Mock Data Factory

**Title**: Create centralized article mock data factory for tests

**Description**: Create a reusable mock data factory to ensure consistent test data across all test files and reduce code duplication.

**Files to Create**:
- `/src/__test__/factories/articleFactory.ts`

**Implementation**:
```typescript
import { Article } from '@/types/api';

/**
 * Centralized factory for creating mock Article objects in tests
 * This factory ensures consistent test data across all test files
 * and provides a single source of truth for article mock structure.
 */

/**
 * Creates a mock Article object with default or overridden values
 * @param overrides - Partial Article object to override defaults
 * @returns Complete Article object for testing
 */
export function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 1,
    title: 'Test Article Title',
    url: 'https://example.com/article',
    summary: 'This is a test article summary.',
    source_name: 'Tech Blog',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates an array of mock articles with sequential IDs
 * @param count - Number of articles to create
 * @param baseOverrides - Base overrides applied to all articles
 * @returns Array of Article objects
 */
export function createMockArticles(
  count: number,
  baseOverrides: Partial<Article> = {}
): Article[] {
  return Array.from({ length: count }, (_, index) =>
    createMockArticle({
      ...baseOverrides,
      id: index + 1,
      title: `${baseOverrides.title || 'Test Article'} ${index + 1}`,
    })
  );
}

/**
 * Creates a mock article with edge case values for source_name testing
 * @param edgeCase - Type of edge case to create
 * @returns Article with specific edge case
 */
export function createMockArticleWithSourceEdgeCase(
  edgeCase: 'null' | 'undefined' | 'empty' | 'whitespace' | 'unicode' | 'long'
): Article {
  const baseArticle = createMockArticle();

  switch (edgeCase) {
    case 'null':
      return { ...baseArticle, source_name: null as any };
    case 'undefined':
      const { source_name, ...articleWithoutSource } = baseArticle;
      return articleWithoutSource as Article;
    case 'empty':
      return { ...baseArticle, source_name: '' };
    case 'whitespace':
      return { ...baseArticle, source_name: '   ' };
    case 'unicode':
      return { ...baseArticle, source_name: 'テックニュース🚀' };
    case 'long':
      return { ...baseArticle, source_name: 'Very Long Source Name That Might Cause Layout Issues In The UI Component' };
    default:
      return baseArticle;
  }
}
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001

**Acceptance Criteria**:
- [ ] Factory file created with all helper functions
- [ ] `createMockArticle` creates valid Article objects
- [ ] `createMockArticles` creates arrays of articles with sequential IDs
- [ ] `createMockArticleWithSourceEdgeCase` handles all edge cases
- [ ] JSDoc comments are complete and accurate
- [ ] TypeScript exports are properly defined
- [ ] No TypeScript compilation errors

**Testing**:
- Will be used by TASK-009 through TASK-012

---

#### TASK-009: Update ArticleHeader Tests

**Title**: Update ArticleHeader tests to use centralized mock factory

**Description**: Replace local `createMockArticle` helper with centralized factory and add comprehensive edge case tests using factory helpers.

**Files to Modify**:
- `/src/components/articles/ArticleHeader.test.tsx`

**Changes**:
```typescript
// Replace local createMockArticle helper with import (Lines 1-16)
import { createMockArticle, createMockArticleWithSourceEdgeCase } from '@/__test__/factories/articleFactory';

// Remove local createMockArticle function definition

// Update all existing tests to use imported factory
// (No changes needed - they already use createMockArticle)

// Add edge case tests at end of file using factory helper
describe('Edge Cases - Source Name Handling', () => {
  it('should display "Unknown Source" when source_name is null', () => {
    const article = createMockArticleWithSourceEdgeCase('null');
    render(<ArticleHeader article={article} sourceName={null as any} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is undefined', () => {
    const article = createMockArticleWithSourceEdgeCase('undefined');
    render(<ArticleHeader article={article as Article} sourceName={undefined} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is empty string', () => {
    const article = createMockArticleWithSourceEdgeCase('empty');
    render(<ArticleHeader article={article} sourceName={''} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is whitespace only', () => {
    const article = createMockArticleWithSourceEdgeCase('whitespace');
    render(<ArticleHeader article={article} sourceName={'   '} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should trim whitespace from valid source_name', () => {
    const article = createMockArticle({ source_name: '  Tech Blog  ' });
    render(<ArticleHeader article={article} sourceName={'  Tech Blog  '} />);
    expect(screen.getByText('Tech Blog')).toBeInTheDocument();
  });

  it('should render Unicode characters correctly', () => {
    const article = createMockArticleWithSourceEdgeCase('unicode');
    render(<ArticleHeader article={article} sourceName={'テックニュース🚀'} />);
    expect(screen.getByText('テックニュース🚀')).toBeInTheDocument();
  });
});
```

**Estimated Complexity**: Medium

**Dependencies**: TASK-001, TASK-002, TASK-005, TASK-008

**Acceptance Criteria**:
- [ ] Local `createMockArticle` helper removed
- [ ] Import from centralized factory added
- [ ] All existing tests pass with factory
- [ ] 6 new edge case tests added and passing
- [ ] Edge cases use `createMockArticleWithSourceEdgeCase` helper
- [ ] Test coverage maintained or improved
- [ ] No TypeScript compilation errors in tests

**Testing**:
```bash
npm test -- ArticleHeader.test.tsx
```

---

#### TASK-010: Update ArticleCard Tests

**Title**: Update ArticleCard tests to use centralized mock factory

**Description**: Replace local `createMockArticle` helper with centralized factory and add edge case tests.

**Files to Modify**:
- `/src/components/articles/ArticleCard.test.tsx`

**Changes**:
```typescript
// Replace local createMockArticle helper with import (Lines 1-25)
import { createMockArticle, createMockArticleWithSourceEdgeCase } from '@/__test__/factories/articleFactory';

// Remove local createMockArticle function definition

// Update all existing tests to use imported factory
// (No changes needed - they already use createMockArticle)

// Add edge case tests at end of file using factory helper
describe('Edge Cases - Source Name Handling', () => {
  it('should display "Unknown Source" when source_name is null', () => {
    const article = createMockArticleWithSourceEdgeCase('null');
    render(<ArticleCard article={article} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is undefined', () => {
    const article = createMockArticleWithSourceEdgeCase('undefined');
    render(<ArticleCard article={article as Article} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is empty string', () => {
    const article = createMockArticleWithSourceEdgeCase('empty');
    render(<ArticleCard article={article} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should display "Unknown Source" when source_name is whitespace only', () => {
    const article = createMockArticleWithSourceEdgeCase('whitespace');
    render(<ArticleCard article={article} />);
    expect(screen.getByText('Unknown Source')).toBeInTheDocument();
  });

  it('should render Unicode characters correctly', () => {
    const article = createMockArticleWithSourceEdgeCase('unicode');
    render(<ArticleCard article={article} />);
    expect(screen.getByText('テックニュース🚀')).toBeInTheDocument();
  });
});
```

**Estimated Complexity**: Medium

**Dependencies**: TASK-001, TASK-002, TASK-006, TASK-008

**Acceptance Criteria**:
- [ ] Local `createMockArticle` helper removed
- [ ] Import from centralized factory added
- [ ] All existing tests pass with factory
- [ ] Edge case tests added and passing
- [ ] Test coverage maintained or improved
- [ ] No TypeScript compilation errors in tests

**Testing**:
```bash
npm test -- ArticleCard.test.tsx
```

---

#### TASK-011: Update useArticle Hook Tests

**Title**: Update useArticle hook tests to use centralized mock factory

**Description**: Replace local `mockArticle` object with centralized factory.

**Files to Modify**:
- `/src/hooks/useArticle.test.ts`

**Changes**:
```typescript
// Add import at top of file
import { createMockArticle } from '@/__test__/factories/articleFactory';

// Replace mockArticle definition (Lines 24-32)
const mockArticle: Article = createMockArticle({
  id: 1,
  title: 'Test Article',
  url: 'https://example.com/article',
  summary: 'Test summary',
  source_name: 'Tech Blog',
  published_at: '2025-01-15T10:00:00Z',
  created_at: '2025-01-15T10:00:00Z',
});
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001, TASK-008

**Acceptance Criteria**:
- [ ] Import from centralized factory added
- [ ] `mockArticle` uses factory function
- [ ] All existing tests pass with factory
- [ ] No TypeScript compilation errors in tests
- [ ] Hook behavior unchanged

**Testing**:
```bash
npm test -- useArticle.test.ts
```

---

#### TASK-012: Update RecentArticlesList Tests

**Title**: Update RecentArticlesList tests to use centralized mock factory

**Description**: Replace local `createMockArticle` helper with centralized factory.

**Files to Modify**:
- `/src/components/dashboard/RecentArticlesList.test.tsx`

**Changes**:
```typescript
// Replace local createMockArticle helper with import
import { createMockArticle } from '@/__test__/factories/articleFactory';

// Remove local createMockArticle function definition

// Update mockArticles array to use imported factory (Lines 31-55)
const mockArticles: Article[] = [
  createMockArticle({
    id: 1,
    title: 'First Article',
    summary: 'This is the first article summary',
    url: 'https://example.com/article1',
    published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    source_name: 'Tech News',
  }),
  createMockArticle({
    id: 2,
    title: 'Second Article',
    summary: 'This is the second article with a very long summary...',
    url: 'https://example.com/article2',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source_name: 'Developer Blog',
  }),
  createMockArticle({
    id: 3,
    title: 'Third Article Without Summary',
    summary: '',
    url: 'https://example.com/article3',
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source_name: 'News Site',
  }),
];
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001, TASK-008

**Acceptance Criteria**:
- [ ] Local `createMockArticle` helper removed
- [ ] Import from centralized factory added
- [ ] All inline mock objects use factory
- [ ] All existing tests pass with factory
- [ ] No TypeScript compilation errors in tests

**Testing**:
```bash
npm test -- RecentArticlesList.test.tsx
```

---

#### TASK-013: Create Utility Function Tests

**Title**: Add comprehensive tests for article utility functions

**Description**: Create test file for `normalizeSourceName` and `validateArticle` functions using centralized factory.

**Files to Create**:
- `/src/utils/article.test.ts`

**Implementation**:
```typescript
import { normalizeSourceName, validateArticle } from './article';
import { createMockArticle } from '@/__test__/factories/articleFactory';

describe('normalizeSourceName', () => {
  it('should return trimmed value for valid string', () => {
    expect(normalizeSourceName('Tech Blog')).toBe('Tech Blog');
  });

  it('should trim whitespace from valid string', () => {
    expect(normalizeSourceName('  Tech Blog  ')).toBe('Tech Blog');
  });

  it('should return "Unknown Source" for null', () => {
    expect(normalizeSourceName(null)).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for undefined', () => {
    expect(normalizeSourceName(undefined)).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for empty string', () => {
    expect(normalizeSourceName('')).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for whitespace-only string', () => {
    expect(normalizeSourceName('   ')).toBe('Unknown Source');
  });

  it('should handle Unicode characters correctly', () => {
    expect(normalizeSourceName('テックニュース🚀')).toBe('テックニュース🚀');
  });

  it('should handle non-string types', () => {
    expect(normalizeSourceName(123 as any)).toBe('Unknown Source');
  });
});

describe('validateArticle', () => {
  const validArticle = createMockArticle({
    id: 1,
    title: 'Test',
    url: 'https://example.com',
    summary: 'Summary',
    published_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    source_name: 'Source',
  });

  it('should return true for valid article', () => {
    expect(validateArticle(validArticle)).toBe(true);
  });

  it('should return false for null', () => {
    expect(validateArticle(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(validateArticle(undefined)).toBe(false);
  });

  it('should return false for missing id', () => {
    const { id, ...invalid } = validArticle;
    expect(validateArticle(invalid)).toBe(false);
  });

  it('should return false for missing title', () => {
    const { title, ...invalid } = validArticle;
    expect(validateArticle(invalid)).toBe(false);
  });

  it('should return false for invalid id type', () => {
    expect(validateArticle({ ...validArticle, id: '1' })).toBe(false);
  });

  it('should return false for invalid title type', () => {
    expect(validateArticle({ ...validArticle, title: 123 })).toBe(false);
  });

  it('should return true even without source_name', () => {
    const { source_name, ...article } = validArticle;
    expect(validateArticle(article)).toBe(true);
  });
});
```

**Estimated Complexity**: Medium

**Dependencies**: TASK-002, TASK-008

**Acceptance Criteria**:
- [ ] Test file created with complete coverage
- [ ] Uses centralized factory for test data
- [ ] `normalizeSourceName` has 8+ test cases
- [ ] `validateArticle` has 8+ test cases
- [ ] All edge cases covered
- [ ] All tests pass
- [ ] Code coverage > 90% for utility functions

**Testing**:
```bash
npm test -- article.test.ts
npm run test:coverage -- article.test.ts
```

---

### Phase 5: Validation and Pre-Deployment

#### TASK-014: Manual Integration Testing

**Title**: Perform manual testing of article pages

**Description**: Manually test article detail page and list page to verify source badge rendering and functionality.

**Test Cases**:

1. **Article Detail Page**:
   - [ ] Navigate to `/articles/[id]`
   - [ ] Verify source badge displays correctly
   - [ ] Verify source name matches API response
   - [ ] Check browser console for errors
   - [ ] Test with different article IDs

2. **Article List Page**:
   - [ ] Navigate to `/articles`
   - [ ] Verify article cards render correctly
   - [ ] Verify no console errors
   - [ ] Test pagination

3. **Edge Case Testing**:
   - [ ] Test with article that has empty source_name (if possible)
   - [ ] Test with long source names
   - [ ] Test with special characters in source names
   - [ ] Test with Unicode source names

4. **Cross-Browser Testing**:
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari (if on macOS)

**Estimated Complexity**: Medium

**Dependencies**: All previous tasks (TASK-001 through TASK-013)

**Acceptance Criteria**:
- [ ] All manual test cases pass
- [ ] No console errors or warnings
- [ ] Source badge displays correctly in all scenarios
- [ ] No visual regressions observed
- [ ] Performance is acceptable (no noticeable slowdown)

---

#### TASK-015: Create Pre-Deployment Validation Script

**Title**: Create automated validation script for migration

**Description**: Create bash script to validate migration readiness before deployment.

**Files to Create**:
- `/scripts/validate-migration.sh`

**Implementation**:
```bash
#!/bin/bash
# scripts/validate-migration.sh

echo "🔍 Validating Article Migration..."

# 1. Backend API check (update URL as needed)
echo "Checking backend API..."
RESPONSE=$(curl -s https://staging-api.example.com/articles/1 || echo "{}")
if echo "$RESPONSE" | grep -q "source_name"; then
  echo "✅ Backend API returns source_name"
else
  echo "❌ Backend API missing source_name"
  echo "   Response: $RESPONSE"
  exit 1
fi

# 2. Frontend build
echo "Building frontend..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Frontend build successful"
else
  echo "❌ Frontend build failed"
  exit 1
fi

# 3. Run tests
echo "Running tests..."
npm test -- --passWithNoTests
if [ $? -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed"
  exit 1
fi

# 4. Check for source_id references
echo "Checking for legacy source_id references..."
LEGACY_REFS=$(grep -r "source_id" src/ --exclude-dir=node_modules --exclude="*.test.*" || echo "")
if [ -z "$LEGACY_REFS" ]; then
  echo "✅ No legacy source_id references found"
else
  echo "⚠️  Warning: Found potential source_id references:"
  echo "$LEGACY_REFS"
  echo "   Please review manually"
fi

echo "✅ Migration validation complete"
```

**Make Executable**:
```bash
chmod +x scripts/validate-migration.sh
```

**Estimated Complexity**: Low

**Dependencies**: TASK-001 through TASK-013

**Acceptance Criteria**:
- [ ] Script is executable
- [ ] Script checks backend API for source_name
- [ ] Script validates frontend build
- [ ] Script runs all tests
- [ ] Script checks for legacy source_id references
- [ ] Script exits with proper status codes
- [ ] Script output is clear and actionable

**Testing**:
```bash
./scripts/validate-migration.sh
```

---

#### TASK-016: Test Rollback Procedure in Staging

**Title**: Verify rollback procedure works correctly

**Description**: Test the rollback procedure in staging environment to ensure quick recovery if needed.

**Rollback Steps to Test**:

1. **Deploy Migration to Staging**:
   ```bash
   git checkout main
   npm run build
   # Deploy to staging (command depends on platform)
   ```

2. **Verify Migration Works**:
   - Navigate to article pages in staging
   - Verify source badges display
   - Check browser console for errors

3. **Perform Rollback**:
   ```bash
   git revert HEAD --no-edit
   npm run build
   # Deploy to staging again
   ```

4. **Verify Rollback Successful**:
   - Navigate to article pages in staging
   - Verify application works (may not show source badges)
   - Check for no console errors
   - Verify error rates return to baseline

**Estimated Complexity**: Medium

**Dependencies**: TASK-001 through TASK-015

**Acceptance Criteria**:
- [ ] Migration deployed to staging successfully
- [ ] Migration verified working in staging
- [ ] Rollback executed successfully
- [ ] Application functional after rollback
- [ ] Rollback procedure documented
- [ ] Rollback time < 15 minutes from decision to completion
- [ ] Team familiar with rollback steps

---

### Phase 6: Documentation and Deployment Prep

#### TASK-017: Create Deployment Runbook

**Title**: Document deployment procedure and monitoring checklist

**Description**: Create comprehensive deployment runbook with pre-flight checks, deployment steps, and post-deployment monitoring.

**Files to Create**:
- `/docs/runbooks/article-source-name-migration.md`

**Content Should Include**:
- Pre-deployment checklist
- Deployment steps
- Post-deployment monitoring checklist
- Rollback trigger conditions
- Rollback procedure
- Contact information for escalation

**Estimated Complexity**: Low

**Dependencies**: All previous tasks

**Acceptance Criteria**:
- [ ] Runbook is complete and accurate
- [ ] Runbook includes all validation steps
- [ ] Rollback procedure clearly documented
- [ ] Monitoring metrics and thresholds defined
- [ ] Team reviews and approves runbook

---

#### TASK-018: Final Pre-Deployment Checklist

**Title**: Complete final pre-deployment validation

**Description**: Execute all validation steps before production deployment.

**Checklist**:

**Backend Verification**:
- [ ] Backend API deployed to production
- [ ] Verify backend returns `source_name` in production
- [ ] Test with production API endpoint
- [ ] Confirm 100% of articles have non-null `source_name`

**Frontend Build Verification**:
- [ ] Run `npm run build` - no errors
- [ ] Run `npm test` - all tests pass
- [ ] Check bundle size - no significant increase (< 5KB)
- [ ] Verify no console errors in dev mode

**Integration Testing**:
- [ ] Test against staging API
- [ ] Verify source badge displays correctly
- [ ] Test with various articles
- [ ] Test edge cases in staging

**Performance Validation**:
- [ ] Lighthouse score > 90 for performance
- [ ] Same number of API calls
- [ ] First Contentful Paint < 50ms increase

**Team Readiness**:
- [ ] Team reviewed deployment runbook
- [ ] Team practiced rollback procedure
- [ ] On-call engineer identified
- [ ] Monitoring dashboard prepared (if applicable)

**Communication**:
- [ ] Stakeholders notified of deployment
- [ ] Deployment time scheduled (low-traffic period)
- [ ] Status page updated (if applicable)

**Estimated Complexity**: Low

**Dependencies**: All previous tasks

**Acceptance Criteria**:
- [ ] All checklist items completed
- [ ] All validation passes
- [ ] Team sign-off received
- [ ] Ready for production deployment

---

## Task Dependencies Diagram

```
TASK-001 (Type Definition)
   ├─> TASK-002 (Utility Functions)
   │      ├─> TASK-005 (ArticleHeader Update)
   │      ├─> TASK-006 (ArticleCard Update)
   │      ├─> TASK-013 (Utility Tests)
   │      └─> TASK-004 (API Client Update)
   │
   ├─> TASK-003 (Logging)
   │      └─> TASK-004 (API Client Update)
   │
   ├─> TASK-007 (Article Detail Page)
   │
   └─> TASK-008 (Mock Factory) ← CENTRALIZED REUSABILITY
          ├─> TASK-009 (ArticleHeader Tests)
          ├─> TASK-010 (ArticleCard Tests)
          ├─> TASK-011 (useArticle Tests)
          ├─> TASK-012 (RecentArticlesList Tests)
          └─> TASK-013 (Utility Tests)

TASK-014 (Manual Testing) ← All implementation tasks

TASK-015 (Validation Script) ← All implementation tasks

TASK-016 (Rollback Testing) ← TASK-001 through TASK-015

TASK-017 (Deployment Runbook) ← All previous tasks

TASK-018 (Final Checklist) ← All previous tasks
```

---

## Testing Requirements

### Unit Test Coverage

**Centralized Test Infrastructure**:
- `/src/__test__/factories/articleFactory.ts` - TASK-008 ✅

**Files Requiring Tests**:
- `/src/utils/article.ts` - TASK-013 ✅
- `/src/components/articles/ArticleHeader.tsx` - TASK-009 ✅
- `/src/components/articles/ArticleCard.tsx` - TASK-010 ✅
- `/src/hooks/useArticle.ts` - TASK-011 ✅
- `/src/components/dashboard/RecentArticlesList.tsx` - TASK-012 ✅

**Target Coverage**:
- Overall: Maintain current coverage level
- New utilities: > 90% coverage
- Edge cases: 100% coverage

### Edge Case Test Matrix

| Scenario | Input | Expected Output | Test Location |
|----------|-------|-----------------|---------------|
| Normal case | `"Tech Blog"` | `"Tech Blog"` | TASK-013 |
| Null value | `null` | `"Unknown Source"` | TASK-009, TASK-013 (via factory) |
| Undefined value | `undefined` | `"Unknown Source"` | TASK-009, TASK-013 (via factory) |
| Empty string | `""` | `"Unknown Source"` | TASK-009, TASK-013 (via factory) |
| Whitespace only | `"   "` | `"Unknown Source"` | TASK-009, TASK-013 (via factory) |
| Whitespace padding | `"  Tech Blog  "` | `"Tech Blog"` | TASK-009, TASK-013 |
| Unicode characters | `"テックニュース🚀"` | `"テックニュース🚀"` | TASK-009, TASK-013 (via factory) |
| Non-string type | `123` | `"Unknown Source"` | TASK-013 |

---

## Rollback Plan

### Trigger Conditions

| Condition | Threshold | Action | Priority |
|-----------|-----------|--------|----------|
| API validation failures | > 5 per minute for 5 minutes | **Immediate rollback** | Critical |
| Missing source_name rate | > 20% of responses | **Immediate rollback** | Critical |
| Client-side error rate | > 5% of page loads | **Immediate rollback** | Critical |
| Fallback usage rate | > 50% of renders | **Investigate, prepare rollback** | High |
| User reports | > 10 similar issues/hour | **Investigate, prepare rollback** | High |

### Rollback Procedure

**Time to Rollback**: < 15 minutes

**Steps**:
1. **Immediate Response (< 5 minutes)**:
   ```bash
   git revert HEAD --no-edit
   npm run build
   # Deploy to production
   ```

2. **Verify Rollback (< 10 minutes)**:
   - Check application status
   - Verify no console errors
   - Monitor error rates return to baseline

3. **Post-Rollback (< 30 minutes)**:
   - Notify stakeholders
   - Root cause analysis
   - Plan remediation

---

## Monitoring and Observability

### Metrics to Track

**During Deployment**:
- API validation failure rate
- Missing source_name rate
- Fallback usage rate
- Client-side error rate
- Page load time

**Alert Thresholds**:
- API validation failures: > 5/minute
- Missing source_name: > 10% of requests
- Fallback usage: > 10% of renders
- Error rate: > 1% of page loads

### Logging Points

All logging implemented via `ArticleMigrationLogger`:
- API response format (development only)
- Validation failures (with article ID)
- Missing source_name (with context)
- Migration success events
- Fallback usage

---

## Timeline Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Infrastructure | TASK-001 to TASK-003 | 1 hour |
| Phase 2: API Client | TASK-004 | 30 minutes |
| Phase 3: Components | TASK-005 to TASK-007 | 30 minutes |
| Phase 4: Testing & Reusability | TASK-008 to TASK-013 | 2.5 hours |
| Phase 5: Validation | TASK-014 to TASK-016 | 1.5 hours |
| Phase 6: Documentation | TASK-017 to TASK-018 | 30 minutes |
| **Total** | **18 tasks** | **~5.5 hours** |

---

## Success Criteria

### Functional Requirements
- ✅ Article type uses `source_name` instead of `source_id`
- ✅ Source badge displays correctly on article pages
- ✅ Error handling for invalid source names
- ✅ All tests pass with updated mock data

### Non-Functional Requirements
- ✅ No TypeScript compilation errors
- ✅ No console warnings or errors
- ✅ Test coverage > 90% for new code
- ✅ No visual regressions
- ✅ Performance maintained

### Reliability Requirements
- ✅ Handles null/undefined/empty source_name gracefully
- ✅ Validates API responses before use
- ✅ Logs errors for debugging
- ✅ Fallback to "Unknown Source" works correctly

### Observability Requirements
- ✅ Structured logging implemented
- ✅ Validation script passes
- ✅ Rollback procedure tested
- ✅ Monitoring checklist complete

---

## Notes and Considerations

### Backend Coordination

**Critical**: Coordinate with backend team to ensure:
- Backend deploys `source_name` field before frontend deployment
- All articles return non-null `source_name`
- API versioning strategy (if applicable)

### Deployment Timing

**Recommended**:
- Deploy during low-traffic period
- Have on-call engineer available
- Monitor for 30-60 minutes post-deployment
- Keep previous version ready for quick rollback

### Cache Considerations

If using caching:
- Clear API response cache after deployment
- Clear CDN cache for article pages
- Consider browser cache invalidation strategy

---

---

## Reusable Patterns Documentation

This section documents reusable patterns extracted from this migration that can be applied to future feature implementations.

### Pattern 1: Centralized Mock Data Factory

**Pattern Name**: Test Data Factory Pattern

**Problem Solved**:
- Eliminates duplicated mock data definitions across test files
- Ensures consistency in test data structure
- Makes it easier to update mock data when types change
- Reduces maintenance burden when API contracts evolve

**Implementation Template**:
```typescript
// Location: /src/__test__/factories/{EntityName}Factory.ts

import { EntityType } from '@/types/api';

/**
 * Creates a mock {Entity} object with default or overridden values
 * @param overrides - Partial {Entity} object to override defaults
 * @returns Complete {Entity} object for testing
 */
export function createMock{Entity}(overrides: Partial<EntityType> = {}): EntityType {
  return {
    // Default values for all required fields
    id: 1,
    field1: 'default value',
    field2: 'default value',
    ...overrides,
  };
}

/**
 * Creates an array of mock entities with sequential IDs
 */
export function createMock{Entities}(
  count: number,
  baseOverrides: Partial<EntityType> = {}
): EntityType[] {
  return Array.from({ length: count }, (_, index) =>
    createMock{Entity}({
      ...baseOverrides,
      id: index + 1,
    })
  );
}

/**
 * Creates entities with specific edge cases for testing
 */
export function createMock{Entity}WithEdgeCase(
  edgeCase: 'null' | 'undefined' | 'empty' | 'invalid'
): EntityType {
  // Edge case implementations
}
```

**When to Use**:
- Any feature with more than 2 test files testing the same entity type
- When mock data structure needs to change frequently
- When testing edge cases across multiple components
- When onboarding new developers to maintain test consistency

**Benefits**:
- Single source of truth for test data
- Easier refactoring when types change
- Better test maintainability
- Reduced code duplication (typically 50-70% reduction in mock code)

---

### Pattern 2: Field Migration with Runtime Validation

**Pattern Name**: Validated API Response Migration Pattern

**Problem Solved**:
- Safely migrate from one API field to another
- Gracefully handle API response inconsistencies
- Provide fallback values for missing or invalid data
- Enable logging and monitoring during migration

**Implementation Template**:
```typescript
// Step 1: Create utility functions for normalization and validation
// Location: /src/utils/{entity}.ts

export function normalize{FieldName}(
  fieldValue: string | null | undefined
): string {
  if (!fieldValue || typeof fieldValue !== 'string' || fieldValue.trim() === '') {
    return 'Default Value';
  }
  return fieldValue.trim();
}

export function validate{Entity}(entity: any): entity is EntityType {
  return (
    entity &&
    typeof entity.id === 'number' &&
    typeof entity.required_field === 'string'
    // Validate all required fields
  );
}

// Step 2: Create logging utilities
// Location: /src/utils/logger.ts

export const {Entity}MigrationLogger = {
  logMissingField(entityId: number, context: string) {
    console.warn('[{Entity} Migration] Missing field:', {
      entityId,
      context,
      timestamp: new Date().toISOString(),
    });
  },
  logValidationFailure(entityId: number | undefined, receivedData: any) {
    console.error('[{Entity} Migration] Validation failure:', {
      entityId,
      receivedData: JSON.stringify(receivedData),
      timestamp: new Date().toISOString(),
    });
  },
};

// Step 3: Apply to API client
// Location: /src/lib/api/endpoints/{entities}.ts

export async function fetch{Entity}(id: number): Promise<EntityType> {
  const response = await apiClient.get<EntityType>(`/{entities}/${id}`);

  if (!validate{Entity}(response)) {
    {Entity}MigrationLogger.logValidationFailure(id, response);
    throw new Error(`Invalid {entity} data received from API for ID: ${id}`);
  }

  return {
    ...response,
    field_name: normalize{FieldName}(response.field_name),
  };
}
```

**When to Use**:
- Migrating from one API field to another
- Handling unreliable or evolving backend APIs
- Need for graceful degradation when data is missing
- Monitoring and debugging data quality issues

**Benefits**:
- Zero-downtime deployments
- Clear error logging for debugging
- Graceful fallback behavior
- Production-ready validation layer

---

### Pattern 3: Edge Case Testing Matrix

**Pattern Name**: Comprehensive Edge Case Matrix Pattern

**Problem Solved**:
- Ensures all edge cases are tested systematically
- Makes edge case coverage visible and auditable
- Prevents regressions when refactoring
- Documents expected behavior for unusual inputs

**Implementation Template**:
```markdown
### Edge Case Test Matrix

| Scenario | Input | Expected Output | Test Location |
|----------|-------|-----------------|---------------|
| Normal case | `"Valid Value"` | `"Valid Value"` | {test-file}.ts |
| Null value | `null` | `"Default"` | {test-file}.ts |
| Undefined value | `undefined` | `"Default"` | {test-file}.ts |
| Empty string | `""` | `"Default"` | {test-file}.ts |
| Whitespace only | `"   "` | `"Default"` | {test-file}.ts |
| Unicode | `"日本語🚀"` | `"日本語🚀"` | {test-file}.ts |
| Invalid type | `123` | `"Default"` | {test-file}.ts |
```

**Test Implementation**:
```typescript
describe('Edge Cases - {Field} Handling', () => {
  const edgeCases = [
    { name: 'null', input: null, expected: 'Default' },
    { name: 'undefined', input: undefined, expected: 'Default' },
    { name: 'empty string', input: '', expected: 'Default' },
    { name: 'whitespace', input: '   ', expected: 'Default' },
    { name: 'unicode', input: '日本語🚀', expected: '日本語🚀' },
  ];

  edgeCases.forEach(({ name, input, expected }) => {
    it(`should handle ${name}`, () => {
      const result = normalizeFunction(input);
      expect(result).toBe(expected);
    });
  });
});
```

**When to Use**:
- Functions that process user input or API data
- String normalization or validation logic
- Any code that handles optional or nullable fields
- Critical business logic that needs bulletproof edge case coverage

**Benefits**:
- Complete edge case coverage
- Easy to verify all cases are tested
- Self-documenting expected behavior
- Prevents production bugs from edge cases

---

### Pattern 4: Generic Validation Template

**Pattern Name**: Type-Safe Validation Guard Pattern

**Problem Solved**:
- Ensures runtime type safety for API responses
- TypeScript type guards for better type inference
- Reusable validation logic across different entity types
- Clear validation errors for debugging

**Implementation Template**:
```typescript
/**
 * Generic validation function template
 * @param entity - Any object to validate
 * @returns Type guard confirming entity matches expected type
 */
export function validate{Entity}(entity: any): entity is {Entity}Type {
  // Check for null/undefined
  if (!entity) {
    return false;
  }

  // Required number fields
  if (typeof entity.id !== 'number') {
    return false;
  }

  // Required string fields
  if (typeof entity.name !== 'string') {
    return false;
  }

  // Required date fields
  if (typeof entity.created_at !== 'string') {
    return false;
  }

  // Optional fields - allow missing but validate type if present
  if (entity.optional_field !== undefined &&
      typeof entity.optional_field !== 'string') {
    return false;
  }

  return true;
}
```

**When to Use**:
- Any API client function that receives external data
- Form validation
- Data import/export functionality
- Third-party API integrations

**Benefits**:
- Runtime type safety
- TypeScript type narrowing
- Clear validation rules
- Easier debugging of API contract issues

---

### Pattern 5: Gradual Migration Strategy

**Pattern Name**: Phased Field Migration with Logging

**Problem Solved**:
- Migrate APIs fields without breaking existing functionality
- Monitor migration progress in production
- Quick rollback if issues are detected
- Coordinate frontend/backend deployments

**Implementation Steps**:
1. **Phase 1**: Add validation and logging (frontend only)
2. **Phase 2**: Deploy backend with both old and new fields
3. **Phase 3**: Deploy frontend using new field with fallback
4. **Phase 4**: Monitor for 24-48 hours
5. **Phase 5**: Remove old field from backend
6. **Phase 6**: Clean up frontend fallback logic

**Migration Checklist Template**:
```markdown
- [ ] Backend deploys new field
- [ ] Verify 100% of responses include new field
- [ ] Frontend deployed with validation + logging
- [ ] Monitor error rates < 1%
- [ ] Monitor fallback usage < 5%
- [ ] 24-hour stability period passes
- [ ] Remove old field from backend
- [ ] Clean up frontend fallback code
```

**When to Use**:
- Breaking API changes
- High-traffic production systems
- When coordination between teams is needed
- Mission-critical features requiring zero downtime

**Benefits**:
- Zero-downtime migrations
- Clear rollback points
- Measurable migration progress
- Reduced deployment risk

---

**Document Status**: Ready for Implementation (v2.0 - Reusability Enhanced)
**Approved By**: Design evaluators (all ≥ 7.0/10.0)
**Reusability Review**: Passed (target ≥ 7.0/10.0)
**Next Step**: Execute Phase 1 tasks (TASK-001 to TASK-003)
