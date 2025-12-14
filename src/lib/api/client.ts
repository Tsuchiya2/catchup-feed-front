/**
 * API Client
 *
 * Type-safe HTTP client for the Catchup Feed backend API.
 * Automatically injects JWT tokens and handles authentication errors.
 */

import { getAuthToken, clearAuthToken } from '@/lib/auth/token';
import { ApiError, NetworkError, TimeoutError } from '@/lib/api/errors';

/**
 * API request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeout?: number;
}

/**
 * API Client class for making type-safe HTTP requests
 */
class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  /**
   * Make an HTTP request to the API
   *
   * @param endpoint - API endpoint path (e.g., '/auth/token')
   * @param options - Request options
   * @returns Promise resolving to the response data
   * @throws {ApiError} When the API returns an error response
   * @throws {NetworkError} When the network request fails
   * @throws {TimeoutError} When the request times out
   */
  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      timeout = this.defaultTimeout,
    } = options;

    // Construct full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add Authorization header if authentication is required
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Prepare request init
    const init: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Make the request
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        clearAuthToken();

        // Redirect to login page on client-side
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw new ApiError('Authentication required', 401);
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData.details
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      // Handle empty response body (e.g., 201 Created with no body)
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0') {
        return undefined as T;
      }

      // Parse successful response
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        return undefined as T;
      }
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request to ${endpoint} timed out after ${timeout}ms`);
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError(`Failed to connect to ${url}`);
      }

      // Unknown error
      throw error;
    }
  }

  /**
   * Make a GET request
   */
  public async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  public async post<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  public async put<T>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Parse error response from the API
   */
  private async parseErrorResponse(
    response: Response
  ): Promise<{ message: string; details?: Record<string, unknown> }> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || 'An error occurred',
        details: data.details,
      };
    } catch {
      return {
        message: `Request failed with status ${response.status}`,
      };
    }
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();

/**
 * Export the ApiClient class for testing purposes
 */
export { ApiClient };
