/**
 * Article Mock Data Factory
 *
 * Centralized factory for creating mock Article objects in tests.
 * Ensures consistency across all test files.
 */

import type { Article } from '@/types/api';

/**
 * Default mock article values
 */
const defaultArticle: Article = {
  id: 1,
  source_id: 1,
  source_name: 'Tech Blog',
  title: 'Test Article Title',
  url: 'https://example.com/article',
  summary: 'This is a test article summary for testing purposes.',
  published_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

/**
 * Creates a single mock article with optional overrides.
 */
export function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    ...defaultArticle,
    ...overrides,
  };
}

/**
 * Creates multiple mock articles with sequential IDs.
 */
export function createMockArticles(
  count: number,
  overridesArray: Partial<Article>[] = []
): Article[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesArray[index] || {};
    return createMockArticle({
      id: index + 1,
      title: `Test Article ${index + 1}`,
      ...overrides,
    });
  });
}

/**
 * Creates a mock article with specific source name edge case.
 */
export function createMockArticleWithSourceEdgeCase(
  edgeCase: 'null' | 'undefined' | 'empty' | 'whitespace' | 'long' | 'unicode'
): Article {
  const edgeCaseValues: Record<string, string | null | undefined> = {
    null: null as unknown as string,
    undefined: undefined as unknown as string,
    empty: '',
    whitespace: '   ',
    long: 'A'.repeat(200),
    unicode: 'テックブログ 🚀',
  };

  return createMockArticle({
    source_name: edgeCaseValues[edgeCase] as string,
  });
}
