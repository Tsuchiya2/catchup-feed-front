/**
 * Middleware Integration Tests for CSRF Protection
 *
 * Tests CSRF token validation logic in Next.js middleware, covering:
 * - State-changing methods (POST, PUT, PATCH, DELETE) require valid CSRF token
 * - Safe methods (GET, HEAD, OPTIONS) do not require CSRF token
 * - Exempt routes skip CSRF validation
 * - CSRF token setting for authenticated users and login page
 * - Error handling and response format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import * as csrfUtils from '@/lib/security/csrf';

// Mock the CSRF utilities
vi.mock('@/lib/security/csrf', () => ({
  validateCsrfToken: vi.fn(),
  setCsrfToken: vi.fn((response: NextResponse) => response),
}));

// Mock jose library
vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose');
  return {
    ...actual,
    decodeJwt: vi.fn(),
  };
});

describe('Middleware - CSRF Protection Integration Tests', () => {
  const mockValidToken = 'valid-jwt-token';
  const mockCsrfToken = 'test-csrf-token-1234567890abcdef';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET Requests - Should allow without CSRF token', () => {
    it('should allow GET request to public route without CSRF token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/', {
        method: 'GET',
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should allow GET request to protected route with valid auth token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      // Mock valid JWT token
      request.cookies.set('catchup_feed_auth_token', mockValidToken);
      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(csrfUtils.setCsrfToken).toHaveBeenCalled(); // Token should be set for authenticated users
      expect(response).toBeDefined();
    });

    it('should allow GET request to API route without CSRF token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'GET',
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });
  });

  describe('POST Requests - Should require CSRF token', () => {
    it('should reject POST request without CSRF token (403)', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Mock CSRF validation to fail (no token)
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);

      // Check error message format
      const jsonResponse = await response.json();
      expect(jsonResponse).toEqual({
        error: 'CSRF token validation failed',
        message:
          'Your request could not be verified. Please refresh the page and try again.',
      });
    });

    it('should allow POST request with valid CSRF token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Set CSRF token in cookie and header
      request.cookies.set('csrf_token', mockCsrfToken);
      request.headers.set('X-CSRF-Token', mockCsrfToken);

      // Mock valid authentication token
      request.cookies.set('catchup_feed_auth_token', mockValidToken);
      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response).toBeDefined();
      expect(response.status).not.toBe(403);
    });

    it('should reject POST request with token mismatch (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Set mismatched tokens
      request.cookies.set('csrf_token', 'token-in-cookie');
      request.headers.set('X-CSRF-Token', 'different-token-in-header');

      // Mock CSRF validation to fail (mismatch)
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should reject POST request with missing cookie token (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Only set header token (missing cookie)
      request.headers.set('X-CSRF-Token', mockCsrfToken);

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should reject POST request with missing header token (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Only set cookie token (missing header)
      request.cookies.set('csrf_token', mockCsrfToken);

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('PUT/PATCH/DELETE Requests - Should require CSRF token', () => {
    it('should reject PUT request without CSRF token (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'PUT',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should allow PUT request with valid CSRF token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'PUT',
      });

      request.cookies.set('csrf_token', mockCsrfToken);
      request.headers.set('X-CSRF-Token', mockCsrfToken);
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(403);
    });

    it('should reject PATCH request without CSRF token (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'PATCH',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should allow PATCH request with valid CSRF token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'PATCH',
      });

      request.cookies.set('csrf_token', mockCsrfToken);
      request.headers.set('X-CSRF-Token', mockCsrfToken);
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(403);
    });

    it('should reject DELETE request without CSRF token (403)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'DELETE',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should allow DELETE request with valid CSRF token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles/1', {
        method: 'DELETE',
      });

      request.cookies.set('csrf_token', mockCsrfToken);
      request.headers.set('X-CSRF-Token', mockCsrfToken);
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Exempt Routes - Should skip CSRF validation', () => {
    it('should skip CSRF validation for /api/health endpoint (POST)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST',
      });

      // No CSRF token set
      // Act
      const response = middleware(request);

      // Assert - validateCsrfToken should not be called for exempt routes
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should skip CSRF validation for /api/webhooks endpoint (POST)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
      });

      // No CSRF token set
      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should skip CSRF validation for /api/health endpoint (PUT)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'PUT',
      });

      // No CSRF token set
      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });
  });

  describe('CSRF Token Setting - For authenticated users and login page', () => {
    it('should set CSRF token for authenticated user on GET request', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      request.cookies.set('catchup_feed_auth_token', mockValidToken);
      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.setCsrfToken).toHaveBeenCalledWith(expect.any(NextResponse));
    });

    it('should set CSRF token on login page', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/login', {
        method: 'GET',
      });

      // No auth token (user not logged in)
      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.setCsrfToken).toHaveBeenCalledWith(expect.any(NextResponse));
    });

    it('should NOT set CSRF token for unauthenticated user on public route', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/', {
        method: 'GET',
      });

      // No auth token
      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.setCsrfToken).not.toHaveBeenCalled();
    });

    it('should set CSRF token for authenticated user after successful POST', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      request.cookies.set('csrf_token', mockCsrfToken);
      request.headers.set('X-CSRF-Token', mockCsrfToken);
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.setCsrfToken).toHaveBeenCalledWith(expect.any(NextResponse));
    });
  });

  describe('Error Response Format', () => {
    it('should return 403 with JSON error message for CSRF validation failure', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'CSRF token validation failed',
        message:
          'Your request could not be verified. Please refresh the page and try again.',
      });
    });

    it('should return JSON response (not HTML) for API route CSRF failures', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/sources', {
        method: 'DELETE',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('application/json');
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });

  describe('CSRF Protection Flow - End-to-End Scenarios', () => {
    it('should handle complete flow: login -> get token -> make POST request', async () => {
      // Step 1: User visits login page (no auth token)
      const loginRequest = new NextRequest('http://localhost:3000/login', {
        method: 'GET',
      });

      const loginResponse = middleware(loginRequest);

      // Assert: CSRF token should be set on login page
      expect(csrfUtils.setCsrfToken).toHaveBeenCalled();

      // Step 2: User makes authenticated POST request with CSRF token
      const postRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      postRequest.cookies.set('csrf_token', mockCsrfToken);
      postRequest.headers.set('X-CSRF-Token', mockCsrfToken);
      postRequest.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to succeed
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(true);

      const postResponse = middleware(postRequest);

      // Assert: Request should succeed
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(postRequest);
      expect(postResponse.status).not.toBe(403);
    });

    it('should handle unauthenticated POST to protected route (both auth and CSRF fail)', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'POST',
      });

      // No auth token, no CSRF token
      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert: CSRF validation runs first, should return 403
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should handle authenticated POST to protected route without CSRF token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'POST',
      });

      // Has auth token, but no CSRF token
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert: CSRF validation should fail even with valid auth
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Authentication and CSRF Interaction', () => {
    it('should redirect to login when accessing protected route without auth token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      // No auth token
      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fdashboard');
    });

    it('should redirect to login and clear expired auth token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      // Set expired token
      request.cookies.set('catchup_feed_auth_token', 'expired-token');

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');

      // Check that expired token is deleted
      const deletedCookie = response.headers.getSetCookie();
      const hasDeletedAuthCookie = deletedCookie.some((cookie) =>
        cookie.includes('catchup_feed_auth_token=;')
      );
      expect(hasDeletedAuthCookie).toBe(true);
    });

    it('should redirect to dashboard when authenticated user visits login page', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/login', {
        method: 'GET',
      });

      // Set valid auth token
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect to original destination when login has redirect param', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/login?redirect=%2Farticles', {
        method: 'GET',
      });

      // Set valid auth token
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Act
      const response = middleware(request);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/articles');
    });

    it('should handle invalid JWT token format when accessing protected route', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      // Set malformed token
      request.cookies.set('catchup_feed_auth_token', 'malformed.jwt.token');

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockImplementation(() => {
        throw new Error('Invalid JWT format');
      });

      // Act
      const response = middleware(request);

      // Assert - Should redirect to login due to invalid token
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should handle JWT token without expiration claim', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
      });

      // Set token without exp claim
      request.cookies.set('catchup_feed_auth_token', mockValidToken);

      const { decodeJwt } = await import('jose');
      vi.mocked(decodeJwt).mockReturnValue({
        sub: 'user123',
        // No exp claim
      });

      // Act
      const response = middleware(request);

      // Assert - Should allow access (backend will verify)
      expect(response.status).not.toBe(307);
      expect(csrfUtils.setCsrfToken).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle POST request to public route (requires CSRF)', () => {
      // Arrange - POST to homepage (public route)
      const request = new NextRequest('http://localhost:3000/', {
        method: 'POST',
      });

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert - Even public routes require CSRF for state-changing methods
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });

    it('should handle OPTIONS request (preflight) without CSRF token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'OPTIONS',
      });

      // No CSRF token
      // Act
      const response = middleware(request);

      // Assert - OPTIONS is not a state-changing method
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle HEAD request without CSRF token', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'HEAD',
      });

      // No CSRF token
      // Act
      const response = middleware(request);

      // Assert - HEAD is a safe method
      expect(csrfUtils.validateCsrfToken).not.toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should handle empty CSRF token values', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
      });

      // Set empty token values
      request.cookies.set('csrf_token', '');
      request.headers.set('X-CSRF-Token', '');

      // Mock CSRF validation to fail
      vi.mocked(csrfUtils.validateCsrfToken).mockReturnValue(false);

      // Act
      const response = middleware(request);

      // Assert
      expect(csrfUtils.validateCsrfToken).toHaveBeenCalledWith(request);
      expect(response.status).toBe(403);
    });
  });
});
