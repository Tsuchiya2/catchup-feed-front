/**
 * Validation Utilities Tests
 */
import { describe, it, expect } from 'vitest';
import { validators, validateField, validateFields } from './validation';

describe('validators', () => {
  describe('required', () => {
    it('returns error message for empty string', () => {
      const validator = validators.required();
      expect(validator('')).toBe('This field is required');
    });

    it('returns error message for whitespace-only string', () => {
      const validator = validators.required();
      expect(validator('   ')).toBe('This field is required');
    });

    it('returns null for non-empty string', () => {
      const validator = validators.required();
      expect(validator('hello')).toBeNull();
    });

    it('uses custom error message when provided', () => {
      const validator = validators.required('Name is required');
      expect(validator('')).toBe('Name is required');
    });
  });

  describe('maxLength', () => {
    it('returns error for string exceeding max length', () => {
      const validator = validators.maxLength(5);
      expect(validator('123456')).toBe('Maximum 5 characters allowed');
    });

    it('returns null for string at max length', () => {
      const validator = validators.maxLength(5);
      expect(validator('12345')).toBeNull();
    });

    it('returns null for string under max length', () => {
      const validator = validators.maxLength(5);
      expect(validator('123')).toBeNull();
    });

    it('uses custom error message when provided', () => {
      const validator = validators.maxLength(10, 'Too long!');
      expect(validator('12345678901')).toBe('Too long!');
    });
  });

  describe('minLength', () => {
    it('returns error for string below min length', () => {
      const validator = validators.minLength(5);
      expect(validator('123')).toBe('Minimum 5 characters required');
    });

    it('returns null for string at min length', () => {
      const validator = validators.minLength(5);
      expect(validator('12345')).toBeNull();
    });

    it('returns null for string above min length', () => {
      const validator = validators.minLength(5);
      expect(validator('123456')).toBeNull();
    });
  });

  describe('urlFormat', () => {
    it('returns error for invalid URL format', () => {
      const validator = validators.urlFormat();
      expect(validator('not-a-url')).toBe('Please enter a valid URL');
    });

    it('returns error for URL without protocol', () => {
      const validator = validators.urlFormat();
      expect(validator('example.com/feed')).toBe('Please enter a valid URL');
    });

    it('returns null for valid HTTP URL', () => {
      const validator = validators.urlFormat();
      expect(validator('http://example.com/feed.xml')).toBeNull();
    });

    it('returns null for valid HTTPS URL', () => {
      const validator = validators.urlFormat();
      expect(validator('https://example.com/feed.xml')).toBeNull();
    });

    it('uses custom error message when provided', () => {
      const validator = validators.urlFormat('Invalid URL');
      expect(validator('bad')).toBe('Invalid URL');
    });
  });

  describe('emailFormat', () => {
    it('returns error for invalid email', () => {
      const validator = validators.emailFormat();
      expect(validator('not-an-email')).toBe('Please enter a valid email address');
    });

    it('returns null for valid email', () => {
      const validator = validators.emailFormat();
      expect(validator('user@example.com')).toBeNull();
    });
  });

  describe('pattern', () => {
    it('returns error when pattern does not match', () => {
      const validator = validators.pattern(/^\d+$/, 'Numbers only');
      expect(validator('abc')).toBe('Numbers only');
    });

    it('returns null when pattern matches', () => {
      const validator = validators.pattern(/^\d+$/);
      expect(validator('123')).toBeNull();
    });
  });

  describe('compose', () => {
    it('returns first error from composed validators', () => {
      const validator = validators.compose(
        validators.required('Required'),
        validators.maxLength(5, 'Too long')
      );
      expect(validator('')).toBe('Required');
    });

    it('returns second error when first passes', () => {
      const validator = validators.compose(
        validators.required('Required'),
        validators.maxLength(5, 'Too long')
      );
      expect(validator('123456')).toBe('Too long');
    });

    it('returns null when all validators pass', () => {
      const validator = validators.compose(validators.required(), validators.maxLength(10));
      expect(validator('hello')).toBeNull();
    });

    it('works with empty validators array', () => {
      const validator = validators.compose();
      expect(validator('anything')).toBeNull();
    });
  });
});

describe('validateField', () => {
  it('returns error message for invalid value', () => {
    const result = validateField('', validators.required('Name required'));
    expect(result).toBe('Name required');
  });

  it('returns null for valid value', () => {
    const result = validateField('hello', validators.required());
    expect(result).toBeNull();
  });
});

describe('validateFields', () => {
  it('returns errors for multiple invalid fields', () => {
    const result = validateFields({
      name: { value: '', validator: validators.required('Name required') },
      url: { value: 'bad', validator: validators.urlFormat('Invalid URL') },
    });
    expect(result).toEqual({
      name: 'Name required',
      url: 'Invalid URL',
    });
  });

  it('returns only errors for invalid fields', () => {
    const result = validateFields({
      name: { value: 'Test', validator: validators.required() },
      url: { value: 'bad', validator: validators.urlFormat() },
    });
    expect(result).toEqual({
      url: 'Please enter a valid URL',
    });
  });

  it('returns empty object when all fields valid', () => {
    const result = validateFields({
      name: { value: 'Test', validator: validators.required() },
      url: { value: 'https://example.com', validator: validators.urlFormat() },
    });
    expect(result).toEqual({});
  });
});
