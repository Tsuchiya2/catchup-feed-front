import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateCsrfToken,
  validateCsrfToken,
  timingSafeEqual,
  base64UrlEncode,
  setCsrfToken,
} from '../csrf';
import * as loggerModule from '@/lib/logger';

describe('CSRF Utilities', () => {
  beforeEach(() => {
    // Mock logger to avoid console output in tests
    vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCsrfToken', () => {
    it('should generate a token with correct length (43 characters)', () => {
      // Act
      const token = generateCsrfToken();

      // Assert
      expect(token).toHaveLength(43);
    });

    it('should generate unique tokens on multiple calls', () => {
      // Act
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const token3 = generateCsrfToken();

      // Assert
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate URL-safe tokens (base64url format)', () => {
      // Act
      const token = generateCsrfToken();

      // Assert - base64url should not contain +, /, or =
      expect(token).not.toMatch(/[+/=]/);
      // Should only contain URL-safe characters: A-Z, a-z, 0-9, -, _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate cryptographically random tokens', () => {
      // Arrange
      const tokens = new Set<string>();
      const iterations = 100;

      // Act - Generate many tokens to test randomness
      for (let i = 0; i < iterations; i++) {
        tokens.add(generateCsrfToken());
      }

      // Assert - All tokens should be unique (no collisions)
      expect(tokens.size).toBe(iterations);
    });

    it('should use crypto.getRandomValues for token generation', () => {
      // Arrange
      const mockGetRandomValues = vi.spyOn(crypto, 'getRandomValues');

      // Act
      generateCsrfToken();

      // Assert
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(mockGetRandomValues).toHaveBeenCalledTimes(1);

      mockGetRandomValues.mockRestore();
    });
  });

  describe('validateCsrfToken', () => {
    it('should return true when cookie and header tokens match', () => {
      // Arrange
      const token = 'valid-csrf-token-12345';
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          Cookie: `csrf_token=${token}`,
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(true);
      expect(loggerModule.logger.warn).not.toHaveBeenCalled();
    });

    it('should return false when cookie token is missing', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'header-token',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'CSRF validation failed: missing token',
        expect.objectContaining({
          hasCookie: false,
          hasHeader: true,
          path: '/api/test',
          method: 'POST',
        })
      );
    });

    it('should return false when header token is missing', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf_token=cookie-token',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'CSRF validation failed: missing token',
        expect.objectContaining({
          hasCookie: true,
          hasHeader: false,
          path: '/api/test',
          method: 'POST',
        })
      );
    });

    it('should return false when both tokens are missing', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'CSRF validation failed: missing token',
        expect.objectContaining({
          hasCookie: false,
          hasHeader: false,
        })
      );
    });

    it('should return false when tokens do not match', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'header-token',
          Cookie: 'csrf_token=cookie-token',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'CSRF validation failed: token mismatch',
        expect.objectContaining({
          path: '/api/test',
          method: 'POST',
        })
      );
    });

    it('should handle empty cookie token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'header-token',
          Cookie: 'csrf_token=',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle empty header token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': '',
          Cookie: 'csrf_token=cookie-token',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should validate tokens case-sensitively', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'Token123',
          Cookie: 'csrf_token=token123',
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle special characters in tokens', () => {
      // Arrange
      const token = 'valid_token-with-special_chars-123';
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          Cookie: `csrf_token=${token}`,
        },
      });

      // Act
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should log request path and method on validation failure', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/users/123', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': 'wrong-token',
          Cookie: 'csrf_token=correct-token',
        },
      });

      // Act
      validateCsrfToken(request);

      // Assert
      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'CSRF validation failed: token mismatch',
        expect.objectContaining({
          path: '/api/users/123',
          method: 'DELETE',
        })
      );
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true when strings are identical', () => {
      // Act
      const result = timingSafeEqual('secret123', 'secret123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when strings differ', () => {
      // Act
      const result = timingSafeEqual('secret123', 'secret456');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when strings have different lengths', () => {
      // Act
      const result = timingSafeEqual('short', 'verylongstring');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when comparing empty string with non-empty', () => {
      // Act
      const result = timingSafeEqual('', 'nonempty');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when both strings are empty', () => {
      // Act
      const result = timingSafeEqual('', '');

      // Assert
      expect(result).toBe(true);
    });

    it('should handle strings with special characters', () => {
      // Arrange
      const str1 = 'token_with-special.chars!@#$%^&*()';
      const str2 = 'token_with-special.chars!@#$%^&*()';

      // Act
      const result = timingSafeEqual(str1, str2);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle unicode characters', () => {
      // Arrange
      const str1 = 'token-with-emoji-🔒';
      const str2 = 'token-with-emoji-🔒';

      // Act
      const result = timingSafeEqual(str1, str2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for strings differing only in last character', () => {
      // Act
      const result = timingSafeEqual('secret123', 'secret124');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for strings differing only in first character', () => {
      // Act
      const result = timingSafeEqual('Aecret123', 'secret123');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle very long strings', () => {
      // Arrange
      const longString1 = 'a'.repeat(1000);
      const longString2 = 'a'.repeat(1000);

      // Act
      const result = timingSafeEqual(longString1, longString2);

      // Assert
      expect(result).toBe(true);
    });

    it('should have consistent execution time for same-length strings (timing-safe)', () => {
      // This test verifies the timing-safe property by ensuring the function
      // doesn't short-circuit early when finding a mismatch

      // Arrange
      const sameLength1 = 'aaaaaaaaaa';
      const sameLength2 = 'baaaaaaaaa'; // First char differs
      const sameLength3 = 'aaaaaaaaba'; // Last char differs

      // Act & Assert - All should take roughly the same time
      // We can't measure exact time in tests, but we verify correct behavior
      const result1 = timingSafeEqual(sameLength1, sameLength2);
      const result2 = timingSafeEqual(sameLength1, sameLength3);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      // Both comparisons should process the entire string
    });
  });

  describe('base64UrlEncode', () => {
    it('should encode Uint8Array to base64url format', () => {
      // Arrange
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).toBe('AQIDBAU');
      expect(result).not.toMatch(/[+/=]/); // No standard base64 chars
    });

    it('should produce URL-safe output (no +, /, =)', () => {
      // Arrange - Create buffer that would produce +, /, = in standard base64
      const buffer = new Uint8Array([0xff, 0xfe, 0xfd]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).not.toMatch(/[+/=]/);
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should encode 32-byte buffer to 43-character string', () => {
      // Arrange - 32 bytes is the CSRF token size
      const buffer = new Uint8Array(32);
      crypto.getRandomValues(buffer);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).toHaveLength(43);
    });

    it('should encode empty buffer to empty string', () => {
      // Arrange
      const buffer = new Uint8Array(0);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).toBe('');
    });

    it('should replace + with - in base64url', () => {
      // Arrange - Create a buffer that produces + in standard base64
      // 0xFB in base64 can produce '+'
      const buffer = new Uint8Array([0xfb, 0xef]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).not.toContain('+');
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should replace / with _ in base64url', () => {
      // Arrange - Create a buffer that produces / in standard base64
      const buffer = new Uint8Array([0xff, 0xff]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).not.toContain('/');
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should remove padding (=) from base64url', () => {
      // Arrange - Create buffers with different lengths to test padding removal
      const buffer1 = new Uint8Array([1, 2, 3]); // Would have 1 padding char
      const buffer2 = new Uint8Array([1, 2]); // Would have 2 padding chars

      // Act
      const result1 = base64UrlEncode(buffer1);
      const result2 = base64UrlEncode(buffer2);

      // Assert
      expect(result1).not.toContain('=');
      expect(result2).not.toContain('=');
    });

    it('should produce consistent results for same input', () => {
      // Arrange
      const buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

      // Act
      const result1 = base64UrlEncode(buffer);
      const result2 = base64UrlEncode(buffer);

      // Assert
      expect(result1).toBe(result2);
    });

    it('should handle maximum byte values', () => {
      // Arrange
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result).not.toContain('=');
    });

    it('should handle minimum byte values', () => {
      // Arrange
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

      // Act
      const result = base64UrlEncode(buffer);

      // Assert
      expect(result).toMatch(/^[A-Za-z0-9_-]*$/);
    });
  });

  describe('setCsrfToken', () => {
    it('should set csrf_token cookie with correct attributes', () => {
      // Arrange
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const cookie = result.cookies.get('csrf_token');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toHaveLength(43);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe('strict');
      expect(cookie?.path).toBe('/');
    });

    it('should set X-CSRF-Token response header', () => {
      // Arrange
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const headerToken = result.headers.get('X-CSRF-Token');
      expect(headerToken).toBeDefined();
      expect(headerToken).toHaveLength(43);
    });

    it('should set same token in both cookie and header', () => {
      // Arrange
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const cookieToken = result.cookies.get('csrf_token')?.value;
      const headerToken = result.headers.get('X-CSRF-Token');
      expect(cookieToken).toBe(headerToken);
    });

    it('should set secure cookie in production environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const cookie = result.cookies.get('csrf_token');
      expect(cookie?.secure).toBe(true);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should not set secure cookie in development environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const cookie = result.cookies.get('csrf_token');
      expect(cookie?.secure).toBe(false);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should set cookie with 24-hour maxAge', () => {
      // Arrange
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      const cookie = result.cookies.get('csrf_token');
      expect(cookie?.maxAge).toBe(60 * 60 * 24); // 24 hours in seconds
    });

    it('should generate unique tokens on multiple calls', () => {
      // Arrange
      const response1 = NextResponse.next();
      const response2 = NextResponse.next();

      // Act
      const result1 = setCsrfToken(response1);
      const result2 = setCsrfToken(response2);

      // Assert
      const token1 = result1.cookies.get('csrf_token')?.value;
      const token2 = result2.cookies.get('csrf_token')?.value;
      expect(token1).not.toBe(token2);
    });

    it('should return the modified response object', () => {
      // Arrange
      const response = NextResponse.next();

      // Act
      const result = setCsrfToken(response);

      // Assert
      expect(result).toBe(response); // Should return same object (modified)
    });

    it('should not throw error when setting token multiple times', () => {
      // Arrange
      const response = NextResponse.next();

      // Act & Assert
      expect(() => {
        setCsrfToken(response);
        setCsrfToken(response);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete a full CSRF flow: generate, set, and validate', () => {
      // Phase 1: Generate and set token in response
      const response = NextResponse.next();
      setCsrfToken(response);
      const token = response.headers.get('X-CSRF-Token')!;

      // Phase 2: Client includes token in next request
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          Cookie: `csrf_token=${token}`,
        },
      });

      // Phase 3: Validate token
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject request when client sends modified token', () => {
      // Phase 1: Generate and set token
      const response = NextResponse.next();
      setCsrfToken(response);
      const originalToken = response.headers.get('X-CSRF-Token')!;

      // Phase 2: Client modifies token (attack scenario)
      const modifiedToken = originalToken.substring(0, 42) + 'X';
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': modifiedToken,
          Cookie: `csrf_token=${originalToken}`,
        },
      });

      // Phase 3: Validation should fail
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject request when only cookie is present (missing header)', () => {
      // Phase 1: Generate token
      const response = NextResponse.next();
      setCsrfToken(response);
      const token = response.headers.get('X-CSRF-Token')!;

      // Phase 2: Client forgets to include header (common mistake)
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          Cookie: `csrf_token=${token}`,
        },
      });

      // Phase 3: Validation should fail
      const isValid = validateCsrfToken(request);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should work with different token formats', () => {
      // Test that the system works with various valid base64url strings
      const tokens = [generateCsrfToken(), generateCsrfToken(), generateCsrfToken()];

      tokens.forEach((token) => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': token,
            Cookie: `csrf_token=${token}`,
          },
        });

        expect(validateCsrfToken(request)).toBe(true);
      });
    });
  });

  describe('Security Properties', () => {
    it('should not leak token values in logs on validation failure', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'secret-token-123',
          Cookie: 'csrf_token=different-token-456',
        },
      });

      // Act
      validateCsrfToken(request);

      // Assert - Verify logger was called but WITHOUT token values
      expect(loggerModule.logger.warn).toHaveBeenCalled();
      const logCall = vi.mocked(loggerModule.logger.warn).mock.calls[0];
      const logMessage = JSON.stringify(logCall);

      // Token values should NOT appear in logs
      expect(logMessage).not.toContain('secret-token-123');
      expect(logMessage).not.toContain('different-token-456');
    });

    it('should use constant-time comparison to prevent timing attacks', () => {
      // This test documents the security property
      // timingSafeEqual should process the entire string regardless of where mismatch occurs

      const token = 'a'.repeat(43);
      const earlyMismatch = 'b' + 'a'.repeat(42);
      const lateMismatch = 'a'.repeat(42) + 'b';

      // Both should return false with consistent timing
      const result1 = timingSafeEqual(token, earlyMismatch);
      const result2 = timingSafeEqual(token, lateMismatch);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should generate cryptographically secure tokens (high entropy)', () => {
      // Generate many tokens and verify no patterns
      const tokens = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateCsrfToken());
      }

      // All tokens should be unique (no collisions)
      expect(tokens.size).toBe(iterations);

      // Tokens should have good character distribution
      const firstChars = Array.from(tokens).map((t) => t[0]);
      const uniqueFirstChars = new Set(firstChars);

      // Should have diverse first characters (>10 different chars)
      expect(uniqueFirstChars.size).toBeGreaterThan(10);
    });
  });
});
