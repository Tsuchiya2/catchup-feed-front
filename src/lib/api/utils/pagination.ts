import type { PaginatedResponse } from '@/types/api';
import { PAGINATION_CONFIG } from '@/lib/constants/pagination';

/**
 * Build pagination query string from parameters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Query string with validated pagination parameters
 */
export function buildPaginationQuery(page?: number, limit?: number): string {
  const params = new URLSearchParams();

  const validPage = page && page > 0 ? page : PAGINATION_CONFIG.DEFAULT_PAGE;
  const validLimit =
    limit && PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES.includes(limit as any)
      ? limit
      : PAGINATION_CONFIG.DEFAULT_LIMIT;

  params.set('page', validPage.toString());
  params.set('limit', validLimit.toString());

  return `?${params.toString()}`;
}

/**
 * Extract pagination metadata from API response
 * Converts snake_case to camelCase for frontend consistency
 * @param pagination - Pagination metadata from backend (snake_case)
 * @returns Pagination metadata in camelCase format
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
 * @param params - URLSearchParams from URL
 * @returns Validated page and limit values
 */
export function validatePaginationParams(params: URLSearchParams): {
  page: number;
  limit: number;
} {
  const pageParam = params.get('page');
  const limitParam = params.get('limit');

  let page: number = PAGINATION_CONFIG.DEFAULT_PAGE;
  let limit: number = PAGINATION_CONFIG.DEFAULT_LIMIT;

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
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns True if page is within valid range
 */
export function isValidPage(page: number, totalPages: number): boolean {
  return page > 0 && page <= totalPages;
}

/**
 * Validate paginated response structure
 * @template T - The type of items in the data array
 * @param response - Response object to validate
 * @param endpoint - Endpoint name for error logging
 * @returns True if response has valid paginated structure
 */
export function validatePaginatedResponse<T>(
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
    console.error(
      `[API] Invalid response from ${endpoint}: Missing or invalid 'pagination' object`
    );
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
