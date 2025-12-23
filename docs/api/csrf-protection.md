# CSRF Protection API Documentation

## Overview

This document describes the CSRF (Cross-Site Request Forgery) protection implementation for the Catchup Feed application. The implementation uses the **Double Submit Cookie** pattern with cryptographically secure tokens and SameSite cookies.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication Flow](#authentication-flow)
- [Request Requirements](#request-requirements)
- [Response Headers](#response-headers)
- [Error Responses](#error-responses)
- [Client Integration Guide](#client-integration-guide)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Making a Protected Request

```javascript
// 1. Get CSRF token from response header or sessionStorage
const csrfToken = getCsrfToken(); // from CsrfTokenManager

// 2. Include token in request header
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Required for state-changing requests
  },
  body: JSON.stringify({ title: 'My Post' }),
});

// 3. Extract new token from response (if provided)
setCsrfTokenFromResponse(response);
```

---

## Authentication Flow

### Initial Token Acquisition

CSRF tokens are automatically set by the server in these scenarios:

1. **After successful login**
2. **On authenticated page loads**
3. **When visiting the login page** (for login form submission)

#### Example: Login Flow

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```http
HTTP/1.1 200 OK
Set-Cookie: csrf_token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v

{
  "user": { ... },
  "tokens": { ... }
}
```

**What Happens:**
- Server sets `csrf_token` cookie (HttpOnly, inaccessible to JavaScript)
- Server sends `X-CSRF-Token` header (readable by client)
- Client stores token in sessionStorage for future requests

---

## Request Requirements

### Protected Methods

The following HTTP methods **require** a valid CSRF token:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

### Safe Methods (No Token Required)

These methods **do not** require a CSRF token:

- `GET`
- `HEAD`
- `OPTIONS`

### Required Headers

For all state-changing requests, include:

```http
X-CSRF-Token: <token-value>
```

### Example: Creating a Resource

```http
POST /api/feeds HTTP/1.1
Content-Type: application/json
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v

{
  "url": "https://example.com/feed.xml",
  "title": "Example Feed"
}
```

### Example: Updating a Resource

```http
PATCH /api/feeds/123 HTTP/1.1
Content-Type: application/json
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v

{
  "title": "Updated Feed Title"
}
```

### Example: Deleting a Resource

```http
DELETE /api/feeds/123 HTTP/1.1
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v
```

---

## Response Headers

### CSRF Token Header

All responses to authenticated users may include a CSRF token:

```http
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v
```

**When to Extract:**
- After successful login
- After page navigation (if token is refreshed)
- Periodically for long-lived sessions

**Client Responsibility:**
- Extract token from `X-CSRF-Token` response header
- Store in sessionStorage
- Include in subsequent state-changing requests

### Cookie Header

The server sets an HttpOnly cookie alongside the header:

```http
Set-Cookie: csrf_token=<token-value>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

**Cookie Attributes:**
- `HttpOnly`: Prevents JavaScript access (security)
- `Secure`: Only sent over HTTPS (production only)
- `SameSite=Strict`: Prevents cross-site sending (CSRF protection)
- `Path=/`: Available for all routes
- `Max-Age=86400`: Valid for 24 hours

**Client Note:**
You **cannot** read this cookie from JavaScript. The browser automatically sends it with requests.

---

## Error Responses

### CSRF Validation Failure

**HTTP Status:** `403 Forbidden`

**Error Code:** `CSRF_VALIDATION_FAILED`

**Response Body:**

```json
{
  "error": "CSRF validation failed",
  "code": "CSRF_VALIDATION_FAILED",
  "message": "Invalid or missing CSRF token. Please refresh the page and try again."
}
```

### Scenarios That Trigger 403

1. **Missing Token Header**
   - Request: No `X-CSRF-Token` header
   - Cookie: `csrf_token` cookie exists

2. **Missing Token Cookie**
   - Request: `X-CSRF-Token` header present
   - Cookie: No `csrf_token` cookie

3. **Token Mismatch**
   - Request: `X-CSRF-Token` = `abc123`
   - Cookie: `csrf_token` = `xyz789`
   - Reason: Tokens do not match (possible attack or stale token)

4. **Expired Session**
   - Cookie expired (24-hour timeout)
   - User needs to re-authenticate

### Example Error Response

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "CSRF validation failed",
  "code": "CSRF_VALIDATION_FAILED",
  "message": "Invalid or missing CSRF token. Please refresh the page and try again."
}
```

### Client Error Handling

```javascript
try {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (response.status === 403) {
    const error = await response.json();

    if (error.code === 'CSRF_VALIDATION_FAILED') {
      // Clear stale token
      clearCsrfToken();

      // Option 1: Reload page to get fresh token
      window.location.reload();

      // Option 2: Show user notification
      showNotification('Session expired. Please refresh the page.');
    }
  }
} catch (error) {
  // Handle network errors
}
```

---

## Client Integration Guide

### Using the CSRF Token Manager

The application provides a built-in `CsrfTokenManager` for managing tokens.

#### Import

```typescript
import {
  getCsrfToken,
  setCsrfTokenFromResponse,
  clearCsrfToken,
  addCsrfTokenToHeaders,
} from '@/lib/security/CsrfTokenManager';
```

#### Get Current Token

```typescript
const token = getCsrfToken();
// Returns: string | null
```

#### Extract Token from Response

```typescript
const response = await fetch('/api/login', { method: 'POST', ... });

// Extract and store token
setCsrfTokenFromResponse(response);
```

#### Clear Token (on Logout)

```typescript
function logout() {
  // Clear authentication tokens
  clearAllTokens();

  // Clear CSRF token
  clearCsrfToken();

  // Redirect to login
  router.push('/login');
}
```

#### Add Token to Headers

```typescript
const headers = {
  'Content-Type': 'application/json',
};

// Add CSRF token if available
const headersWithCsrf = addCsrfTokenToHeaders(headers);

fetch('/api/posts', {
  method: 'POST',
  headers: headersWithCsrf,
  body: JSON.stringify(data),
});
```

### Automatic Integration with API Client

The application's API client (`src/lib/api/client.ts`) **automatically handles CSRF tokens**. No manual intervention required!

#### Example: Using API Client

```typescript
import { apiClient } from '@/lib/api/client';

// CSRF token automatically included in POST requests
const response = await apiClient.post('/posts', {
  title: 'My Post',
  content: 'Post content',
});

// Token automatically extracted from response
// No manual token management needed!
```

#### What the API Client Does Automatically

1. **Extracts** CSRF token from all responses
2. **Stores** token in sessionStorage
3. **Includes** token in state-changing requests (POST/PUT/PATCH/DELETE)
4. **Skips** token for GET requests
5. **Handles** 403 errors and token refresh

### Manual Fetch Requests

If you need to use `fetch` directly (not recommended), include the token manually:

```typescript
import { getCsrfToken } from '@/lib/security/CsrfTokenManager';

const response = await fetch('/api/custom-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken() || '', // Include CSRF token
  },
  credentials: 'include', // Important: Send cookies
  body: JSON.stringify(data),
});
```

**Critical Points:**
- Always include `credentials: 'include'` to send cookies
- Always include `X-CSRF-Token` header for POST/PUT/PATCH/DELETE
- Always extract token from response header if present

---

## Security Best Practices

### For Developers

#### 1. Never Bypass CSRF Protection

```typescript
// ❌ BAD: Disabling CSRF for convenience
if (process.env.NODE_ENV === 'development') {
  // Skip CSRF validation (INSECURE!)
}

// ✅ GOOD: Always enforce CSRF protection
if (request.method !== 'GET' && !isCsrfExempt(request)) {
  if (!validateCsrfToken(request)) {
    return new Response('CSRF validation failed', { status: 403 });
  }
}
```

#### 2. Use Exempt Routes Sparingly

Only exempt routes that are **genuinely public** and **safe from CSRF attacks**:

```typescript
const CSRF_EXEMPT_ROUTES = [
  '/api/health',      // ✅ Public health check
  '/api/webhooks',    // ✅ Authenticated via signature, not cookies
];

// ❌ NEVER exempt user-facing API routes
const BAD_EXEMPT_ROUTES = [
  '/api/auth/login',  // BAD: Login needs CSRF protection!
  '/api/posts',       // BAD: User data needs protection!
];
```

#### 3. Never Log Token Values

```typescript
// ❌ BAD: Logging token values (security risk)
logger.info('CSRF token:', { token: csrfToken });

// ✅ GOOD: Log token presence only
logger.info('CSRF token extracted', { hasToken: !!csrfToken });
```

#### 4. Validate Token Length

```typescript
// ✅ GOOD: Validate token format
function validateTokenFormat(token: string): boolean {
  // Expected: 43 characters (base64url of 32 bytes)
  return token.length === 43 && /^[A-Za-z0-9_-]+$/.test(token);
}
```

#### 5. Rotate Tokens on Privilege Escalation

```typescript
// ✅ GOOD: Generate new token on login
async function login(credentials) {
  const user = await authenticateUser(credentials);

  // Generate fresh CSRF token after authentication
  const response = NextResponse.json({ user });
  setCsrfToken(response); // New token for authenticated session

  return response;
}
```

### For Frontend Developers

#### 1. Always Use API Client

```typescript
// ✅ RECOMMENDED: Use centralized API client
import { apiClient } from '@/lib/api/client';
const response = await apiClient.post('/posts', data);

// ⚠️ AVOID: Direct fetch calls (manual token management)
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'X-CSRF-Token': getCsrfToken() },
  body: JSON.stringify(data),
});
```

#### 2. Handle 403 Errors Gracefully

```typescript
// ✅ GOOD: Graceful error recovery
try {
  await apiClient.post('/posts', data);
} catch (error) {
  if (error.code === 'CSRF_VALIDATION_FAILED') {
    // Clear token and prompt user
    clearCsrfToken();
    showNotification('Session expired. Refreshing...');
    window.location.reload();
  }
}
```

#### 3. Clear Token on Logout

```typescript
// ✅ GOOD: Complete logout flow
async function logout() {
  // 1. Call logout API
  await apiClient.post('/auth/logout');

  // 2. Clear auth tokens
  clearAllTokens();

  // 3. Clear CSRF token
  clearCsrfToken();

  // 4. Redirect
  router.push('/login');
}
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                          │
└─────────────────────────────────────────────────────────────┘

1. User visits login page
   ↓
2. Server sets initial CSRF token (cookie + header)
   ↓
3. Client extracts token from header → stores in sessionStorage
   ↓
4. User submits login form with CSRF token
   ↓
5. Server validates token (cookie vs header)
   ↓
6. On success, server generates NEW token for authenticated session
   ↓
7. Client extracts new token → stores in sessionStorage
   ↓
8. Client includes token in all POST/PUT/PATCH/DELETE requests
   ↓
9. On logout, client clears token from sessionStorage
   ↓
10. Cookie expires after 24 hours (server-side)
```

---

## Troubleshooting

### Common Issues

#### 1. "CSRF validation failed" on first request

**Symptom:** 403 error immediately after login

**Cause:** Token not extracted from login response

**Solution:**
```typescript
// Ensure token extraction after login
const response = await apiClient.post('/auth/login', credentials);
setCsrfTokenFromResponse(response); // Extract token
```

#### 2. Token lost after page reload

**Symptom:** CSRF errors after refreshing page

**Cause:** sessionStorage cleared or token not persisted

**Solution:**
- Check that token is stored in sessionStorage (not localStorage)
- Ensure server sends token on page load for authenticated users
- Verify middleware sets token for authenticated routes

#### 3. 403 errors in development but not production

**Symptom:** CSRF works locally but fails in deployed environment

**Cause:** Cookie `Secure` attribute mismatch

**Solution:**
```typescript
// Check cookie configuration
response.cookies.set('csrf_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24,
});
```

#### 4. Tokens not sent with requests

**Symptom:** Missing `X-CSRF-Token` header in network tab

**Cause:** Not using API client or missing manual header injection

**Solution:**
- Use `apiClient` for all API calls
- Or manually add token: `headers['X-CSRF-Token'] = getCsrfToken()`

#### 5. Infinite reload loop after 403

**Symptom:** Page keeps reloading on CSRF error

**Cause:** Error recovery triggers reload, but no new token available

**Solution:**
```typescript
// Add safety check before reload
if (error.code === 'CSRF_VALIDATION_FAILED') {
  clearCsrfToken();

  // Prevent infinite loops
  const reloadCount = sessionStorage.getItem('csrf_reload_count') || '0';
  if (parseInt(reloadCount) < 3) {
    sessionStorage.setItem('csrf_reload_count', String(parseInt(reloadCount) + 1));
    window.location.reload();
  } else {
    // Redirect to login after 3 failed attempts
    router.push('/login');
  }
}
```

### Debugging Tips

#### Check Token Presence

```typescript
// In browser console
console.log('CSRF Token:', sessionStorage.getItem('catchup_feed_csrf_token'));
```

#### Inspect Cookie

```javascript
// In browser console
document.cookie.split(';').find(c => c.includes('csrf_token'));
// Note: May return undefined due to HttpOnly flag (expected)
```

#### Network Tab Verification

1. Open DevTools → Network tab
2. Make a POST request
3. Check **Request Headers:**
   - Should include `X-CSRF-Token: <token-value>`
4. Check **Response Headers:**
   - Should include `X-CSRF-Token: <token-value>`
   - Should include `Set-Cookie: csrf_token=...`

#### Middleware Logs

Check server logs for CSRF validation details:

```
[WARN] CSRF validation failed: missing token
  path: /api/posts
  method: POST
  hasCookie: true
  hasHeader: false
```

---

## API Reference Summary

### Endpoints Requiring CSRF Token

All state-changing endpoints require a valid CSRF token:

| Endpoint | Method | Token Required |
|----------|--------|----------------|
| `/api/auth/login` | POST | ✅ Yes |
| `/api/auth/logout` | POST | ✅ Yes |
| `/api/feeds` | POST | ✅ Yes |
| `/api/feeds/:id` | PATCH | ✅ Yes |
| `/api/feeds/:id` | DELETE | ✅ Yes |
| `/api/posts/:id/read` | POST | ✅ Yes |
| `/api/feeds/:id` | GET | ❌ No |
| `/api/posts` | GET | ❌ No |

### Exempt Endpoints

These endpoints **do not** require CSRF tokens:

| Endpoint | Method | Reason |
|----------|--------|--------|
| `/api/health` | GET | Public health check |
| `/api/webhooks/*` | POST | Authenticated via signature |

---

## Related Documentation

- **Design Document:** [docs/designs/csrf-protection.md](/Users/yujitsuchiya/catchup-feed-web/docs/designs/csrf-protection.md)
- **Task Plan:** [docs/plans/csrf-protection-tasks.md](/Users/yujitsuchiya/catchup-feed-web/docs/plans/csrf-protection-tasks.md)
- **Source Code:**
  - Server: [src/lib/security/csrf.ts](/Users/yujitsuchiya/catchup-feed-web/src/lib/security/csrf.ts)
  - Client: [src/lib/security/CsrfTokenManager.ts](/Users/yujitsuchiya/catchup-feed-web/src/lib/security/CsrfTokenManager.ts)
  - Middleware: [src/middleware.ts](/Users/yujitsuchiya/catchup-feed-web/src/middleware.ts)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-23 | Initial API documentation |

---

**Security Note:** This CSRF protection implementation follows OWASP recommendations and uses industry-standard patterns. However, security is an ongoing process. Always keep dependencies updated and review security best practices regularly.
