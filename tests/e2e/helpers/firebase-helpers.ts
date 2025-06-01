import { Page } from '@playwright/test';

// Firebase v9関連の型定義
declare global {
  interface Window {
    __FIREBASE_APPS__?: any[];
    __FIREBASE_AUTH__?: any;
    __FIREBASE_FIRESTORE__?: any;
  }
}

export async function waitForFirebaseReady(page: Page) {
  // ページの基本的な読み込み完了を待機
  await page.waitForLoadState('networkidle');

  // 少し待機してからページの状態を確認
  await page.waitForTimeout(1000);
}

export async function clearFirebaseAuth(page: Page) {
  // Firebase v9での認証状態クリア
  await page.evaluate(async () => {
    try {
      // Firebase v9のsignOut関数を呼び出し
      const { signOut, getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.log('Auth clear skipped:', error);
    }
  });
}

export async function waitForEmulatorReady(page: Page) {
  // Firebase Emulator接続確認
  await page.waitForFunction(
    () => {
      // Emulator環境では特定の設定が存在することを確認
      return (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      );
    },
    { timeout: 5000 }
  );
}

export async function waitForPageReady(page: Page) {
  // ページの基本的な読み込み完了を待機
  await page.waitForLoadState('networkidle');

  // React/Next.jsアプリケーションの初期化完了を待機
  await page.waitForFunction(
    () => {
      return typeof window !== 'undefined' && document.readyState === 'complete';
    },
    { timeout: 10000 }
  );
}
