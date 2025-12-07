/**
 * Article Utilities Tests
 */

import { normalizeSourceName, validateArticle } from './article';
import type { Article } from '@/types/api';

describe('normalizeSourceName', () => {
  it('should return "Unknown Source" for null', () => {
    expect(normalizeSourceName(null)).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for undefined', () => {
    expect(normalizeSourceName(undefined)).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for empty string', () => {
    expect(normalizeSourceName('')).toBe('Unknown Source');
  });

  it('should return "Unknown Source" for whitespace-only string', () => {
    expect(normalizeSourceName('   ')).toBe('Unknown Source');
  });

  it('should trim and return valid source name', () => {
    expect(normalizeSourceName('  Tech News  ')).toBe('Tech News');
  });

  it('should return trimmed source name for valid input', () => {
    expect(normalizeSourceName('BBC News')).toBe('BBC News');
  });
});

describe('validateArticle', () => {
  const validArticle: Article = {
    id: 1,
    source_id: 1,
    source_name: 'BBC News',
    title: 'Test Article',
    url: 'https://example.com',
    summary: 'This is a test',
    published_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  };

  it('should return true for valid article', () => {
    expect(validateArticle(validArticle)).toBe(true);
  });

  it('should return false for null', () => {
    expect(validateArticle(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(validateArticle(undefined)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(validateArticle('not an object')).toBe(false);
    expect(validateArticle(123)).toBe(false);
  });

  it('should return false for object missing required fields', () => {
    const invalidArticle = {
      id: 1,
      title: 'Test',
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when id is not a number', () => {
    const invalidArticle = {
      ...validArticle,
      id: '1',
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when title is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      title: 123,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when url is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      url: null,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when summary is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      summary: undefined,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when source_name is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      source_name: 123,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when published_at is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      published_at: null,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });

  it('should return false when created_at is not a string', () => {
    const invalidArticle = {
      ...validArticle,
      created_at: null,
    };
    expect(validateArticle(invalidArticle)).toBe(false);
  });
});
