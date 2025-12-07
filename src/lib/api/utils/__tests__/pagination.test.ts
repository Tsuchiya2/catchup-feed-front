import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildPaginationQuery,
  extractPaginationMetadata,
  validatePaginationParams,
  isValidPage,
  validatePaginatedResponse,
} from '../pagination';
import { PAGINATION_CONFIG } from '@/lib/constants/pagination';
import type { PaginatedResponse, PaginationMetadata } from '@/types/api';

describe('pagination utils', () => {
  describe('buildPaginationQuery', () => {
    describe('valid inputs', () => {
      it('should build query with default page and limit when no params provided', () => {
        // Act
        const result = buildPaginationQuery();

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should build query with valid page and default limit', () => {
        // Act
        const result = buildPaginationQuery(5);

        // Assert
        expect(result).toBe('?page=5&limit=10');
      });

      it('should build query with valid page and valid limit', () => {
        // Act
        const result = buildPaginationQuery(2, 20);

        // Assert
        expect(result).toBe('?page=2&limit=20');
      });

      it('should accept all available page sizes', () => {
        // Arrange
        const pageSizes = PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES;

        // Act & Assert
        pageSizes.forEach((size) => {
          const result = buildPaginationQuery(1, size);
          expect(result).toBe(`?page=1&limit=${size}`);
        });
      });

      it('should build query with maximum page size', () => {
        // Act
        const result = buildPaginationQuery(1, 100);

        // Assert
        expect(result).toBe('?page=1&limit=100');
      });

      it('should build query with minimum page size', () => {
        // Act
        const result = buildPaginationQuery(1, 10);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });
    });

    describe('boundary values', () => {
      it('should use default page when page is 0', () => {
        // Act
        const result = buildPaginationQuery(0, 10);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default page when page is negative', () => {
        // Act
        const result = buildPaginationQuery(-5, 10);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is not in available sizes', () => {
        // Act
        const result = buildPaginationQuery(1, 15);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is too small', () => {
        // Act
        const result = buildPaginationQuery(1, 5);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is too large', () => {
        // Act
        const result = buildPaginationQuery(1, 200);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });
    });

    describe('invalid inputs', () => {
      it('should use defaults when page is null', () => {
        // Act
        const result = buildPaginationQuery(null as any);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use defaults when page is undefined', () => {
        // Act
        const result = buildPaginationQuery(undefined);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is null', () => {
        // Act
        const result = buildPaginationQuery(1, null as any);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is undefined', () => {
        // Act
        const result = buildPaginationQuery(1, undefined);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use defaults when page is NaN', () => {
        // Act
        const result = buildPaginationQuery(NaN);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use default limit when limit is NaN', () => {
        // Act
        const result = buildPaginationQuery(1, NaN);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });

      it('should use defaults when both params are invalid', () => {
        // Act
        const result = buildPaginationQuery(NaN, NaN);

        // Assert
        expect(result).toBe('?page=1&limit=10');
      });
    });
  });

  describe('extractPaginationMetadata', () => {
    describe('valid inputs', () => {
      it('should convert snake_case to camelCase', () => {
        // Arrange
        const input = {
          page: 1,
          limit: 10,
          total: 100,
          total_pages: 10,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        });
      });

      it('should handle zero total and total_pages', () => {
        // Arrange
        const input = {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      });

      it('should handle large page numbers', () => {
        // Arrange
        const input = {
          page: 999,
          limit: 100,
          total: 99900,
          total_pages: 999,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result).toEqual({
          page: 999,
          limit: 100,
          total: 99900,
          totalPages: 999,
        });
      });

      it('should preserve exact numeric values', () => {
        // Arrange
        const input = {
          page: 5,
          limit: 20,
          total: 87,
          total_pages: 5,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result.page).toBe(5);
        expect(result.limit).toBe(20);
        expect(result.total).toBe(87);
        expect(result.totalPages).toBe(5);
      });
    });

    describe('boundary values', () => {
      it('should handle minimum values', () => {
        // Arrange
        const input = {
          page: 1,
          limit: 1,
          total: 1,
          total_pages: 1,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        });
      });

      it('should handle single page result', () => {
        // Arrange
        const input = {
          page: 1,
          limit: 10,
          total: 5,
          total_pages: 1,
        };

        // Act
        const result = extractPaginationMetadata(input);

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
        });
      });
    });
  });

  describe('validatePaginationParams', () => {
    describe('valid inputs', () => {
      it('should return defaults when no params provided', () => {
        // Arrange
        const params = new URLSearchParams();

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result).toEqual({
          page: PAGINATION_CONFIG.DEFAULT_PAGE,
          limit: PAGINATION_CONFIG.DEFAULT_LIMIT,
        });
      });

      it('should validate and return valid page param', () => {
        // Arrange
        const params = new URLSearchParams('page=5');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(5);
        expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_LIMIT);
      });

      it('should validate and return valid limit param', () => {
        // Arrange
        const params = new URLSearchParams('limit=20');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(PAGINATION_CONFIG.DEFAULT_PAGE);
        expect(result.limit).toBe(20);
      });

      it('should validate and return both valid params', () => {
        // Arrange
        const params = new URLSearchParams('page=3&limit=50');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result).toEqual({ page: 3, limit: 50 });
      });

      it('should accept all available page sizes', () => {
        // Arrange
        const pageSizes = PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES;

        // Act & Assert
        pageSizes.forEach((size) => {
          const params = new URLSearchParams(`limit=${size}`);
          const result = validatePaginationParams(params);
          expect(result.limit).toBe(size);
        });
      });
    });

    describe('boundary values', () => {
      it('should use default when page is 0', () => {
        // Arrange
        const params = new URLSearchParams('page=0');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(PAGINATION_CONFIG.DEFAULT_PAGE);
      });

      it('should use default when page is negative', () => {
        // Arrange
        const params = new URLSearchParams('page=-5');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(PAGINATION_CONFIG.DEFAULT_PAGE);
      });

      it('should accept very large page numbers', () => {
        // Arrange
        const params = new URLSearchParams('page=99999');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(99999);
      });

      it('should use default limit when limit is not in available sizes', () => {
        // Arrange
        const params = new URLSearchParams('limit=15');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_LIMIT);
      });

      it('should use default limit when limit is 0', () => {
        // Arrange
        const params = new URLSearchParams('limit=0');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_LIMIT);
      });
    });

    describe('invalid inputs', () => {
      it('should use default when page is not a number', () => {
        // Arrange
        const params = new URLSearchParams('page=abc');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(PAGINATION_CONFIG.DEFAULT_PAGE);
      });

      it('should use default limit when limit is not a number', () => {
        // Arrange
        const params = new URLSearchParams('limit=xyz');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.limit).toBe(PAGINATION_CONFIG.DEFAULT_LIMIT);
      });

      it('should handle empty string values', () => {
        // Arrange
        const params = new URLSearchParams('page=&limit=');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result).toEqual({
          page: PAGINATION_CONFIG.DEFAULT_PAGE,
          limit: PAGINATION_CONFIG.DEFAULT_LIMIT,
        });
      });

      it('should handle decimal page numbers', () => {
        // Arrange
        const params = new URLSearchParams('page=3.5');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.page).toBe(3); // parseInt truncates
      });

      it('should handle decimal limit values', () => {
        // Arrange
        const params = new URLSearchParams('limit=20.7');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result.limit).toBe(20);
      });

      it('should use defaults when both params are invalid', () => {
        // Arrange
        const params = new URLSearchParams('page=invalid&limit=invalid');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result).toEqual({
          page: PAGINATION_CONFIG.DEFAULT_PAGE,
          limit: PAGINATION_CONFIG.DEFAULT_LIMIT,
        });
      });

      it('should ignore extra query parameters', () => {
        // Arrange
        const params = new URLSearchParams('page=2&limit=20&extra=value&another=param');

        // Act
        const result = validatePaginationParams(params);

        // Assert
        expect(result).toEqual({ page: 2, limit: 20 });
      });
    });
  });

  describe('isValidPage', () => {
    describe('valid cases', () => {
      it('should return true when page is within valid range', () => {
        // Act & Assert
        expect(isValidPage(1, 10)).toBe(true);
        expect(isValidPage(5, 10)).toBe(true);
        expect(isValidPage(10, 10)).toBe(true);
      });

      it('should return true when page equals totalPages', () => {
        // Act & Assert
        expect(isValidPage(1, 1)).toBe(true);
        expect(isValidPage(100, 100)).toBe(true);
      });

      it('should return true for first page', () => {
        // Act & Assert
        expect(isValidPage(1, 50)).toBe(true);
      });

      it('should return true for last page', () => {
        // Act & Assert
        expect(isValidPage(50, 50)).toBe(true);
      });
    });

    describe('invalid cases', () => {
      it('should return false when page is 0', () => {
        // Act & Assert
        expect(isValidPage(0, 10)).toBe(false);
      });

      it('should return false when page is negative', () => {
        // Act & Assert
        expect(isValidPage(-1, 10)).toBe(false);
        expect(isValidPage(-100, 10)).toBe(false);
      });

      it('should return false when page exceeds totalPages', () => {
        // Act & Assert
        expect(isValidPage(11, 10)).toBe(false);
        expect(isValidPage(100, 10)).toBe(false);
      });

      it('should return false when totalPages is 0', () => {
        // Act & Assert
        expect(isValidPage(1, 0)).toBe(false);
      });

      it('should return false when totalPages is negative', () => {
        // Act & Assert
        expect(isValidPage(1, -1)).toBe(false);
      });

      it('should return false when both values are 0', () => {
        // Act & Assert
        expect(isValidPage(0, 0)).toBe(false);
      });

      it('should return false when both values are negative', () => {
        // Act & Assert
        expect(isValidPage(-5, -10)).toBe(false);
      });
    });

    describe('boundary values', () => {
      it('should handle single page scenario', () => {
        // Act & Assert
        expect(isValidPage(1, 1)).toBe(true);
        expect(isValidPage(2, 1)).toBe(false);
        expect(isValidPage(0, 1)).toBe(false);
      });

      it('should handle large page numbers', () => {
        // Act & Assert
        expect(isValidPage(999, 1000)).toBe(true);
        expect(isValidPage(1000, 1000)).toBe(true);
        expect(isValidPage(1001, 1000)).toBe(false);
      });
    });
  });

  describe('validatePaginatedResponse', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
      // Suppress console errors in tests
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('valid responses', () => {
      it('should return true for valid paginated response', () => {
        // Arrange
        const response: PaginatedResponse<any> = {
          data: [{ id: 1 }, { id: 2 }],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(true);
      });

      it('should return true for empty data array', () => {
        // Arrange
        const response: PaginatedResponse<any> = {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            total_pages: 0,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(true);
      });

      it('should return true for response with large data array', () => {
        // Arrange
        const largeData = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
        const response: PaginatedResponse<any> = {
          data: largeData,
          pagination: {
            page: 1,
            limit: 100,
            total: 100,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(true);
      });

      it('should return true for response with all pagination fields as numbers', () => {
        // Arrange
        const response: PaginatedResponse<any> = {
          data: [{ test: 'data' }],
          pagination: {
            page: 5,
            limit: 20,
            total: 87,
            total_pages: 5,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/test');

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('invalid response structure', () => {
      it('should return false when response is null', () => {
        // Act
        const result = validatePaginatedResponse(null, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[API] Invalid response from /api/articles: Not an object'
        );
      });

      it('should return false when response is undefined', () => {
        // Act
        const result = validatePaginatedResponse(undefined, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[API] Invalid response from /api/articles: Not an object'
        );
      });

      it('should return false when response is not an object', () => {
        // Act
        const result1 = validatePaginatedResponse('string', '/api/articles');
        const result2 = validatePaginatedResponse(123, '/api/articles');
        const result3 = validatePaginatedResponse(true, '/api/articles');

        // Assert
        expect(result1).toBe(false);
        expect(result2).toBe(false);
        expect(result3).toBe(false);
      });

      it('should return false when data field is missing', () => {
        // Arrange
        const response = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            total_pages: 0,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid response from /api/articles: Missing or invalid 'data' array"
        );
      });

      it('should return false when data is not an array', () => {
        // Arrange
        const response = {
          data: 'not-an-array',
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            total_pages: 0,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid response from /api/articles: Missing or invalid 'data' array"
        );
      });

      it('should return false when data is null', () => {
        // Arrange
        const response = {
          data: null,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            total_pages: 0,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when pagination field is missing', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid response from /api/articles: Missing or invalid 'pagination' object"
        );
      });

      it('should return false when pagination is not an object', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: 'not-an-object',
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when pagination is null', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: null,
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when pagination is an array', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: [],
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('invalid pagination fields', () => {
      it('should return false when page field is missing', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            limit: 10,
            total: 1,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid pagination metadata: Missing or invalid 'page'"
        );
      });

      it('should return false when limit field is missing', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            total: 1,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid pagination metadata: Missing or invalid 'limit'"
        );
      });

      it('should return false when total field is missing', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 10,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid pagination metadata: Missing or invalid 'total'"
        );
      });

      it('should return false when total_pages field is missing', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[API] Invalid pagination metadata: Missing or invalid 'total_pages'"
        );
      });

      it('should return false when page is not a number', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: '1',
            limit: 10,
            total: 1,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when limit is not a number', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: '10',
            total: 1,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when total is not a number', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 10,
            total: '1',
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when total_pages is not a number', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            total_pages: '1',
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when pagination fields are null', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: null,
            limit: null,
            total: null,
            total_pages: null,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when pagination fields are undefined', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: undefined,
            limit: undefined,
            total: undefined,
            total_pages: undefined,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should validate correct endpoint in error messages', () => {
        // Arrange
        const response = null;
        const endpoint = '/api/custom-endpoint';

        // Act
        validatePaginatedResponse(response, endpoint);

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `[API] Invalid response from ${endpoint}: Not an object`
        );
      });

      it('should handle response with extra fields', () => {
        // Arrange
        const response = {
          data: [{ id: 1 }],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            total_pages: 1,
            extra_field: 'ignored',
          },
          another_field: 'also-ignored',
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(true);
      });

      it('should handle deeply nested objects in data array', () => {
        // Arrange
        const response: PaginatedResponse<any> = {
          data: [
            {
              id: 1,
              nested: {
                deep: {
                  value: 'test',
                },
              },
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            total_pages: 1,
          },
        };

        // Act
        const result = validatePaginatedResponse(response, '/api/articles');

        // Assert
        expect(result).toBe(true);
      });
    });
  });
});
