/**
 * Source Validation Utilities
 *
 * Provides validation functions for RSS/Feed source form data.
 * Ensures data integrity and provides user-friendly error messages.
 *
 * @module utils/validation/sourceValidation
 */

import { SOURCE_CONFIG } from '@/config/sourceConfig';
import { ERROR_MESSAGES } from '@/utils/errorMessages';

/**
 * Source form data interface
 * Represents the data structure for source creation/editing forms
 */
export interface SourceFormData {
  /** Display name for the source */
  name: string;
  /** RSS/Atom feed URL */
  feedURL: string;
}

/**
 * Source form validation errors
 * Maps form fields to their respective error messages
 */
export interface SourceFormErrors {
  /** Error message for name field, undefined if valid */
  name?: string;
  /** Error message for feedURL field, undefined if valid */
  feedURL?: string;
}

/**
 * Validates source name field
 *
 * Validation rules:
 * - Must not be empty (after trimming whitespace)
 * - Must not exceed maximum length defined in SOURCE_CONFIG
 *
 * @param name - The source name to validate
 * @returns Error message if invalid, undefined if valid
 *
 * @example
 * ```typescript
 * validateSourceName('My Feed')     // undefined (valid)
 * validateSourceName('')            // "Name is required"
 * validateSourceName('   ')         // "Name is required"
 * validateSourceName('a'.repeat(300)) // "Maximum 255 characters allowed"
 * ```
 */
export function validateSourceName(name: string): string | undefined {
  // Check for empty or whitespace-only strings
  if (!name || name.trim().length === 0) {
    return ERROR_MESSAGES.NAME_REQUIRED;
  }

  // Check maximum length
  if (name.length > SOURCE_CONFIG.NAME_MAX_LENGTH) {
    return ERROR_MESSAGES.NAME_MAX_LENGTH;
  }

  return undefined;
}

/**
 * Validates source feed URL field
 *
 * Validation rules:
 * - Must not be empty (after trimming whitespace)
 * - Must be a valid URL format
 * - Must use http or https protocol
 * - Must not exceed maximum length defined in SOURCE_CONFIG
 *
 * @param feedURL - The feed URL to validate
 * @returns Error message if invalid, undefined if valid
 *
 * @example
 * ```typescript
 * validateSourceFeedURL('https://example.com/feed')  // undefined (valid)
 * validateSourceFeedURL('http://example.com/rss')    // undefined (valid)
 * validateSourceFeedURL('')                          // "Feed URL is required"
 * validateSourceFeedURL('ftp://example.com')         // "Please enter a valid URL"
 * validateSourceFeedURL('not-a-url')                 // "Please enter a valid URL"
 * validateSourceFeedURL('https://' + 'a'.repeat(3000)) // "Maximum 2048 characters allowed"
 * ```
 */
export function validateSourceFeedURL(feedURL: string): string | undefined {
  // Check for empty or whitespace-only strings
  if (!feedURL || feedURL.trim().length === 0) {
    return ERROR_MESSAGES.URL_REQUIRED;
  }

  // Check maximum length before URL parsing to avoid performance issues
  if (feedURL.length > SOURCE_CONFIG.URL_MAX_LENGTH) {
    return ERROR_MESSAGES.URL_MAX_LENGTH;
  }

  // Validate URL format and protocol
  try {
    const url = new URL(feedURL);

    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ERROR_MESSAGES.URL_INVALID;
    }
  } catch {
    // URL constructor throws if the URL is malformed
    return ERROR_MESSAGES.URL_INVALID;
  }

  return undefined;
}

/**
 * Validates entire source form data
 *
 * Runs all field validations and collects errors.
 * Returns an object with error messages for invalid fields.
 *
 * @param data - The source form data to validate
 * @returns Object containing field-specific error messages (empty object if all valid)
 *
 * @example
 * ```typescript
 * // Valid data
 * validateSourceForm({
 *   name: 'Tech News',
 *   feedURL: 'https://example.com/feed'
 * })
 * // Returns: {}
 *
 * // Invalid data
 * validateSourceForm({
 *   name: '',
 *   feedURL: 'not-a-url'
 * })
 * // Returns: {
 * //   name: "Name is required",
 * //   feedURL: "Please enter a valid URL"
 * // }
 *
 * // Partially valid data
 * validateSourceForm({
 *   name: 'Valid Name',
 *   feedURL: ''
 * })
 * // Returns: {
 * //   feedURL: "Feed URL is required"
 * // }
 * ```
 */
export function validateSourceForm(data: SourceFormData): SourceFormErrors {
  const errors: SourceFormErrors = {};

  // Validate name field
  const nameError = validateSourceName(data.name);
  if (nameError) {
    errors.name = nameError;
  }

  // Validate feedURL field
  const feedURLError = validateSourceFeedURL(data.feedURL);
  if (feedURLError) {
    errors.feedURL = feedURLError;
  }

  return errors;
}

/**
 * Checks if validation errors object contains any errors
 *
 * Utility function to determine if form validation has failed.
 * Returns true if any field has an error message.
 *
 * @param errors - The validation errors object to check
 * @returns True if errors exist, false if all fields are valid
 *
 * @example
 * ```typescript
 * hasValidationErrors({})                           // false
 * hasValidationErrors({ name: 'Error' })            // true
 * hasValidationErrors({ name: undefined })          // false
 * hasValidationErrors({ name: 'Error', feedURL: 'Error' }) // true
 * ```
 */
export function hasValidationErrors(errors: SourceFormErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}
