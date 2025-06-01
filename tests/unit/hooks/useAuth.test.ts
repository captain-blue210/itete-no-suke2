import { useAuth } from '@/hooks/useAuth';
import { getUserDocument } from '@/lib/firebase/auth';
import { act, renderHook } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { ok } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth');
vi.mock('@/lib/firebase/auth');

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should set user when authenticated', async () => {
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };

    const mockAppUser = {
      id: 'test-uid',
      email: 'test@example.com',
      createdAt: '2023-01-01T00:00:00.000Z',
    };

    const mockUnsubscribe = vi.fn();
    let authCallback: any;

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      authCallback = callback;
      return mockUnsubscribe;
    });

    vi.mocked(getUserDocument).mockResolvedValue(ok(mockAppUser));

    const { result } = renderHook(() => useAuth());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // Trigger auth state change
    await act(async () => {
      if (authCallback && typeof authCallback === 'function') {
        await authCallback(mockFirebaseUser);
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockAppUser);
  });

  it('should set user to null when not authenticated', async () => {
    const mockUnsubscribe = vi.fn();
    let authCallback: any;

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      authCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth());

    // Trigger auth state change with null user
    await act(async () => {
      if (authCallback && typeof authCallback === 'function') {
        await authCallback(null);
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      return mockUnsubscribe;
    });

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
