import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateLoginForm } from '@/lib/validation';
import { ErrorCode } from '@/lib/errors';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'firstname+lastname@company.org',
        'test123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isOk()).toBe(true);
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

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        }
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

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isOk()).toBe(true);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['12345', 'a', '', '1a3'];

      shortPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
          expect(result.error.message).toContain('6文字以上');
        }
      });
    });

    it('should reject undefined or null passwords', () => {
      const result1 = validatePassword(undefined as any);
      const result2 = validatePassword(null as any);

      expect(result1.isErr()).toBe(true);
      expect(result2.isErr()).toBe(true);
    });
  });

  describe('validateLoginForm', () => {
    it('should accept valid login form data', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.isOk()).toBe(true);
    });

    it('should reject form data with invalid email', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('メールアドレス');
      }
    });

    it('should reject form data with invalid password', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: '123',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('パスワード');
      }
    });

    it('should reject form data with both invalid email and password', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: '123',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });

    it('should handle empty form data', () => {
      const result = validateLoginForm({
        email: '',
        password: '',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });
  });
});