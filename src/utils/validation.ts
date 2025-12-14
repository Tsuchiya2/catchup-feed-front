/**
 * Validation Utilities
 *
 * Reusable validation functions for form fields.
 * Uses a functional composition pattern for combining validators.
 */

/**
 * Validator function type
 * Returns null if valid, error message string if invalid
 */
export type Validator = (value: string) => string | null;

/**
 * Collection of reusable validators
 */
export const validators = {
  /**
   * Validates that a field is not empty
   * @param message - Custom error message
   */
  required:
    (message = 'This field is required'): Validator =>
    (value: string) =>
      !value?.trim() ? message : null,

  /**
   * Validates maximum character length
   * @param max - Maximum allowed characters
   * @param message - Custom error message
   */
  maxLength:
    (max: number, message?: string): Validator =>
    (value: string) =>
      value?.length > max ? message || `Maximum ${max} characters allowed` : null,

  /**
   * Validates minimum character length
   * @param min - Minimum required characters
   * @param message - Custom error message
   */
  minLength:
    (min: number, message?: string): Validator =>
    (value: string) =>
      value?.length < min ? message || `Minimum ${min} characters required` : null,

  /**
   * Validates URL format (must start with http:// or https://)
   * @param message - Custom error message
   */
  urlFormat:
    (message = 'Please enter a valid URL'): Validator =>
    (value: string) =>
      !/^https?:\/\/.+/.test(value) ? message : null,

  /**
   * Validates email format
   * @param message - Custom error message
   */
  emailFormat:
    (message = 'Please enter a valid email address'): Validator =>
    (value: string) =>
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,

  /**
   * Validates using a custom regex pattern
   * @param pattern - Regular expression to match
   * @param message - Custom error message
   */
  pattern:
    (pattern: RegExp, message = 'Invalid format'): Validator =>
    (value: string) =>
      !pattern.test(value) ? message : null,

  /**
   * Compose multiple validators into one
   * Runs validators in order and returns the first error found
   * @param fns - Array of validator functions
   */
  compose:
    (...fns: Validator[]): Validator =>
    (value: string) =>
      fns.reduce<string | null>((err, fn) => err || fn(value), null),
};

/**
 * Validate a single field value
 * @param value - The value to validate
 * @param validator - The validator function to use
 * @returns Error message or null if valid
 */
export function validateField(value: string, validator: Validator): string | null {
  return validator(value);
}

/**
 * Validate multiple fields at once
 * @param fields - Object with field names as keys and {value, validator} as values
 * @returns Object with field names as keys and error messages as values
 */
export function validateFields<T extends Record<string, string>>(fields: {
  [K in keyof T]: { value: string; validator: Validator };
}): { [K in keyof T]?: string } {
  const errors: { [K in keyof T]?: string } = {};

  for (const key of Object.keys(fields) as Array<keyof T>) {
    const { value, validator } = fields[key];
    const error = validator(value);
    if (error) {
      errors[key] = error;
    }
  }

  return errors;
}
