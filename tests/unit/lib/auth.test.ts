import { ErrorCode } from '@/lib/errors';
import { loginUser, logoutUser } from '@/lib/firebase/auth';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');

describe('Authentication functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should return success result on valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const mockUserDoc = {
        id: 'test-uid',
        email: 'test@example.com',
        createdAt: '2023-01-01T00:00:00.000Z',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserDoc,
      } as any);

      const result = await loginUser({ email: 'test@example.com', password: 'password123' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe('test-uid');
        expect(result.value.email).toBe('test@example.com');
      }
    });

    it('should return error result on invalid credentials', async () => {
      const firebaseError = new Error('auth/wrong-password');
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(firebaseError);

      const result = await loginUser({ email: 'test@example.com', password: 'wrongpassword' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.FIREBASE_ERROR);
        expect(result.error.message).toContain('ログインに失敗しました');
      }
    });

    it('should handle Firebase auth/invalid-email error', async () => {
      const firebaseError = { code: 'auth/invalid-email', message: 'Invalid email' };
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(firebaseError);

      const result = await loginUser({ email: 'invalid-email', password: 'password123' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.INVALID_EMAIL);
        expect(result.error.message).toContain('メールアドレスの形式が正しくありません');
      }
    });

    it('should handle Firebase auth/weak-password error', async () => {
      const firebaseError = { code: 'auth/weak-password', message: 'Weak password' };
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(firebaseError);

      const result = await loginUser({ email: 'test@example.com', password: '123' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.WEAK_PASSWORD);
        expect(result.error.message).toContain('パスワードは6文字以上で入力してください');
      }
    });
  });

  describe('logoutUser', () => {
    it('should return success result on successful sign out', async () => {
      vi.mocked(signOut).mockResolvedValue();

      const result = await logoutUser();

      expect(result.isOk()).toBe(true);
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('should return error result on sign out failure', async () => {
      const firebaseError = new Error('Firebase sign out error');
      vi.mocked(signOut).mockRejectedValue(firebaseError);

      const result = await logoutUser();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ErrorCode.FIREBASE_ERROR);
        expect(result.error.message).toContain('ログアウトに失敗しました');
      }
    });
  });
});
