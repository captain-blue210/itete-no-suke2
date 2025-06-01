'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserDocument } from '@/lib/firebase/auth';
import { User } from '@/types';
import { log } from '@/lib/logger';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // 追加のメソッドがある場合はここに定義
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firebaseユーザーが存在する場合、アプリ用ユーザー情報を取得
        const userResult = await getUserDocument(firebaseUser.uid);
        
        if (userResult.isOk()) {
          setAuthState({
            user: userResult.value,
            loading: false,
            error: null,
          });
          log.info('Auth state updated: user logged in', { userId: firebaseUser.uid });
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: userResult.error.message,
          });
          log.error('Failed to get user document', userResult.error);
        }
      } else {
        // ユーザーがログアウトしている
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        log.info('Auth state updated: user logged out');
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
}