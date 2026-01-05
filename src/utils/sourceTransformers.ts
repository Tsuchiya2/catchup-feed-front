/**
 * Source Data Transformation Utilities
 *
 * Functions for transforming source data between different formats
 * (API response, form data, update input).
 */

import type { Source, SourceFormData, UpdateSourceInput } from '@/types/api';

/**
 * Converts a Source from API (snake_case) to SourceFormData for forms (camelCase).
 *
 * Transforms the snake_case `feed_url` property from the backend API response
 * to camelCase `feedURL` for use in frontend forms.
 *
 * @param source - Source entity from API response
 * @returns Form data object with camelCase properties
 *
 * @example
 * ```typescript
 * const source: Source = {
 *   id: 1,
 *   name: 'Tech News',
 *   feed_url: 'https://example.com/feed.xml',
 *   active: true
 * };
 *
 * const formData = sourceToFormData(source);
 * // Result: { name: 'Tech News', feedURL: 'https://example.com/feed.xml' }
 * ```
 */
export function sourceToFormData(source: Source): SourceFormData {
  return {
    name: source.name,
    feedURL: source.feed_url,
  };
}

/**
 * Converts SourceFormData to UpdateSourceInput for API updates.
 *
 * Transforms form data to the format expected by the PUT /sources/:id endpoint.
 * Trims whitespace from input values and adds the active status.
 *
 * @param data - Form data from source edit form
 * @param active - Current active status of the source
 * @returns Update input object ready for API submission
 *
 * @example
 * ```typescript
 * const formData: SourceFormData = {
 *   name: '  Tech News  ',
 *   feedURL: '  https://example.com/feed.xml  '
 * };
 *
 * const updateInput = formDataToUpdateInput(formData, true);
 * // Result: {
 * //   name: 'Tech News',
 * //   feedURL: 'https://example.com/feed.xml',
 * //   active: true
 * // }
 * ```
 */
export function formDataToUpdateInput(data: SourceFormData, active: boolean): UpdateSourceInput {
  return {
    name: data.name.trim(),
    feedURL: data.feedURL.trim(),
    active,
  };
}
