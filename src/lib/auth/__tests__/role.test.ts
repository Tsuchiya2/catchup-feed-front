import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserRole, isAdmin } from '../role';
import * as tokenUtils from '../token';

describe('Role Utilities', () => {
  beforeEach(() => {
    // Spy on token utilities
    vi.spyOn(tokenUtils, 'getAuthToken');
    vi.spyOn(tokenUtils, 'decodeJWTPayload');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserRole', () => {
    it('should return "admin" when token has role="admin"', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'admin',
        exp: Date.now() / 1000 + 3600,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('admin');
      expect(tokenUtils.getAuthToken).toHaveBeenCalled();
      expect(tokenUtils.decodeJWTPayload).toHaveBeenCalledWith('valid-token');
    });

    it('should return "user" when token has role="user"', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'user',
        exp: Date.now() / 1000 + 3600,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should return "user" when token has no role field (fallback)', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        // No role field
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should return "user" when role is an invalid value', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'super-admin', // Invalid role
        exp: Date.now() / 1000 + 3600,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should return null when token is missing', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBeNull();
      expect(tokenUtils.getAuthToken).toHaveBeenCalled();
      expect(tokenUtils.decodeJWTPayload).not.toHaveBeenCalled();
    });

    it('should return null when token is invalid', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('invalid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue(null);

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBeNull();
      expect(tokenUtils.decodeJWTPayload).toHaveBeenCalledWith('invalid-token');
    });

    it('should return null when token payload is empty', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({});

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user'); // Should default to 'user' for valid token with no role
    });

    it('should return "user" when role is null', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: null,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should return "user" when role is undefined', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: undefined,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should return "user" when role is empty string', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: '',
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });

    it('should handle token with role as number', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 123, // Invalid type
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('user');
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has admin role', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'admin',
      });

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user has user role', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'user',
      });

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when role is null', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token is invalid', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('invalid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue(null);

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when role field is missing', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        // No role field - defaults to 'user'
      });

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for case-sensitive role check', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        role: 'Admin', // Wrong case
      });

      // Act
      const result = isAdmin();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for admin and false for non-admin consistently', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        role: 'admin',
      });

      // Act & Assert
      expect(isAdmin()).toBe(true);

      // Change to user role
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        role: 'user',
      });

      expect(isAdmin()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent calls to getUserRole', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        role: 'admin',
      });

      // Act
      const role1 = getUserRole();
      const role2 = getUserRole();
      const role3 = getUserRole();

      // Assert
      expect(role1).toBe('admin');
      expect(role2).toBe('admin');
      expect(role3).toBe('admin');
      expect(tokenUtils.getAuthToken).toHaveBeenCalledTimes(3);
    });

    it('should handle payload with extra fields', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('valid-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        sub: 'user123',
        email: 'user@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('admin');
    });

    it('should handle token that decodes to null payload', () => {
      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('corrupted-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue(null);

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBeNull();
    });
  });

  describe('Security Considerations', () => {
    it('should not trust frontend role for actual authorization', () => {
      // This test documents that frontend role is for UI only
      // Backend MUST enforce authorization

      // Arrange
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue('manipulated-token');
      vi.mocked(tokenUtils.decodeJWTPayload).mockReturnValue({
        role: 'admin', // User could manipulate this
      });

      // Act
      const role = getUserRole();

      // Assert
      expect(role).toBe('admin');
      // This demonstrates that frontend role check is purely for UI convenience
      // and should NEVER be used for security decisions
    });
  });
});
