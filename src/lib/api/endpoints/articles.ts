/**
 * Articles API Endpoints
 *
 * Functions for fetching articles from the API.
 */

import { apiClient } from '@/lib/api/client';
import type {
  Article,
  ArticlesQuery,
  ArticlesResponse,
  ArticleResponse,
  PaginatedArticlesResponse,
} from '@/types/api';
import { validatePaginatedResponse } from '@/lib/api/utils/pagination';

/**
 * Search parameters for article search
 */
export interface ArticleSearchParams {
  keyword?: string;
  source_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
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
 * Build query string for article search
 *
 * @param params - Search parameters object
 * @returns Query string (e.g., '?keyword=test&page=1&limit=10')
 */
function buildSearchQueryString(params?: ArticleSearchParams): string {
  if (!params) {
    return '';
  }

  const queryParams = new URLSearchParams();

  if (params.keyword !== undefined) {
    queryParams.append('keyword', params.keyword);
  }

  if (params.source_id !== undefined) {
    queryParams.append('source_id', params.source_id.toString());
  }

  if (params.from !== undefined) {
    queryParams.append('from', params.from);
  }

  if (params.to !== undefined) {
    queryParams.append('to', params.to);
  }

  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }

  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch a paginated list of articles
 *
 * @param query - Query parameters (page, limit, sourceId)
 * @returns Promise resolving to paginated articles response with pagination info
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
export async function getArticles(query?: ArticlesQuery): Promise<PaginatedArticlesResponse> {
  const queryString = buildQueryString(query);
  const endpoint = `/articles${queryString}`;

  // Performance measurement start
  const perfMarkStart = `api-get-articles-${Date.now()}`;
  performance.mark(perfMarkStart);

  try {
    const response = await apiClient.get<PaginatedArticlesResponse>(endpoint);

    // Validate response structure
    if (!validatePaginatedResponse<Article>(response, endpoint)) {
      console.error(`[API] Response validation failed for ${endpoint}`, {
        timestamp: new Date().toISOString(),
        query,
      });
      throw new Error(`Invalid paginated response from ${endpoint}`);
    }

    // Log API response for debugging
    ArticleMigrationLogger.debugApiResponse(endpoint, response.data.length);

    // Validate and normalize each article
    const validatedArticles: Article[] = [];

    for (const article of response.data) {
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

    // Performance measurement end
    const perfMarkEnd = `api-get-articles-end-${Date.now()}`;
    performance.mark(perfMarkEnd);
    performance.measure('API: getArticles', perfMarkStart, perfMarkEnd);

    const perfMeasure = performance.getEntriesByName('API: getArticles')[0];
    if (perfMeasure) {
      console.log(`[Performance] getArticles completed in ${perfMeasure.duration.toFixed(2)}ms`, {
        endpoint,
        itemCount: validatedArticles.length,
        pagination: response.pagination,
      });
    }

    // Clean up performance marks
    performance.clearMarks(perfMarkStart);
    performance.clearMarks(perfMarkEnd);
    performance.clearMeasures('API: getArticles');

    return {
      data: validatedArticles,
      pagination: response.pagination,
    };
  } catch (error) {
    // Enhanced error logging
    console.error(`[API] Error in getArticles`, {
      timestamp: new Date().toISOString(),
      endpoint,
      query,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Clean up performance marks on error
    performance.clearMarks(perfMarkStart);
    performance.clearMeasures('API: getArticles');

    throw error;
  }
}

/**
 * Search articles with various filters
 *
 * @param params - Search parameters (keyword, source_id, from, to, page, limit)
 * @returns Promise resolving to paginated articles response
 * @throws {ApiError} When the request fails
 *
 * @example
 * ```typescript
 * // Search by keyword
 * const response = await searchArticles({ keyword: 'typescript' });
 *
 * // Search with date range and source filter
 * const response = await searchArticles({
 *   keyword: 'react',
 *   source_id: 1,
 *   from: '2025-01-01',
 *   to: '2025-12-31',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export async function searchArticles(
  params?: ArticleSearchParams
): Promise<PaginatedArticlesResponse> {
  const queryString = buildSearchQueryString(params);
  const endpoint = `/articles/search${queryString}`;

  // Performance measurement start
  const perfMarkStart = `api-search-articles-${Date.now()}`;
  performance.mark(perfMarkStart);

  try {
    const response = await apiClient.get<PaginatedArticlesResponse>(endpoint);

    // Validate response structure
    if (!validatePaginatedResponse<Article>(response, endpoint)) {
      console.error(`[API] Response validation failed for ${endpoint}`, {
        timestamp: new Date().toISOString(),
        params,
      });
      throw new Error(`Invalid paginated response from ${endpoint}`);
    }

    // Log API response for debugging
    ArticleMigrationLogger.debugApiResponse(endpoint, response.data.length);

    // Validate and normalize each article
    const validatedArticles: Article[] = [];

    for (const article of response.data) {
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

    // Performance measurement end
    const perfMarkEnd = `api-search-articles-end-${Date.now()}`;
    performance.mark(perfMarkEnd);
    performance.measure('API: searchArticles', perfMarkStart, perfMarkEnd);

    const perfMeasure = performance.getEntriesByName('API: searchArticles')[0];
    if (perfMeasure) {
      console.log(
        `[Performance] searchArticles completed in ${perfMeasure.duration.toFixed(2)}ms`,
        {
          endpoint,
          itemCount: validatedArticles.length,
          pagination: response.pagination,
        }
      );
    }

    // Clean up performance marks
    performance.clearMarks(perfMarkStart);
    performance.clearMarks(perfMarkEnd);
    performance.clearMeasures('API: searchArticles');

    return {
      data: validatedArticles,
      pagination: response.pagination,
    };
  } catch (error) {
    // Enhanced error logging
    console.error(`[API] Error in searchArticles`, {
      timestamp: new Date().toISOString(),
      endpoint,
      params,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Clean up performance marks on error
    performance.clearMarks(perfMarkStart);
    performance.clearMeasures('API: searchArticles');

    throw error;
  }
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
