/**
 * Articles API Endpoints
 *
 * Functions for fetching articles from the API.
 */

import { apiClient } from '@/lib/api/client';
import type { Article, ArticlesQuery, ArticlesResponse, ArticleResponse } from '@/types/api';
import { validateArticle, normalizeSourceName } from '@/utils/article';
import { ArticleMigrationLogger } from '@/utils/logger';

/**
 * Build query string from query parameters
 *
 * @param query - Query parameters object
 * @returns Query string (e.g., '?page=1&limit=10')
 */
function buildQueryString(query?: ArticlesQuery): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.append('page', query.page.toString());
  }

  if (query.limit !== undefined) {
    params.append('limit', query.limit.toString());
  }

  if (query.source_id !== undefined) {
    params.append('source_id', query.source_id.toString());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch a paginated list of articles
 *
 * @param query - Query parameters (page, limit, sourceId)
 * @returns Promise resolving to articles response with pagination info
 * @throws {ApiError} When the request fails
 *
 * @example
 * ```typescript
 * // Get first page with default limit
 * const response = await getArticles({ page: 1 });
 *
 * // Get articles from specific source
 * const response = await getArticles({ sourceId: 'source-id', limit: 20 });
 * ```
 */
export async function getArticles(query?: ArticlesQuery): Promise<ArticlesResponse> {
  const queryString = buildQueryString(query);
  const endpoint = `/articles${queryString}`;

  const response = await apiClient.get<ArticlesResponse>(endpoint);

  // Log API response for debugging
  ArticleMigrationLogger.debugApiResponse(endpoint, response.length);

  // Validate and normalize each article
  const validatedArticles: Article[] = [];

  for (const article of response) {
    if (!validateArticle(article)) {
      ArticleMigrationLogger.errorValidationFailed(
        (article as Article | undefined)?.id ?? 0,
        'Invalid article structure'
      );
      continue; // Skip invalid articles instead of throwing
    }

    // Normalize source_name
    const originalSourceName = article.source_name;
    const normalizedSourceName = normalizeSourceName(article.source_name);

    if (originalSourceName !== normalizedSourceName) {
      ArticleMigrationLogger.infoSourceNameNormalized(
        article.id,
        originalSourceName,
        normalizedSourceName
      );
    }

    validatedArticles.push({
      ...article,
      source_name: normalizedSourceName,
    });
  }

  return validatedArticles;
}

/**
 * Fetch a single article by ID
 *
 * @param id - Article ID (number)
 * @returns Promise resolving to article response
 * @throws {ApiError} When the article is not found or request fails
 *
 * @example
 * ```typescript
 * try {
 *   const article = await getArticle(1);
 *   console.log('Article:', article);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     console.error('Article not found');
 *   }
 * }
 * ```
 */
export async function getArticle(id: number): Promise<ArticleResponse> {
  const endpoint = `/articles/${id}`;

  const article = await apiClient.get<ArticleResponse>(endpoint);

  // Validate article structure
  if (!validateArticle(article)) {
    ArticleMigrationLogger.errorValidationFailed(
      (article as Article | undefined)?.id ?? id,
      'Invalid article structure'
    );
    throw new Error('Invalid article response');
  }

  // Normalize source_name
  const originalSourceName = article.source_name;
  const normalizedSourceName = normalizeSourceName(article.source_name);

  if (originalSourceName !== normalizedSourceName) {
    ArticleMigrationLogger.infoSourceNameNormalized(
      article.id,
      originalSourceName,
      normalizedSourceName
    );
  }

  const normalizedArticle = {
    ...article,
    source_name: normalizedSourceName,
  };

  return normalizedArticle;
}

/**
 * Export types for convenience
 */
export type { Article, ArticlesQuery, ArticlesResponse, ArticleResponse };
