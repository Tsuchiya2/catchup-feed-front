/**
 * Source-related constants for validation and testing
 */

/**
 * Validation limits for source fields
 */
export const SOURCE_LIMITS = {
  /** Maximum length for source name */
  NAME_MAX_LENGTH: 255,
  /** Maximum length for source URL */
  URL_MAX_LENGTH: 2048,
} as const;

/**
 * Test IDs for source-related components
 * Used for automated testing and accessibility
 */
export const SOURCE_TEST_IDS = {
  /** Source card container */
  CARD: 'source-card',
  /** Edit button for source */
  EDIT_BUTTON: 'source-edit-button',
  /** Edit dialog container */
  EDIT_DIALOG: 'source-edit-dialog',
  /** Name input field */
  NAME_INPUT: 'source-name-input',
  /** URL input field */
  URL_INPUT: 'source-url-input',
  /** Save button */
  SAVE_BUTTON: 'source-save-button',
  /** Cancel button */
  CANCEL_BUTTON: 'source-cancel-button',
} as const;

/**
 * ARIA labels for source-related components
 * Provides accessible labels for screen readers
 */
export const SOURCE_ARIA_LABELS = {
  /** Generate ARIA label for edit button */
  EDIT_BUTTON: (name: string) => `Edit source: ${name}`,
  /** ARIA label for name input */
  NAME_INPUT: 'Source name',
  /** ARIA label for URL input */
  URL_INPUT: 'Feed URL',
  /** ARIA label for save button */
  SAVE_BUTTON: 'Save changes',
  /** ARIA label for cancel button */
  CANCEL_BUTTON: 'Cancel editing',
} as const;
