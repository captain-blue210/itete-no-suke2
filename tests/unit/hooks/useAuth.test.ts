import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';

vi.mock('firebase/auth');

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should set user when authenticated', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };

    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // Simulate async auth state change
      setTimeout(() => callback(mockUser as any), 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // After auth state change
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should set user to null when not authenticated', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});