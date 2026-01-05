/**
 * Centralized Error Messages
 *
 * Provides user-friendly error messages for form validation and API errors.
 * Ensures consistent error messaging across the application.
 */

/**
 * Collection of user-facing error messages
 * Used for form validation and display purposes
 */
export const ERROR_MESSAGES = {
  NAME_REQUIRED: 'Name is required',
  NAME_MAX_LENGTH: 'Maximum 255 characters allowed',
  URL_REQUIRED: 'Feed URL is required',
  URL_INVALID: 'Please enter a valid URL',
  URL_MAX_LENGTH: 'Maximum 2048 characters allowed',
  NETWORK_ERROR: 'Connection failed. Please check your internet and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  PERMISSION_DENIED: 'You do not have permission to edit this source.',
  NOT_FOUND: 'Source not found. It may have been deleted.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

/**
 * Type for error message keys
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Maps HTTP status codes to user-friendly error messages
 *
 * @param status - HTTP status code
 * @param serverMessage - Optional server-provided error message
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * // Network error
 * const message = getApiErrorMessage(0);
 * // Returns: "Connection failed. Please check your internet and try again."
 *
 * // Authentication error
 * const message = getApiErrorMessage(401);
 * // Returns: "Your session has expired. Please log in again."
 *
 * // Server error with custom message
 * const message = getApiErrorMessage(500, "Database connection timeout");
 * // Returns: "Server error. Please try again later."
 * ```
 */
export function getApiErrorMessage(status: number, serverMessage?: string): string {
  // Network errors (no status code)
  if (status === 0) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Authentication errors
  if (status === 401) {
    return ERROR_MESSAGES.SESSION_EXPIRED;
  }

  // Permission errors
  if (status === 403) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }

  // Not found errors
  if (status === 404) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Client errors (4xx) - use server message if available
  if (status >= 400 && status < 500) {
    return serverMessage ?? ERROR_MESSAGES.SERVER_ERROR;
  }

  // Fallback for unexpected status codes
  return serverMessage ?? ERROR_MESSAGES.SERVER_ERROR;
}
