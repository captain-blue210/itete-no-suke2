import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { signIn, signOutUser } from '@/lib/auth';
import { ErrorCode } from '@/lib/errors';

vi.mock('firebase/auth');

describe('Authentication functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return success result on valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const result = await signIn('test@example.com', 'password123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.uid).toBe('test-uid');
        expect(result.value.email).toBe('test@example.com');
      }
    });

    it('should return error result on invalid credentials', async () => {
      const firebaseError = new Error('auth/wrong-password');
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(firebaseError);

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.FIREBASE_ERROR);
        expect(result.error.message).toContain('Failed to sign in');
      }
    });

    it('should validate email format', async () => {
      const result = await signIn('invalid-email', 'password123');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('Invalid email format');
      }
    });

    it('should validate password length', async () => {
      const result = await signIn('test@example.com', '123');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toContain('Password must be at least 6 characters');
      }
    });
  });

  describe('signOutUser', () => {
    it('should return success result on successful sign out', async () => {
      vi.mocked(signOut).mockResolvedValue();

      const result = await signOutUser();

      expect(result.isOk()).toBe(true);
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('should return error result on sign out failure', async () => {
      const firebaseError = new Error('Firebase sign out error');
      vi.mocked(signOut).mockRejectedValue(firebaseError);

      const result = await signOutUser();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.FIREBASE_ERROR);
        expect(result.error.message).toContain('Failed to sign out');
      }
    });
  });
});