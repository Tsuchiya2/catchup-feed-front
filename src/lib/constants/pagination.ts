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

export type PageSize = (typeof PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES)[number];
