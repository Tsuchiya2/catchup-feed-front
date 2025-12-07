/**
 * Article Utilities
 *
 * Utility functions for article data handling with proper fallbacks.
 */

import type { Article } from '@/types/api';

/**
 * Normalizes source name with fallback for invalid values.
 *
 * @param sourceName - The source name to normalize (may be null, undefined, or invalid)
 * @returns Normalized source name or "Unknown Source" fallback
 */
export function normalizeSourceName(sourceName: string | null | undefined): string {
  if (!sourceName || typeof sourceName !== 'string' || sourceName.trim() === '') {
    return 'Unknown Source';
  }
  return sourceName.trim();
}

/**
 * Type guard to validate if an object is a valid Article.
 *
 * @param article - Unknown object to validate
 * @returns True if the object is a valid Article
 */
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
