import { ErrorCode } from '@/lib/errors';
import { validateEmail, validateLoginCredentials, validatePassword } from '@/lib/utils/validation';
import { describe, expect, it } from 'vitest';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'firstname+lastname@company.org',
        'test123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'test@',
        'test.domain.com',
        'test @domain.com',
        'test@domain',
        '',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        '123456',
        'very-long-password-with-special-chars!@#',
        'パスワード123', // Japanese characters
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result).toBe(true);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['12345', 'a', '', '1a3'];

      shortPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result).toBe(false);
      });
    });

    it('should reject undefined or null passwords', () => {
      const result1 = validatePassword(undefined as any);
      const result2 = validatePassword(null as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('validateLoginCredentials', () => {
    it('should accept valid login credentials', () => {
      const result = validateLoginCredentials({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.isOk()).toBe(true);
    });

    it('should reject credentials with invalid email', () => {
      const result = validateLoginCredentials({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('メールアドレス');
      }
    });

    it('should reject credentials with empty password', () => {
      const result = validateLoginCredentials({
        email: 'test@example.com',
        password: '',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('パスワード');
      }
    });

    it('should reject credentials with both invalid email and password', () => {
      const result = validateLoginCredentials({
        email: 'invalid-email',
        password: '',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });

    it('should handle empty email', () => {
      const result = validateLoginCredentials({
        email: '',
        password: 'password123',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });
  });
});
