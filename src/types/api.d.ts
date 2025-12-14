/**
 * API Type Definitions
 *
 * This file contains TypeScript types for the Catchup Feed backend API.
 *
 * To regenerate types from the OpenAPI spec, run:
 *   npm run generate:api
 *
 * This requires the backend API server to be running on http://localhost:8080
 */

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response with JWT token
 * Note: Backend returns only token, expiresAt is not included in response
 */
export interface LoginResponse {
  token: string;
}

/**
 * Token validation response
 */
export interface TokenValidationResponse {
  valid: boolean;
  userId?: string;
  email?: string;
}

// ============================================================================
// Article Types
// ============================================================================

/**
 * Article entity
 * Matches backend DTO: internal/handler/http/article/dto.go
 */
export interface Article {
  id: number;
  source_id: number;
  source_name: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  created_at: string;
}

/**
 * Query parameters for fetching articles
 */
export interface ArticlesQuery {
  page?: number;
  limit?: number;
  source_id?: number;
}

// ============================================================================
// Pagination Types
// ============================================================================

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

/**
 * Articles list response
 * Updated to use paginated format
 */
export type ArticlesResponse = PaginatedArticlesResponse;

/**
 * Single article response
 */
export type ArticleResponse = Article;

// ============================================================================
// Source Types
// ============================================================================

/**
 * Source entity
 * Matches backend DTO: internal/handler/http/source/dto.go
 */
export interface Source {
  id: number;
  name: string;
  feed_url: string;
  last_crawled_at?: string | null;
  active: boolean;
}

/**
 * Sources list response
 * Backend returns array directly, not wrapped in object
 */
export type SourcesResponse = Source[];

/**
 * Single source response
 */
export type SourceResponse = Source;

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Common Types
// ============================================================================

/**
 * Pagination information (frontend format with camelCase)
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: ApiErrorResponse;
}

// ============================================================================
// Source Creation Types
// ============================================================================

/**
 * Input data for creating a new source
 * Matches backend API contract for POST /sources
 */
export interface CreateSourceInput {
  /** Source name (max 255 characters) */
  name: string;
  /** RSS/Atom feed URL (max 2048 characters) */
  feedURL: string;
}

/**
 * Form field state for source creation form
 * Used internally by AddSourceForm component
 */
export interface SourceFormData {
  /** Source name */
  name: string;
  /** RSS/Atom feed URL */
  feedURL: string;
}

/**
 * Form validation errors for source creation
 */
export interface SourceFormErrors {
  /** Error message for name field */
  name?: string;
  /** Error message for feedURL field */
  feedURL?: string;
}
