/**
 * User Role Utilities
 *
 * Provides functions for extracting and checking user roles from JWT tokens.
 * Roles are used for authorization and UI conditional rendering.
 */

import { getAuthToken, decodeJWTPayload } from '@/lib/auth/token';

/**
 * User role type
 *
 * - 'admin': Full access to all features including source management
 * - 'user': Standard user with read-only access
 * - null: No valid role (e.g., unauthenticated or invalid token)
 */
export type UserRole = 'admin' | 'user' | null;

/**
 * Extract user role from JWT token
 *
 * @returns The user's role ('admin', 'user', or null)
 *
 * @remarks
 * - Returns null if token is missing or invalid
 * - Defaults to 'user' if token is valid but role field is missing
 * - Frontend role check is for UI convenience ONLY
 * - Backend MUST enforce authorization
 *
 * @example
 * ```typescript
 * const role = getUserRole();
 * if (role === 'admin') {
 *   // Show admin controls
 * }
 * ```
 */
export function getUserRole(): UserRole {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const payload = decodeJWTPayload(token);
  if (!payload) {
    return null;
  }

  // Extract role from JWT payload
  // Default to 'user' if role field is missing (fail-safe)
  const role = payload.role as string | undefined;

  if (role === 'admin') {
    return 'admin';
  }

  if (role === 'user') {
    return 'user';
  }

  // Default to 'user' for any other value or missing role
  return 'user';
}

/**
 * Check if the current user has admin role
 *
 * @returns True if user has admin role, false otherwise
 *
 * @remarks
 * - Returns false if token is missing or invalid
 * - Frontend check for UI convenience ONLY
 * - Backend MUST enforce authorization
 *
 * @example
 * ```typescript
 * if (isAdmin()) {
 *   // Render admin-only UI
 * }
 * ```
 */
export function isAdmin(): boolean {
  return getUserRole() === 'admin';
}
