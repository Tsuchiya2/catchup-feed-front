/**
 * Sources API Endpoints
 *
 * Functions for fetching sources from the API.
 */

import { apiClient } from '@/lib/api/client';
import type {
  Source,
  SourcesResponse,
  SourceResponse,
  CreateSourceInput,
  UpdateSourceInput,
} from '@/types/api';

/**
 * Search parameters for source search
 */
export interface SourceSearchParams {
  keyword?: string;
  source_type?: string;
  active?: boolean;
}

/**
 * Build query string for source search
 *
 * @param params - Search parameters object
 * @returns Query string (e.g., '?keyword=test&source_type=RSS')
 */
function buildSourceSearchQueryString(params?: SourceSearchParams): string {
  if (!params) {
    return '';
  }

  const queryParams = new URLSearchParams();

  if (params.keyword !== undefined) {
    queryParams.append('keyword', params.keyword);
  }

  if (params.source_type !== undefined) {
    queryParams.append('source_type', params.source_type);
  }

  if (params.active !== undefined) {
    queryParams.append('active', params.active.toString());
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch all sources
 *
 * @returns Promise resolving to sources response
 * @throws {ApiError} When the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const response = await getSources();
 *   console.log('Sources:', response.sources);
 * } catch (error) {
 *   console.error('Failed to fetch sources:', error);
 * }
 * ```
 */
export async function getSources(): Promise<SourcesResponse> {
  const endpoint = '/sources';

  const response = await apiClient.get<SourcesResponse>(endpoint);
  return response;
}

/**
 * Search sources with various filters
 *
 * @param params - Search parameters (keyword, source_type, active)
 * @returns Promise resolving to sources response
 * @throws {ApiError} When the request fails
 *
 * @example
 * ```typescript
 * // Search by keyword
 * const response = await searchSources({ keyword: 'tech' });
 *
 * // Search with filters
 * const response = await searchSources({
 *   keyword: 'blog',
 *   source_type: 'RSS',
 *   active: true
 * });
 * ```
 */
export async function searchSources(params?: SourceSearchParams): Promise<SourcesResponse> {
  const queryString = buildSourceSearchQueryString(params);
  const endpoint = `/sources/search${queryString}`;

  const response = await apiClient.get<SourcesResponse>(endpoint);
  return response;
}

/**
 * Fetch a single source by ID
 *
 * @param id - Source ID (number)
 * @returns Promise resolving to source response
 * @throws {ApiError} When the source is not found or request fails
 *
 * @example
 * ```typescript
 * try {
 *   const source = await getSource(1);
 *   console.log('Source:', source);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     console.error('Source not found');
 *   }
 * }
 * ```
 */
export async function getSource(id: number): Promise<SourceResponse> {
  const endpoint = `/sources/${id}`;

  const response = await apiClient.get<SourceResponse>(endpoint);
  return response;
}

/**
 * Update source active status
 *
 * @param id - Source ID
 * @param active - New active status
 * @returns Promise resolving to updated source
 * @throws {ApiError} When the request fails
 *
 * @example
 * ```typescript
 * try {
 *   const updatedSource = await updateSourceActive(1, false);
 *   console.log('Source updated:', updatedSource);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 403) {
 *     console.error('Permission denied');
 *   }
 * }
 * ```
 */
export async function updateSourceActive(id: number, active: boolean): Promise<SourceResponse> {
  const endpoint = `/sources/${id}`;
  const response = await apiClient.put<SourceResponse>(endpoint, { active });
  return response;
}

/**
 * Create a new source
 *
 * @param data - Source creation input (name and feedURL)
 * @returns Promise resolving when creation is complete
 * @throws {ApiError} When the request fails (400, 401, 403, 500)
 *
 * @example
 * ```typescript
 * try {
 *   await createSource({
 *     name: 'Tech Blog',
 *     feedURL: 'https://techblog.com/feed.xml'
 *   });
 *   console.log('Source created successfully');
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 403) {
 *     console.error('Permission denied - admin access required');
 *   }
 * }
 * ```
 */
export async function createSource(data: CreateSourceInput): Promise<void> {
  const endpoint = '/sources';
  await apiClient.post(endpoint, data);
}

/**
 * Update an existing source
 *
 * @param id - Source ID
 * @param data - Source update input (name, feedURL, and active status)
 * @returns Promise resolving to updated source
 * @throws {ApiError} When the request fails (400, 401, 403, 404, 500)
 *
 * @example
 * ```typescript
 * try {
 *   const updatedSource = await updateSource(1, {
 *     name: 'Updated Tech Blog',
 *     feedURL: 'https://techblog.com/new-feed.xml',
 *     active: true
 *   });
 *   console.log('Source updated:', updatedSource);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 403) {
 *     console.error('Permission denied - admin access required');
 *   } else if (error instanceof ApiError && error.status === 404) {
 *     console.error('Source not found');
 *   }
 * }
 * ```
 */
export async function updateSource(id: number, data: UpdateSourceInput): Promise<SourceResponse> {
  const endpoint = `/sources/${id}`;
  const response = await apiClient.put<SourceResponse>(endpoint, data);
  return response;
}

/**
 * Delete a source
 *
 * @param id - Source ID
 * @returns Promise resolving when deletion is complete
 * @throws {ApiError} When the request fails (401, 403, 404, 500)
 *
 * @example
 * ```typescript
 * try {
 *   await deleteSource(1);
 *   console.log('Source deleted successfully');
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 403) {
 *     console.error('Permission denied - admin access required');
 *   } else if (error instanceof ApiError && error.status === 404) {
 *     console.error('Source not found');
 *   }
 * }
 * ```
 */
export async function deleteSource(id: number): Promise<void> {
  const endpoint = `/sources/${id}`;
  await apiClient.delete(endpoint);
}

/**
 * Export types for convenience
 */
export type { Source, SourcesResponse, SourceResponse, CreateSourceInput, UpdateSourceInput };
