# 「should handle login with invalid credentials」テストエラー修正計画

## 問題の概要

### 現在の問題

- テストは「メールアドレスまたはパスワードが正しくありません」メッセージを期待
- 実際には「Firebase: Error (auth/configuration-not-found).」が表示されている
- Firebase Emulatorの設定問題とエラーハンドリングの不備が原因

### 根本原因分析

1. **Firebase Emulator未設定**: `firebase.json`が存在せず、E2Eテスト環境でFirebase Emulatorが動作していない
2. **エラーハンドリング不備**: `lib/firebase/auth.ts`の`mapFirebaseAuthError`関数に`auth/configuration-not-found`ケースが未対応
3. **テスト環境設定不備**: E2EテストでFirebase設定が本番環境を参照している可能性

## 修正計画（Test First原則）

### Phase 1: Firebase Emulator環境構築（最優先）

#### 1.1 Firebase設定ファイル作成

**ファイル: `firebase.json`**

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**ファイル: `.firebaserc`**

```json
{
  "projects": {
    "default": "itete-no-suke-test"
  }
}
```

#### 1.2 テスト環境用Firebase設定

**ファイル: `lib/firebase/test-config.ts`**

```typescript
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { auth, db, storage } from './config';

// テスト環境またはEmulator使用時の設定
if (
  process.env.NODE_ENV === 'test' ||
  process.env.USE_FIREBASE_EMULATOR === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
) {
  try {
    // 既に接続されていない場合のみ接続
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    // Emulator接続エラーは開発時のみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase Emulator connection failed:', error);
    }
  }
}
```

**ファイル: `lib/firebase/config.ts`（更新）**

```typescript
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// テスト環境設定を読み込み
if (typeof window !== 'undefined') {
  import('./test-config');
}

export default app;
```

### Phase 2: エラーハンドリング強化

#### 2.1 mapFirebaseAuthError関数拡張

**ファイル: `lib/firebase/auth.ts`（更新）**

```typescript
// Firebase認証エラーをAppErrorに変換
function mapFirebaseAuthError(error: AuthError): AppError {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-disabled':
      return createError(
        ErrorCode.INVALID_CREDENTIALS,
        'メールアドレスまたはパスワードが正しくありません'
      );
    case 'auth/invalid-email':
      return createError(ErrorCode.INVALID_EMAIL, 'メールアドレスの形式が正しくありません');
    case 'auth/email-already-in-use':
      return createError(
        ErrorCode.EMAIL_ALREADY_IN_USE,
        'このメールアドレスは既に使用されています'
      );
    case 'auth/weak-password':
      return createError(ErrorCode.WEAK_PASSWORD, 'パスワードは6文字以上で入力してください');
    case 'auth/too-many-requests':
      return createError(ErrorCode.TOO_MANY_REQUESTS, 'しばらく時間をおいてから再試行してください');
    case 'auth/network-request-failed':
      return createError(ErrorCode.NETWORK_ERROR, 'ネットワークエラーが発生しました');
    case 'auth/configuration-not-found':
      return createError(
        ErrorCode.FIREBASE_ERROR,
        'Firebase設定が見つかりません。管理者にお問い合わせください'
      );
    case 'auth/app-not-authorized':
      return createError(ErrorCode.FIREBASE_ERROR, 'アプリケーションが認証されていません');
    default:
      // ネットワークエラーの場合の特別処理
      if (error.message === 'Network error') {
        return createError(ErrorCode.NETWORK_ERROR, 'ネットワークエラーが発生しました');
      }
      return createError(ErrorCode.FIREBASE_ERROR, error.message, { code: error.code });
  }
}
```

### Phase 3: E2Eテスト環境整備

#### 3.1 Playwright設定更新

**ファイル: `playwright.config.ts`（更新）**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'firebase emulators:start --only auth,firestore,storage',
      port: 9099,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      env: {
        USE_FIREBASE_EMULATOR: 'true',
        NODE_ENV: 'test',
      },
    },
  ],
});
```

#### 3.2 グローバルセットアップ・ティアダウン

**ファイル: `tests/e2e/global-setup.ts`**

```typescript
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup: Firebase Emulator確認中...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Firebase Emulator UI確認
    await page.goto('http://localhost:4000', { timeout: 30000 });
    console.log('✅ Firebase Emulator UI確認完了');

    // Auth Emulator確認
    const response = await page.request.get('http://localhost:9099');
    if (response.ok()) {
      console.log('✅ Firebase Auth Emulator確認完了');
    }
  } catch (error) {
    console.error('❌ Firebase Emulator確認失敗:', error);
    throw new Error('Firebase Emulatorが起動していません');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
```

**ファイル: `tests/e2e/global-teardown.ts`**

```typescript
async function globalTeardown() {
  console.log('🧹 E2E Global Teardown: クリーンアップ完了');
}

export default globalTeardown;
```

#### 3.3 テストヘルパー関数

**ファイル: `tests/e2e/helpers/firebase-helpers.ts`**

```typescript
import { Page } from '@playwright/test';

export async function waitForFirebaseReady(page: Page) {
  // Firebase初期化完了まで待機
  await page.waitForFunction(
    () => {
      return window.firebase && window.firebase.auth;
    },
    { timeout: 10000 }
  );
}

export async function clearFirebaseAuth(page: Page) {
  // 認証状態をクリア
  await page.evaluate(() => {
    if (window.firebase && window.firebase.auth) {
      return window.firebase.auth().signOut();
    }
  });
}
```

### Phase 4: テスト修正・強化

#### 4.1 ログインフローテスト更新

**ファイル: `tests/e2e/auth/login-flow.spec.ts`（更新）**

```typescript
import { test, expect } from '@playwright/test';
import { waitForFirebaseReady, clearFirebaseAuth } from '../helpers/firebase-helpers';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Firebase Emulator準備完了まで待機
    await waitForFirebaseReady(page);
    await clearFirebaseAuth(page);
    await page.goto('/login');
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // 無効な認証情報でログイン試行
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 適切なエラーメッセージが表示されることを確認
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/)).toBeVisible({
      timeout: 10000,
    });

    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login');

    // フォームが再入力可能な状態であることを確認
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeEnabled();
  });

  // 他のテストケースも同様に更新...
});
```

### Phase 5: パッケージスクリプト更新

#### 5.1 package.json更新

**ファイル: `package.json`（scripts部分更新）**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run tests/integration",
    "test:unit": "vitest run tests/unit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "firebase:emulators": "firebase emulators:start",
    "firebase:emulators:test": "firebase emulators:start --only auth,firestore,storage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## 実装手順

### Step 1: Firebase Emulator設定（優先度: 最高）

1. ✅ `firebase.json`作成
2. ✅ `.firebaserc`作成
3. ✅ `lib/firebase/test-config.ts`作成
4. ✅ `lib/firebase/config.ts`更新

### Step 2: エラーハンドリング修正（優先度: 高）

1. ✅ `lib/firebase/auth.ts`の`mapFirebaseAuthError`関数更新
2. ✅ 新しいエラーケース追加

### Step 3: テスト環境整備（優先度: 高）

1. ✅ `playwright.config.ts`更新
2. ✅ `tests/e2e/global-setup.ts`作成
3. ✅ `tests/e2e/global-teardown.ts`作成
4. ✅ `tests/e2e/helpers/firebase-helpers.ts`作成

### Step 4: テスト修正・検証（優先度: 中）

1. ✅ `tests/e2e/auth/login-flow.spec.ts`更新
2. ⏳ テスト実行・検証
3. ⏳ 他のE2Eテストの動作確認

### Step 5: 最終確認（優先度: 中）

1. ⏳ `package.json`スクリプト更新
2. ⏳ 全テスト実行確認
3. ⏳ ドキュメント更新

## 使用技術・ライブラリ

- **Firebase Local Emulator Suite**: 認証・Firestore・Storageのローカル環境
- **Playwright**: E2Eテスト実行・ブラウザ自動化
- **neverthrow**: 関数型エラーハンドリング
- **Next.js**: React フレームワーク
- **TypeScript**: 型安全性確保

## 期待される成果

### 1. テスト安定性向上

- Firebase Emulator使用により一貫したテスト環境
- 外部依存を排除した高速テスト実行
- CI/CD環境での安定動作

### 2. エラーハンドリング改善

- 適切な日本語エラーメッセージ表示
- ユーザーフレンドリーなエラー体験
- 開発者向けデバッグ情報の充実

### 3. 開発効率向上

- ローカル環境での完全なテスト実行
- 本番環境に影響しないテスト環境
- 高速なフィードバックループ

### 4. 保守性向上

- 明確なエラー分類とハンドリング
- テスト環境の標準化
- 将来的な機能追加への対応力向上

## リスク管理

### 潜在的リスク

1. **Firebase Emulator起動失敗**: ポート競合やFirebase CLI問題
2. **既存テストへの影響**: 設定変更による他テストの動作不良
3. **パフォーマンス影響**: Emulator起動時間によるテスト実行時間増加

### 対策

1. **段階的実装**: Phase毎の動作確認
2. **ロールバック準備**: 各段階でのバックアップ
3. **詳細ログ**: 問題特定のための十分なログ出力

---

**最終更新**: 2025年6月1日  
**作成者**: Roo (Architect Mode)  
**レビュー状況**: 実装前計画書
