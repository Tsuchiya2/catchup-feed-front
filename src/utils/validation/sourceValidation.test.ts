import { describe, it, expect } from 'vitest';
import {
  validateSourceName,
  validateSourceFeedURL,
  validateSourceForm,
  hasValidationErrors,
  type SourceFormData,
  type SourceFormErrors,
} from './sourceValidation';
import { ERROR_MESSAGES } from '@/utils/errorMessages';
import { SOURCE_CONFIG } from '@/config/sourceConfig';

describe('validateSourceName', () => {
  describe('Valid Names', () => {
    it('should return undefined for valid name', () => {
      const result = validateSourceName('My Feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for name with exactly 255 characters', () => {
      const maxLengthName = 'a'.repeat(SOURCE_CONFIG.NAME_MAX_LENGTH);
      const result = validateSourceName(maxLengthName);
      expect(result).toBeUndefined();
    });

    it('should return undefined for name with special characters', () => {
      const result = validateSourceName('Tech News 2024 - #1 Source!');
      expect(result).toBeUndefined();
    });

    it('should return undefined for name with Unicode characters', () => {
      const result = validateSourceName('技術ニュース 📰');
      expect(result).toBeUndefined();
    });

    it('should return undefined for name with leading/trailing spaces (trimmed)', () => {
      const result = validateSourceName('  Valid Name  ');
      expect(result).toBeUndefined();
    });
  });

  describe('Invalid Names - Empty/Whitespace', () => {
    it('should return error for empty string', () => {
      const result = validateSourceName('');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });

    it('should return error for whitespace only (single space)', () => {
      const result = validateSourceName(' ');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });

    it('should return error for whitespace only (multiple spaces)', () => {
      const result = validateSourceName('     ');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });

    it('should return error for whitespace only (tabs)', () => {
      const result = validateSourceName('\t\t\t');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });

    it('should return error for whitespace only (newlines)', () => {
      const result = validateSourceName('\n\n');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });

    it('should return error for whitespace only (mixed)', () => {
      const result = validateSourceName(' \t\n ');
      expect(result).toBe(ERROR_MESSAGES.NAME_REQUIRED);
    });
  });

  describe('Invalid Names - Maximum Length', () => {
    it('should return error for name with 256 characters (over max)', () => {
      const overMaxLengthName = 'a'.repeat(SOURCE_CONFIG.NAME_MAX_LENGTH + 1);
      const result = validateSourceName(overMaxLengthName);
      expect(result).toBe(ERROR_MESSAGES.NAME_MAX_LENGTH);
    });

    it('should return error for name with 300 characters', () => {
      const longName = 'a'.repeat(300);
      const result = validateSourceName(longName);
      expect(result).toBe(ERROR_MESSAGES.NAME_MAX_LENGTH);
    });

    it('should return error for name with 1000 characters', () => {
      const veryLongName = 'a'.repeat(1000);
      const result = validateSourceName(veryLongName);
      expect(result).toBe(ERROR_MESSAGES.NAME_MAX_LENGTH);
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined for single character name', () => {
      const result = validateSourceName('A');
      expect(result).toBeUndefined();
    });

    it('should return undefined for name with numbers only', () => {
      const result = validateSourceName('12345');
      expect(result).toBeUndefined();
    });
  });
});

describe('validateSourceFeedURL', () => {
  describe('Valid URLs', () => {
    it('should return undefined for valid http URL', () => {
      const result = validateSourceFeedURL('http://example.com/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for valid https URL', () => {
      const result = validateSourceFeedURL('https://example.com/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with exactly 2048 characters', () => {
      // Create a URL with exactly 2048 characters
      const baseURL = 'https://example.com/feed?query=';
      const padding = 'a'.repeat(SOURCE_CONFIG.URL_MAX_LENGTH - baseURL.length);
      const maxLengthURL = baseURL + padding;
      const result = validateSourceFeedURL(maxLengthURL);
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with query parameters', () => {
      const result = validateSourceFeedURL('https://example.com/feed?format=rss&limit=10');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with fragment', () => {
      const result = validateSourceFeedURL('https://example.com/feed#section');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with port number', () => {
      const result = validateSourceFeedURL('https://example.com:8080/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with subdomain', () => {
      const result = validateSourceFeedURL('https://blog.example.com/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with path segments', () => {
      const result = validateSourceFeedURL('https://example.com/blog/rss/feed.xml');
      expect(result).toBeUndefined();
    });

    it('should return undefined for URL with authentication (username:password)', () => {
      const result = validateSourceFeedURL('https://user:pass@example.com/feed');
      expect(result).toBeUndefined();
    });
  });

  describe('Invalid URLs - Empty/Whitespace', () => {
    it('should return error for empty string', () => {
      const result = validateSourceFeedURL('');
      expect(result).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });

    it('should return error for whitespace only (single space)', () => {
      const result = validateSourceFeedURL(' ');
      expect(result).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });

    it('should return error for whitespace only (multiple spaces)', () => {
      const result = validateSourceFeedURL('     ');
      expect(result).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });

    it('should return error for whitespace only (tabs)', () => {
      const result = validateSourceFeedURL('\t\t\t');
      expect(result).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });

    it('should return error for whitespace only (newlines)', () => {
      const result = validateSourceFeedURL('\n\n');
      expect(result).toBe(ERROR_MESSAGES.URL_REQUIRED);
    });
  });

  describe('Invalid URLs - Format', () => {
    it('should return error for invalid URL format (no protocol)', () => {
      const result = validateSourceFeedURL('example.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for invalid URL format (random text)', () => {
      const result = validateSourceFeedURL('not-a-url');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for invalid URL format (spaces)', () => {
      const result = validateSourceFeedURL('http://example .com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for malformed URL (missing colon in protocol)', () => {
      const result = validateSourceFeedURL('https//example.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for malformed URL (invalid characters)', () => {
      const result = validateSourceFeedURL('https://exa<mple>.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });
  });

  describe('Invalid URLs - Protocol', () => {
    it('should return error for ftp protocol', () => {
      const result = validateSourceFeedURL('ftp://example.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for file protocol', () => {
      const result = validateSourceFeedURL('file:///path/to/feed.xml');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for mailto protocol', () => {
      const result = validateSourceFeedURL('mailto:user@example.com');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for custom protocol', () => {
      const result = validateSourceFeedURL('custom://example.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });

    it('should return error for protocol-relative URL', () => {
      const result = validateSourceFeedURL('//example.com/feed');
      expect(result).toBe(ERROR_MESSAGES.URL_INVALID);
    });
  });

  describe('Invalid URLs - Maximum Length', () => {
    it('should return error for URL with over 2048 characters', () => {
      const baseURL = 'https://example.com/feed?query=';
      const padding = 'a'.repeat(SOURCE_CONFIG.URL_MAX_LENGTH - baseURL.length + 1);
      const overMaxLengthURL = baseURL + padding;
      const result = validateSourceFeedURL(overMaxLengthURL);
      expect(result).toBe(ERROR_MESSAGES.URL_MAX_LENGTH);
    });

    it('should return error for URL with 3000 characters', () => {
      const baseURL = 'https://example.com/feed?query=';
      const padding = 'a'.repeat(3000 - baseURL.length);
      const longURL = baseURL + padding;
      const result = validateSourceFeedURL(longURL);
      expect(result).toBe(ERROR_MESSAGES.URL_MAX_LENGTH);
    });

    it('should return error for extremely long URL (5000 characters)', () => {
      const baseURL = 'https://example.com/feed?query=';
      const padding = 'a'.repeat(5000 - baseURL.length);
      const veryLongURL = baseURL + padding;
      const result = validateSourceFeedURL(veryLongURL);
      expect(result).toBe(ERROR_MESSAGES.URL_MAX_LENGTH);
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined for URL with internationalized domain name (IDN)', () => {
      const result = validateSourceFeedURL('https://例え.jp/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for localhost URL', () => {
      const result = validateSourceFeedURL('http://localhost/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for IP address URL', () => {
      const result = validateSourceFeedURL('http://192.168.1.1/feed');
      expect(result).toBeUndefined();
    });

    it('should return undefined for IPv6 URL', () => {
      const result = validateSourceFeedURL('http://[::1]/feed');
      expect(result).toBeUndefined();
    });
  });
});

describe('validateSourceForm', () => {
  describe('Valid Form Data', () => {
    it('should return empty errors object for valid data', () => {
      const data: SourceFormData = {
        name: 'Tech News',
        feedURL: 'https://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({});
    });

    it('should return empty errors object for valid data with max lengths', () => {
      const data: SourceFormData = {
        name: 'a'.repeat(SOURCE_CONFIG.NAME_MAX_LENGTH),
        feedURL: 'https://example.com/feed?query=' + 'a'.repeat(2000),
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({});
    });

    it('should return empty errors object for valid data with special characters', () => {
      const data: SourceFormData = {
        name: 'Tech News 2024 - #1 Source!',
        feedURL: 'https://example.com/feed?format=rss&limit=10',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({});
    });
  });

  describe('Invalid Form Data - Single Field', () => {
    it('should return name error for empty name', () => {
      const data: SourceFormData = {
        name: '',
        feedURL: 'https://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
      });
    });

    it('should return name error for whitespace-only name', () => {
      const data: SourceFormData = {
        name: '   ',
        feedURL: 'https://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
      });
    });

    it('should return name error for name exceeding max length', () => {
      const data: SourceFormData = {
        name: 'a'.repeat(SOURCE_CONFIG.NAME_MAX_LENGTH + 1),
        feedURL: 'https://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_MAX_LENGTH,
      });
    });

    it('should return URL error for empty URL', () => {
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: '',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      });
    });

    it('should return URL error for whitespace-only URL', () => {
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: '   ',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      });
    });

    it('should return URL error for invalid URL format', () => {
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: 'not-a-url',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        feedURL: ERROR_MESSAGES.URL_INVALID,
      });
    });

    it('should return URL error for non-http(s) protocol', () => {
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: 'ftp://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        feedURL: ERROR_MESSAGES.URL_INVALID,
      });
    });

    it('should return URL error for URL exceeding max length', () => {
      const baseURL = 'https://example.com/feed?query=';
      const padding = 'a'.repeat(SOURCE_CONFIG.URL_MAX_LENGTH - baseURL.length + 1);
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: baseURL + padding,
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        feedURL: ERROR_MESSAGES.URL_MAX_LENGTH,
      });
    });
  });

  describe('Invalid Form Data - Multiple Fields', () => {
    it('should return both errors for both invalid fields (empty)', () => {
      const data: SourceFormData = {
        name: '',
        feedURL: '',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      });
    });

    it('should return both errors for both invalid fields (whitespace)', () => {
      const data: SourceFormData = {
        name: '   ',
        feedURL: '   ',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      });
    });

    it('should return both errors for both invalid fields (different validation rules)', () => {
      const data: SourceFormData = {
        name: 'a'.repeat(SOURCE_CONFIG.NAME_MAX_LENGTH + 1),
        feedURL: 'not-a-url',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_MAX_LENGTH,
        feedURL: ERROR_MESSAGES.URL_INVALID,
      });
    });

    it('should return both errors for name empty and URL invalid', () => {
      const data: SourceFormData = {
        name: '',
        feedURL: 'ftp://example.com/feed',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
        feedURL: ERROR_MESSAGES.URL_INVALID,
      });
    });

    it('should return both errors for name too long and URL empty', () => {
      const data: SourceFormData = {
        name: 'a'.repeat(300),
        feedURL: '',
      };
      const result = validateSourceForm(data);
      expect(result).toEqual({
        name: ERROR_MESSAGES.NAME_MAX_LENGTH,
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should validate fields independently', () => {
      // Valid name with invalid URL
      const data1: SourceFormData = {
        name: 'Valid Name',
        feedURL: 'invalid',
      };
      expect(validateSourceForm(data1)).toEqual({
        feedURL: ERROR_MESSAGES.URL_INVALID,
      });

      // Invalid name with valid URL
      const data2: SourceFormData = {
        name: '',
        feedURL: 'https://example.com/feed',
      };
      expect(validateSourceForm(data2)).toEqual({
        name: ERROR_MESSAGES.NAME_REQUIRED,
      });
    });
  });
});

describe('hasValidationErrors', () => {
  describe('No Errors', () => {
    it('should return false for empty errors object', () => {
      const errors: SourceFormErrors = {};
      const result = hasValidationErrors(errors);
      expect(result).toBe(false);
    });

    it('should return false for errors object with all undefined values', () => {
      const errors: SourceFormErrors = {
        name: undefined,
        feedURL: undefined,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(false);
    });
  });

  describe('With Errors', () => {
    it('should return true for one error (name)', () => {
      const errors: SourceFormErrors = {
        name: ERROR_MESSAGES.NAME_REQUIRED,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });

    it('should return true for one error (feedURL)', () => {
      const errors: SourceFormErrors = {
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });

    it('should return true for multiple errors', () => {
      const errors: SourceFormErrors = {
        name: ERROR_MESSAGES.NAME_REQUIRED,
        feedURL: ERROR_MESSAGES.URL_REQUIRED,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });

    it('should return true when only one field has error (mixed with undefined)', () => {
      const errors: SourceFormErrors = {
        name: ERROR_MESSAGES.NAME_REQUIRED,
        feedURL: undefined,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });

    it('should return true for different error messages', () => {
      const errors: SourceFormErrors = {
        name: ERROR_MESSAGES.NAME_MAX_LENGTH,
        feedURL: ERROR_MESSAGES.URL_INVALID,
      };
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors object created from validateSourceForm (valid data)', () => {
      const data: SourceFormData = {
        name: 'Valid Name',
        feedURL: 'https://example.com/feed',
      };
      const errors = validateSourceForm(data);
      const result = hasValidationErrors(errors);
      expect(result).toBe(false);
    });

    it('should handle errors object created from validateSourceForm (invalid data)', () => {
      const data: SourceFormData = {
        name: '',
        feedURL: '',
      };
      const errors = validateSourceForm(data);
      const result = hasValidationErrors(errors);
      expect(result).toBe(true);
    });
  });
});
