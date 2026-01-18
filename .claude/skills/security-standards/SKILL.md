# Security Standards for catchup-feed-frontend

## Overview

This document defines security standards for the catchup-feed-frontend project based on actual implementation patterns. All security-related code must follow these standards to maintain consistency and prevent vulnerabilities.

**Project Security Stack:**
- JWT authentication with refresh tokens
- Double Submit Cookie CSRF protection
- Functional input validation (no Zod schemas currently)
- Next.js middleware for route protection
- Security headers via configuration
- Client-side token management with multi-tab sync

---

## 1. Authentication Security

### 1.1 JWT Token Management

**Pattern:** Singleton TokenManager with in-memory + localStorage storage

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/auth/TokenManager.ts`

**Key Rules:**

1. **Always use TokenManager singleton** - Never access localStorage directly for tokens
2. **Extract and validate token expiry** - Parse JWT payload to check `exp` claim
3. **Implement automatic expiry checking** - Remove expired tokens on retrieval
4. **Use multi-tab synchronization** - Broadcast token changes via BroadcastChannel
5. **Graceful degradation** - Fall back to in-memory storage if localStorage unavailable

**Example: Proper Token Storage**
```typescript
// CORRECT: Use TokenManager utilities
import { setAuthToken, getAuthToken, clearAllTokens } from '@/lib/auth/TokenManager';

// Store token after login
setAuthToken(response.token);
if (response.refresh_token) {
  setRefreshToken(response.refresh_token);
}

// Retrieve token (automatically checks expiry)
const token = getAuthToken();
if (!token) {
  // Token is null or expired
  router.push('/login');
}

// Clear all tokens on logout
clearAllTokens();

// INCORRECT: Direct localStorage access
localStorage.setItem('token', response.token); // ❌ Bypasses expiry checking
const token = localStorage.getItem('token'); // ❌ No automatic validation
```

**Example: Token Expiry Validation**
```typescript
// From: src/lib/auth/TokenManager.ts (lines 182-203)
private extractTokenExpiry(token: string): number | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return undefined;
    }

    // URL-safe base64 decoding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return payload.exp ? Number(payload.exp) : undefined;
  } catch (error) {
    logger.warn('Failed to extract token expiry', { error });
    return undefined;
  }
}
```

### 1.2 Cookie Security for Middleware

**Pattern:** HttpOnly cookies with SameSite=Strict for middleware authentication

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/hooks/useAuth.ts`

**Key Rules:**

1. **Set auth cookie after login** - Middleware needs cookie access (can't read localStorage)
2. **Use SameSite=Strict** - Prevent cross-site cookie sending
3. **Set appropriate max-age** - Match token expiry (24 hours default)
4. **Clear cookies on logout** - Set expiry to past date
5. **Synchronize with TokenManager** - Keep cookie and TokenManager in sync

**Example: Setting Auth Cookie**
```typescript
// From: src/hooks/useAuth.ts (lines 113-116)
// Set cookie for middleware (expires in 24 hours)
if (typeof document !== 'undefined') {
  document.cookie = `catchup_feed_auth_token=${response.token}; path=/; max-age=86400; SameSite=Strict`;
}

// CORRECT: Clear cookie on logout
document.cookie = 'catchup_feed_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

// INCORRECT: Missing security attributes
document.cookie = `token=${token}`; // ❌ No path, max-age, or SameSite
```

### 1.3 Token Refresh Pattern

**Pattern:** Automatic refresh before expiry with deduplication

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/client.ts`

**Key Rules:**

1. **Check token expiry before requests** - Use `isTokenExpiringSoon()` with threshold
2. **Deduplicate refresh requests** - Use promise to prevent concurrent refreshes
3. **Use refresh token endpoint** - Dynamic import to avoid circular dependencies
4. **Clear tokens on refresh failure** - Force re-authentication
5. **Configure refresh threshold** - Default 300 seconds (5 minutes)

**Example: Token Refresh Logic**
```typescript
// From: src/lib/api/client.ts (lines 81-128)
private async ensureValidToken(requiresAuth: boolean): Promise<void> {
  if (!requiresAuth || !appConfig.features.tokenRefresh) {
    return;
  }

  const token = getAuthToken();
  if (!token || !isTokenExpiringSoon()) {
    return;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logger.warn('Token is expiring but no refresh token available');
    return;
  }

  // Prevent concurrent refresh requests
  if (this.refreshPromise) {
    logger.debug('Token refresh already in progress, waiting...');
    await this.refreshPromise;
    return;
  }

  this.refreshPromise = this.performTokenRefresh();
  try {
    await this.refreshPromise;
  } finally {
    this.refreshPromise = null;
  }
}
```

---

## 2. CSRF Protection

### 2.1 Double Submit Cookie Pattern

**Pattern:** Server sets HttpOnly cookie + custom header, client sends both back

**Implementation Locations:**
- Server: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/security/csrf.ts`
- Client: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/security/CsrfTokenManager.ts`

**Key Rules:**

1. **Generate cryptographically secure tokens** - Use `crypto.getRandomValues()` with 32 bytes
2. **Encode as base64url** - URL-safe format without padding
3. **Set HttpOnly cookie** - Prevent JavaScript access
4. **Set custom header** - Client reads from response header, not cookie
5. **Validate with constant-time comparison** - Prevent timing attacks
6. **Exempt specific routes** - Health checks, webhooks don't need CSRF

**Example: Server-Side CSRF Token Generation**
```typescript
// From: src/lib/security/csrf.ts (lines 89-129)
export function generateCsrfToken(): string {
  // Generate 32 bytes of cryptographically random data
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);

  // Convert to base64url (URL-safe, no padding)
  return base64UrlEncode(buffer);
}

export function setCsrfToken(response: NextResponse): NextResponse {
  const token = generateCsrfToken();

  // Set as HttpOnly cookie (cannot be read by JavaScript)
  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Set as response header (for client to read and send back in requests)
  response.headers.set('X-CSRF-Token', token);

  return response;
}
```

**Example: CSRF Validation with Timing-Safe Comparison**
```typescript
// From: src/lib/security/csrf.ts (lines 149-191)
export function validateCsrfToken(request: NextRequest): boolean {
  // Get token from cookie (set by server)
  const cookieToken = request.cookies.get('csrf_token')?.value;

  // Get token from custom header (set by client)
  const headerToken = request.headers.get('X-CSRF-Token');

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed: missing token', {
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
      path: request.nextUrl.pathname,
      method: request.method,
    });
    return false;
  }

  // Tokens must match (constant-time comparison to prevent timing attacks)
  const isValid = timingSafeEqual(cookieToken, headerToken);

  if (!isValid) {
    logger.warn('CSRF validation failed: token mismatch', {
      path: request.nextUrl.pathname,
      method: request.method,
    });
  }

  return isValid;
}

// Timing-safe comparison (lines 209-223)
export function timingSafeEqual(a: string, b: string): boolean {
  // Different lengths always fail (this is safe to short-circuit)
  if (a.length !== b.length) {
    return false;
  }

  // Constant-time comparison: XOR each character and accumulate result
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  // Result is 0 if and only if all characters matched
  return result === 0;
}
```

### 2.2 Client-Side CSRF Token Management

**Pattern:** Extract from response headers, store in sessionStorage, include in requests

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/security/CsrfTokenManager.ts`

**Key Rules:**

1. **Use singleton pattern** - Single source of truth for CSRF token
2. **Extract from response headers** - Read `X-CSRF-Token` header
3. **Store in sessionStorage** - Scoped to tab, cleared on close
4. **Never log token values** - Only log presence/absence
5. **Add to state-changing requests** - POST, PUT, PATCH, DELETE

**Example: Client-Side Token Management**
```typescript
// From: src/lib/security/CsrfTokenManager.ts (lines 112-210)
export class CsrfTokenManager {
  private static instance: CsrfTokenManager | null = null;
  private token: string | null = null;
  private readonly TOKEN_STORAGE_KEY = 'catchup_feed_csrf_token';
  private readonly TOKEN_HEADER_NAME = 'X-CSRF-Token';

  // Extract token from response
  public extractToken(response: Response): void {
    try {
      const token = response.headers.get(this.TOKEN_HEADER_NAME);
      if (token) {
        this.token = token;

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(this.TOKEN_STORAGE_KEY, token);
          logger.debug('CSRF token extracted and stored', {
            hasToken: true, // ✅ Never log actual token value
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to extract CSRF token from response', { error });
    }
  }

  // Add to request headers
  public addTokenToHeaders(headers: Record<string, string>): Record<string, string> {
    if (this.token) {
      return {
        ...headers,
        [this.TOKEN_HEADER_NAME]: this.token,
      };
    }
    return headers;
  }
}
```

### 2.3 Middleware CSRF Validation

**Pattern:** Validate before route protection, exempt specific routes

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/middleware.ts`

**Key Rules:**

1. **Validate CSRF before authentication** - Fail fast for invalid tokens
2. **Only validate state-changing methods** - POST, PUT, PATCH, DELETE
3. **Exempt specific routes** - Health checks, webhooks
4. **Return 403 with clear message** - Help client understand failure
5. **Set CSRF token for authenticated users** - And login page visitors

**Example: Middleware CSRF Validation**
```typescript
// From: src/middleware.ts (lines 17-157)
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const CSRF_EXEMPT_ROUTES = ['/api/health', '/api/webhooks'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Phase 1: CSRF Validation for state-changing requests
  // This runs BEFORE authentication checks
  if (STATE_CHANGING_METHODS.includes(method) && !isCsrfExempt(pathname)) {
    const isValidCsrf = validateCsrfToken(request);
    if (!isValidCsrf) {
      return NextResponse.json(
        {
          error: 'CSRF token validation failed',
          message: 'Your request could not be verified. Please refresh the page and try again.',
        },
        { status: 403 }
      );
    }
  }

  // ... authentication checks ...

  // Phase 3: Set CSRF token for authenticated users and login page
  const response = NextResponse.next();

  if (hasValidToken || pathname === '/login') {
    setCsrfToken(response);
  }

  return response;
}
```

### 2.4 API Client CSRF Integration

**Pattern:** Automatically add CSRF token to state-changing requests

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/client.ts`

**Key Rules:**

1. **Auto-inject CSRF tokens** - Add to headers for POST/PUT/PATCH/DELETE
2. **Extract from all responses** - Server may rotate tokens
3. **Handle CSRF errors specially** - Clear token and reload page
4. **Don't retry CSRF failures** - Requires fresh token from server
5. **Clear token on logout** - Prevent stale token usage

**Example: API Client CSRF Handling**
```typescript
// From: src/lib/api/client.ts (lines 377-424)
// Add CSRF token to headers for state-changing requests
if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
  requestHeaders = addCsrfTokenToHeaders(requestHeaders);
}

// ... make request ...

// Extract and store CSRF token from response (if present)
setCsrfTokenFromResponse(response);

// Handle CSRF validation failures (lines 189-278)
private isCsrfError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false;
  }

  // Check for specific error code
  if (error.details?.code === 'CSRF_VALIDATION_FAILED') {
    return true;
  }

  // Check error message for CSRF-specific keywords
  const message = error.message.toLowerCase();
  return (
    message.includes('csrf') ||
    message.includes('token validation failed') ||
    message.includes('invalid csrf token')
  );
}

private handleCsrfError(endpoint: string): void {
  logger.warn('CSRF validation failed', { endpoint, action: 'clearing_token' });

  // Clear the invalid CSRF token
  clearCsrfToken();

  // Reload page to get fresh CSRF token (with infinite loop protection)
  const reloadKey = 'csrf_reload_attempted';
  const reloadAttempted = sessionStorage.getItem(reloadKey);

  if (!reloadAttempted) {
    sessionStorage.setItem(reloadKey, Date.now().toString());
    setTimeout(() => window.location.reload(), 100);
  }
}
```

---

## 3. Input Validation

### 3.1 Functional Validation Pattern

**Pattern:** Composable validator functions with type-safe error handling

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/utils/validation.ts`

**Key Rules:**

1. **Use functional validators** - Pure functions that return `string | null`
2. **Compose validators** - Combine multiple validators with `compose()`
3. **Validate before submission** - Check all fields before API calls
4. **Return specific error messages** - Help users fix issues
5. **Never trust client input** - Backend must also validate

**Example: Functional Validators**
```typescript
// From: src/utils/validation.ts (lines 17-84)
export type Validator = (value: string) => string | null;

export const validators = {
  // Required field validation
  required: (message = 'This field is required'): Validator =>
    (value: string) => !value?.trim() ? message : null,

  // Length validation
  maxLength: (max: number, message?: string): Validator =>
    (value: string) => value?.length > max
      ? message || `Maximum ${max} characters allowed`
      : null,

  minLength: (min: number, message?: string): Validator =>
    (value: string) => value?.length < min
      ? message || `Minimum ${min} characters required`
      : null,

  // Format validation
  urlFormat: (message = 'Please enter a valid URL'): Validator =>
    (value: string) => !/^https?:\/\/.+/.test(value) ? message : null,

  emailFormat: (message = 'Please enter a valid email address'): Validator =>
    (value: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,

  // Pattern validation
  pattern: (pattern: RegExp, message = 'Invalid format'): Validator =>
    (value: string) => !pattern.test(value) ? message : null,

  // Compose multiple validators
  compose: (...fns: Validator[]): Validator =>
    (value: string) => fns.reduce<string | null>((err, fn) => err || fn(value), null),
};

// CORRECT: Compose validators for complex validation
const validateSourceUrl = validators.compose(
  validators.required('URL is required'),
  validators.urlFormat('Must be a valid URL starting with http:// or https://'),
  validators.maxLength(2048, 'URL is too long')
);

const error = validateSourceUrl('https://example.com/feed.xml');
if (error) {
  console.error(error);
}

// INCORRECT: Imperative validation with multiple if statements
if (!url) {
  return 'URL is required'; // ❌ Not composable
}
if (!url.startsWith('http')) {
  return 'Invalid URL'; // ❌ Not reusable
}
```

### 3.2 Query Parameter Validation

**Pattern:** Parse and validate with defaults, constrain to allowed values

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/utils/pagination.ts`

**Key Rules:**

1. **Always parse integers** - Use `parseInt()` with radix
2. **Check for NaN** - Validate parsing succeeded
3. **Apply range constraints** - Min/max values, allowed lists
4. **Provide safe defaults** - Never use unvalidated input
5. **Validate array membership** - For enums and predefined lists

**Example: Query Parameter Validation**
```typescript
// From: src/lib/api/utils/pagination.ts (lines 50-75)
export function validatePaginationParams(params: URLSearchParams): {
  page: number;
  limit: number;
} {
  const pageParam = params.get('page');
  const limitParam = params.get('limit');

  let page: number = PAGINATION_CONFIG.DEFAULT_PAGE;
  let limit: number = PAGINATION_CONFIG.DEFAULT_LIMIT;

  // Validate page parameter
  if (pageParam) {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed;
    }
  }

  // Validate limit parameter (must be in allowed list)
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES.includes(parsed as any)) {
      limit = parsed;
    }
  }

  return { page, limit };
}

// INCORRECT: Using query params without validation
const page = parseInt(params.get('page') || '1'); // ❌ No NaN check
const limit = Number(params.get('limit')); // ❌ Allows any number
```

### 3.3 Response Validation

**Pattern:** Validate structure and types of API responses

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/utils/pagination.ts`

**Key Rules:**

1. **Validate response structure** - Check for required fields
2. **Check array types** - Use `Array.isArray()`
3. **Validate nested objects** - Check `typeof` and `!== null`
4. **Log validation failures** - Include context for debugging
5. **Use type guards** - Return boolean for TypeScript type narrowing

**Example: Response Structure Validation**
```typescript
// From: src/lib/api/utils/pagination.ts (lines 94-128)
export function validatePaginatedResponse<T>(
  response: unknown,
  endpoint: string
): response is PaginatedResponse<T> {
  if (typeof response !== 'object' || response === null) {
    console.error(`[API] Invalid response from ${endpoint}: Not an object`);
    return false;
  }

  const r = response as Record<string, unknown>;

  // Validate data array
  if (!Array.isArray(r.data)) {
    console.error(`[API] Invalid response from ${endpoint}: Missing or invalid 'data' array`);
    return false;
  }

  // Validate pagination object
  if (typeof r.pagination !== 'object' || r.pagination === null) {
    console.error(`[API] Invalid response from ${endpoint}: Missing or invalid 'pagination' object`);
    return false;
  }

  // Validate pagination fields
  const p = r.pagination as Record<string, unknown>;
  const requiredFields = ['page', 'limit', 'total', 'total_pages'];

  for (const field of requiredFields) {
    if (typeof p[field] !== 'number') {
      console.error(`[API] Invalid pagination metadata: Missing or invalid '${field}'`);
      return false;
    }
  }

  return true;
}
```

---

## 4. Secure Storage

### 4.1 Token Storage Priority

**Pattern:** In-memory + localStorage with graceful fallback

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/auth/TokenManager.ts`

**Key Rules:**

1. **Primary: In-memory storage** - Fast access, automatic cleanup on tab close
2. **Persistent: localStorage** - Survives page reloads
3. **Check availability** - Test localStorage with write/remove
4. **Graceful fallback** - Use in-memory only if localStorage blocked
5. **Synchronize across tabs** - Use BroadcastChannel API

**Example: Storage Availability Check**
```typescript
// From: src/lib/auth/TokenManager.ts (lines 86-100)
private checkLocalStorageAvailability(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__catchup_feed_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    logger.warn('localStorage is not available, using in-memory storage', { error });
    return false;
  }
}

// CORRECT: Check availability before use
if (this.isLocalStorageAvailable) {
  localStorage.setItem(key, value);
}

// INCORRECT: Direct localStorage access without checks
localStorage.setItem(key, value); // ❌ Throws in private browsing
```

### 4.2 Multi-Tab Synchronization

**Pattern:** BroadcastChannel for token changes across tabs

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/auth/TokenManager.ts`

**Key Rules:**

1. **Use BroadcastChannel** - Native browser API for tab communication
2. **Broadcast all changes** - set, remove, clear operations
3. **Handle messages safely** - Try/catch around message processing
4. **Close channel on cleanup** - Prevent memory leaks
5. **Fall back gracefully** - Work without BroadcastChannel if unavailable

**Example: Multi-Tab Sync**
```typescript
// From: src/lib/auth/TokenManager.ts (lines 56-65, 134-175)
// Initialize BroadcastChannel
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    this.broadcastChannel = new BroadcastChannel('catchup_feed_token_sync');
    this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);
    logger.debug('BroadcastChannel initialized for token sync');
  } catch (error) {
    logger.warn('Failed to initialize BroadcastChannel', { error });
    this.broadcastChannel = null;
  }
}

// Handle messages from other tabs
private handleBroadcastMessage(event: MessageEvent<TokenMessage>): void {
  try {
    const message = event.data;

    switch (message.type) {
      case 'set':
        this.storage.set(message.key, {
          value: message.value,
          expiresAt: message.expiresAt,
        });
        logger.debug('Token updated from other tab', { key: message.key });
        break;

      case 'remove':
        this.storage.delete(message.key);
        logger.debug('Token removed from other tab', { key: message.key });
        break;

      case 'clear':
        this.storage.clear();
        logger.debug('All tokens cleared from other tab');
        break;
    }
  } catch (error) {
    logger.error('Failed to handle broadcast message', error as Error, {
      message: event.data,
    });
  }
}

// Broadcast token changes
private broadcast(message: TokenMessage): void {
  if (this.broadcastChannel) {
    try {
      this.broadcastChannel.postMessage(message);
    } catch (error) {
      logger.warn('Failed to broadcast token change', { error });
    }
  }
}
```

### 4.3 Sensitive Data Storage Rules

**Key Rules:**

1. **Never store passwords** - Only store tokens
2. **Never store tokens in URLs** - Use headers or body
3. **Clear on logout** - Remove all sensitive data
4. **Use sessionStorage for CSRF** - Scoped to tab, cleared on close
5. **Avoid logging secrets** - Log presence/absence, never values

**Example: Safe vs Unsafe Storage**
```typescript
// CORRECT: Store tokens securely
setAuthToken(response.token);
setCsrfTokenFromResponse(response);

// CORRECT: Clear on logout
clearAllTokens();
clearCsrfToken();

// INCORRECT: Storing sensitive data insecurely
localStorage.setItem('password', password); // ❌ Never store passwords
window.token = token; // ❌ Global variable leaks token
console.log('Token:', token); // ❌ Logs sensitive data
router.push(`/dashboard?token=${token}`); // ❌ Token in URL
```

---

## 5. Security Headers

### 5.1 HTTP Security Headers

**Pattern:** Centralized security header configuration

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/config/security.config.ts`

**Key Rules:**

1. **Configure all major security headers** - HSTS, CSP, X-Frame-Options, etc.
2. **Use Strict-Transport-Security** - Force HTTPS in production
3. **Prevent MIME sniffing** - X-Content-Type-Options: nosniff
4. **Control referrer** - strict-origin-when-cross-origin
5. **Disable dangerous features** - Permissions-Policy

**Example: Security Headers Configuration**
```typescript
// From: src/config/security.config.ts (lines 117-169)
export const securityConfig: SecurityConfig = {
  headers: [
    // Strict-Transport-Security (HSTS)
    // Force HTTPS for 1 year, include subdomains
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    },

    // X-Frame-Options - Prevent clickjacking attacks
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },

    // X-Content-Type-Options - Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },

    // Referrer-Policy - Control referrer information
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },

    // Permissions-Policy - Control browser features and APIs
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },

    // X-DNS-Prefetch-Control - Control DNS prefetching
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },

    // Content-Security-Policy (see below)
    {
      key: 'Content-Security-Policy',
      value: buildCSP(cspDirectives),
    },
  ],
};
```

### 5.2 Content Security Policy (CSP)

**Pattern:** Comprehensive CSP with environment-specific directives

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/config/security.config.ts`

**Key Rules:**

1. **Default to 'self'** - Start restrictive, whitelist as needed
2. **Allow unsafe-inline/unsafe-eval carefully** - Only where framework requires
3. **Whitelist API domains** - Add backend URL to connect-src
4. **Upgrade insecure requests in production** - Force HTTPS
5. **Deny frame ancestors** - Prevent embedding

**Example: CSP Configuration**
```typescript
// From: src/config/security.config.ts (lines 80-112)
const cspDirectives: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js in development
    "'unsafe-inline'", // Required for Next.js inline scripts
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and styled-components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:', // Required for inline images (base64)
    'blob:', // Required for generated images
    'https:', // Allow all HTTPS images
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    appConfig.api.baseUrl, // Allow API calls to backend
    ...(appConfig.observability.sentryDsn
      ? ['https://*.ingest.sentry.io'] // Allow Sentry if configured
      : []),
  ],
  'frame-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  ...(appConfig.env.isProduction ? { 'upgrade-insecure-requests': true } : {}),
};
```

---

## 6. Route Protection

### 6.1 Middleware-Based Protection

**Pattern:** Next.js middleware validates tokens and protects routes

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/middleware.ts`

**Key Rules:**

1. **Validate CSRF before auth** - CSRF check runs first
2. **Decode JWT without verification** - Edge runtime can't verify signature
3. **Check token expiry** - Use `exp` claim with buffer
4. **Redirect unauthenticated users** - Preserve destination in redirect param
5. **Clear expired tokens** - Delete cookies for invalid tokens

**Example: Middleware Route Protection**
```typescript
// From: src/middleware.ts (lines 71-157)
function isTokenValid(token: string): boolean {
  try {
    const payload = decodeJwt(token);

    // Check if token has an expiration claim
    if (!payload.exp) {
      return true; // No expiration, backend will verify
    }

    // Check if token has expired (with 30-second buffer for clock skew)
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferMs = 30 * 1000;

    return currentTime < expirationTime + bufferMs;
  } catch {
    return false; // Invalid token format
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phase 1: CSRF Validation (shown earlier)
  // ...

  // Phase 2: Authentication check
  const token = request.cookies.get('catchup_feed_auth_token')?.value;
  const hasValidToken = token ? isTokenValid(token) : false;

  // Protected routes: redirect to /login if no valid token
  if (isProtectedRoute(pathname) && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    const response = NextResponse.redirect(loginUrl);
    if (token && !hasValidToken) {
      response.cookies.delete('catchup_feed_auth_token');
    }
    return response;
  }

  // Login page: redirect to /dashboard if already authenticated
  if (pathname === '/login' && hasValidToken) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const dashboardUrl = new URL(redirectParam || '/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Phase 3: Set CSRF token
  const response = NextResponse.next();
  if (hasValidToken || pathname === '/login') {
    setCsrfToken(response);
  }

  return response;
}
```

### 6.2 Client-Side Route Protection

**Pattern:** useAuth hook checks authentication state

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/hooks/useAuth.ts`

**Key Rules:**

1. **Check token on mount** - Validate authentication state
2. **Set cookie for middleware** - Sync TokenManager with cookies
3. **Clear on logout** - Remove tokens and cookies
4. **Redirect after login** - Navigate to protected routes
5. **Set user context** - For error tracking and analytics

**Example: Client-Side Auth Check**
```typescript
// From: src/hooks/useAuth.ts (lines 76-94)
useEffect(() => {
  const currentToken = getAuthToken();
  if (currentToken && !isTokenExpired()) {
    setToken(currentToken);
    setIsAuthenticated(true);
    // Set cookie for middleware
    if (typeof document !== 'undefined') {
      document.cookie = `catchup_feed_auth_token=${currentToken}; path=/; max-age=86400; SameSite=Strict`;
    }
  } else {
    setToken(null);
    setIsAuthenticated(false);
    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'catchup_feed_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
}, []);
```

---

## 7. Error Handling

### 7.1 Authentication Error Handling

**Pattern:** Clear tokens and redirect on 401 responses

**Implementation Location:** `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/client.ts`

**Key Rules:**

1. **Clear all tokens on 401** - Force re-authentication
2. **Redirect to login page** - Only on client-side
3. **Preserve destination** - Use redirect parameter
4. **Log authentication failures** - Include context
5. **Track metrics** - Monitor authentication errors

**Example: 401 Error Handling**
```typescript
// From: src/lib/api/client.ts (lines 426-435)
// Handle authentication errors
if (response.status === 401) {
  clearAllTokens();

  // Redirect to login page on client-side
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }

  throw new ApiError('Authentication required', 401);
}
```

### 7.2 Never Log Sensitive Data

**Key Rules:**

1. **Log presence, not values** - `hasToken: true` instead of `token: xyz`
2. **Redact in error messages** - Remove tokens from error context
3. **Structured logging** - Use logger with metadata
4. **Never log passwords** - Even hashed
5. **Sanitize user input** - Before logging

**Example: Safe Logging**
```typescript
// CORRECT: Log without sensitive data
logger.debug('CSRF token extracted and stored', {
  hasToken: true, // ✅ Indicates presence
});

logger.warn('CSRF validation failed', {
  hasCookie: !!cookieToken, // ✅ Boolean flag
  hasHeader: !!headerToken, // ✅ Boolean flag
  path: request.nextUrl.pathname,
});

// INCORRECT: Logging sensitive data
logger.debug('Token:', token); // ❌ Logs token value
console.log({ csrfToken: token }); // ❌ Exposes CSRF token
logger.error('Login failed', { password }); // ❌ Logs password
```

---

## 8. Enforcement Checklist

### Pre-Commit Checks

- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] No token values in logs or error messages
- [ ] All validators return `string | null` (not `boolean`)
- [ ] CSRF tokens added to all state-changing requests
- [ ] Auth tokens retrieved via TokenManager, not localStorage
- [ ] Input validated before API calls
- [ ] Security headers configured in Next.js config

### Code Review Checks

- [ ] TokenManager used for all token operations
- [ ] CSRF validation in middleware for POST/PUT/PATCH/DELETE
- [ ] Constant-time comparison for token validation
- [ ] Cookies have HttpOnly, SameSite=Strict, secure flags
- [ ] Query parameters validated with parseInt and NaN checks
- [ ] Response structure validated before use
- [ ] No sensitive data stored in URLs or localStorage (except tokens)
- [ ] Authentication errors clear tokens and redirect

### Testing Requirements

- [ ] Test CSRF token generation and validation
- [ ] Test token expiry checking
- [ ] Test input validation edge cases
- [ ] Test authentication redirect flows
- [ ] Test multi-tab token synchronization
- [ ] Test CSRF error handling and page reload
- [ ] Test query parameter validation with invalid inputs

### Deployment Checks

- [ ] Security headers enabled in production
- [ ] HTTPS enforced (HSTS header)
- [ ] CSP configured with minimal permissions
- [ ] Environment variables for sensitive config
- [ ] Sentry configured for production error tracking
- [ ] API URLs use HTTPS in production

---

## 9. Common Anti-Patterns

### ❌ Direct localStorage Access
```typescript
// WRONG
localStorage.setItem('token', token);
const token = localStorage.getItem('token');

// CORRECT
setAuthToken(token);
const token = getAuthToken();
```

### ❌ Missing CSRF Token
```typescript
// WRONG
await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify(data),
});

// CORRECT
const headers = addCsrfTokenToHeaders({
  'Content-Type': 'application/json',
});
await fetch('/api/posts', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
});
```

### ❌ Logging Sensitive Data
```typescript
// WRONG
logger.info('User login', { password, token });

// CORRECT
logger.info('User login', {
  username: user.email,
  hasToken: !!token,
});
```

### ❌ Insecure Cookie Settings
```typescript
// WRONG
document.cookie = `token=${token}`;

// CORRECT
document.cookie = `catchup_feed_auth_token=${token}; path=/; max-age=86400; SameSite=Strict`;
```

### ❌ Unvalidated Input
```typescript
// WRONG
const page = Number(params.get('page'));
const limit = params.get('limit');

// CORRECT
const page = validatePaginationParams(params).page;
const limit = validatePaginationParams(params).limit;
```

### ❌ Non-Constant Time Comparison
```typescript
// WRONG
if (cookieToken === headerToken) { /* ... */ }

// CORRECT
if (timingSafeEqual(cookieToken, headerToken)) { /* ... */ }
```

---

## 10. Security Resources

### Internal Documentation
- CSRF Protection: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/security/csrf.ts`
- Token Management: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/auth/TokenManager.ts`
- Security Config: `/Users/yujitsuchiya/catchup-feed-frontend/src/config/security.config.ts`
- Middleware: `/Users/yujitsuchiya/catchup-feed-frontend/src/middleware.ts`

### Security Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Dependencies
- Next.js Middleware (route protection)
- jose (JWT decoding in Edge runtime)
- Web Crypto API (CSRF token generation)
- BroadcastChannel API (multi-tab sync)

---

**Last Updated:** 2026-01-05
**Version:** 1.0
**Applies To:** catchup-feed-frontend frontend application
