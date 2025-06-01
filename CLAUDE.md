# いててのすけ（痛み記録Webアプリ）

## プロジェクト概要

「いててのすけ」は、日々の痛みを簡単に記録・管理できるスマートフォン向けWebアプリケーションです。医療知識のない一般ユーザーでも直感的に操作できるよう設計されています。

### 主な機能
- 痛みレベル（1-4段階）の記録
- 服用薬と痛む部位の選択記録（各最大5個）
- メモ記入（250文字以内）
- 画像アップロード（最大5枚/記録）
- 記録の一覧・詳細表示
- 薬・部位のカスタムマスタ管理

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js 14+ (App Router), TypeScript 5+
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Auth (Email/Password)
- **データベース**: Firestore
- **ストレージ**: Firebase Storage
- **パッケージ管理**: npm
- **エラーハンドリング**: neverthrow
- **開発・テスト**: Firebase Local Emulator Suite

### 設計原則

#### 1. Test First 開発（重要ルール）
**すべての実装はテストファーストで行う**
- 新機能開発前に必ずテストケースを作成
- 失敗するテストを確認してから実装開始
- リファクタリング時もテストが通ることを確認
- テストが書きにくい設計は見直す

#### 2. 関数型ドメインモデリング
- ドメインロジックを純粋関数として表現
- 副作用（Firebase操作）とビジネスロジックを分離
- 型安全性を重視した設計
- Resultパターンでエラーハンドリング

```typescript
// ドメインモデル例
export type PainLevel = 1 | 2 | 3 | 4;

export interface PainLogData {
  readonly painLevel: PainLevel;
  readonly medicineIds: readonly string[];
  readonly painAreaIds: readonly string[];
  readonly memo: string;
  readonly createdAt: Date;
}

// 純粋関数としてのドメインロジック
export const createPainLog = (
  painLevel: PainLevel,
  medicineIds: string[],
  painAreaIds: string[],
  memo: string
): Result<PainLogData, ValidationError> => {
  return pipe(
    validatePainLevel(painLevel),
    andThen(() => validateMedicines(medicineIds)),
    andThen(() => validatePainAreas(painAreaIds)),
    andThen(() => validateMemo(memo)),
    map(() => ({
      painLevel,
      medicineIds: medicineIds as readonly string[],
      painAreaIds: painAreaIds as readonly string[],
      memo,
      createdAt: new Date(),
    }))
  );
};
```

### プロジェクト構造
```
iteteno-suke/
├── app/                     # Next.js App Router
│   ├── (auth)/             # 認証が必要なページ
│   │   ├── dashboard/
│   │   ├── pain-log/
│   │   ├── images/
│   │   └── settings/
│   ├── login/
│   └── layout.tsx
├── components/             # 共通コンポーネント
│   ├── ui/                # 基本UIコンポーネント
│   └── features/          # 機能別コンポーネント
├── domain/                # ドメインモデル・ロジック
│   ├── entities/         # エンティティ
│   ├── value-objects/    # 値オブジェクト
│   └── services/         # ドメインサービス
├── infrastructure/        # 外部システムとの接続
│   ├── firebase/         # Firebase操作
│   └── repositories/     # データアクセス層
├── lib/                   # ユーティリティ・設定
│   ├── errors/           # エラー定義
│   └── utils/            # 共通ユーティリティ
├── types/                # TypeScript型定義
├── hooks/                # カスタムフック
├── tests/                # テストファイル
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/               # 静的ファイル
```

## Firebase Local Emulator Suite の活用

### テスト環境構築
```bash
# Firebase エミュレータの設定
firebase init emulators

# エミュレータの起動
firebase emulators:start

# テスト実行時にエミュレータを使用
npm run test:integration  # 統合テストでエミュレータ使用
npm run test:e2e         # E2Eテストでエミュレータ使用
```

### エミュレータ設定例
```json
// firebase.json
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

### テスト用Firebase設定
```typescript
// lib/firebase/test-config.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

if (process.env.NODE_ENV === 'test') {
  // エミュレータに接続
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## 主要な技術的決定事項

### エラーハンドリング戦略

`neverthrow`を使用したResult型パターン:

```typescript
// lib/errors/index.ts
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// 使用例: infrastructure/repositories/painLogRepository.ts
import { Result, ok, err, fromAsyncThrowable } from 'neverthrow';

export async function savePainLog(
  userId: string,
  painLog: PainLogData
): Promise<Result<string, AppError>> {
  const firebaseCreate = fromAsyncThrowable(
    async () => {
      const docRef = await addDoc(
        collection(db, `users/${userId}/painLogs`), 
        painLog
      );
      return docRef.id;
    },
    (error) => ({
      code: ErrorCode.FIREBASE_ERROR,
      message: 'Failed to save pain log',
      details: error,
    })
  );

  return await firebaseCreate();
}
```

### データ型定義

```typescript
// domain/entities/index.ts
export type PainLevel = 1 | 2 | 3 | 4;

export interface PainLog {
  readonly id: string;
  readonly painLevel: PainLevel;
  readonly medicineIds: readonly string[];
  readonly painAreaIds: readonly string[];
  readonly memo: string;
  readonly createdAt: Date;
}

export interface Medicine {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
}

export interface PainArea {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}
```

## 開発ガイドライン

### コーディング規約

1. **Prettier設定** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

2. **TypeScript設定** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### テスト戦略

#### 1. 単体テスト（ドメインロジック）
```typescript
// tests/unit/domain/painLog.test.ts
import { describe, it, expect } from 'vitest';
import { createPainLog } from '@/domain/services/painLogService';

describe('createPainLog', () => {
  it('should create valid pain log', () => {
    const result = createPainLog(3, ['med1'], ['area1'], 'Test memo');
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.painLevel).toBe(3);
      expect(result.value.medicineIds).toEqual(['med1']);
    }
  });

  it('should reject invalid pain level', () => {
    const result = createPainLog(5 as any, [], [], '');
    
    expect(result.isErr()).toBe(true);
  });
});
```

#### 2. 統合テスト（Firebase Emulator使用）
```typescript
// tests/integration/painLogRepository.test.ts
import { beforeEach, describe, it, expect } from 'vitest';
import { savePainLog } from '@/infrastructure/repositories/painLogRepository';
import { clearFirestore } from './test-helpers';

describe('PainLog Repository', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  it('should save pain log to Firestore', async () => {
    const painLogData = {
      painLevel: 2 as const,
      medicineIds: ['med1'],
      painAreaIds: ['area1'],
      memo: 'Test',
      createdAt: new Date(),
    };

    const result = await savePainLog('user123', painLogData);
    
    expect(result.isOk()).toBe(true);
  });
});
```

#### 3. E2Eテスト（Playwright + Firebase Emulator）
```typescript
// tests/e2e/pain-log-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Pain Log Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Firebase Emulatorにテストデータをセットアップ
    await page.goto('/test-setup');
  });

  test('should create new pain log', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/pain-log/new');
    await page.click('[data-testid="pain-level-3"]');
    await page.fill('[data-testid="memo"]', 'Test pain log');
    await page.click('[data-testid="submit-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="pain-log-item"]')).toContainText('Test pain log');
  });
});
```

### コンポーネント開発パターン

```typescript
// components/features/PainLogForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPainLog } from '@/domain/services/painLogService';
import { savePainLog } from '@/infrastructure/repositories/painLogRepository';

interface PainLogFormProps {
  readonly userId: string;
  readonly medicines: readonly Medicine[];
  readonly painAreas: readonly PainArea[];
}

export function PainLogForm({ userId, medicines, painAreas }: PainLogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    painLevel: 1 as const,
    medicineIds: [] as string[],
    painAreaIds: [] as string[],
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ドメインロジックでバリデーション
      const painLogResult = createPainLog(
        formData.painLevel,
        formData.medicineIds,
        formData.painAreaIds,
        formData.memo
      );

      if (painLogResult.isErr()) {
        // バリデーションエラー処理
        return;
      }

      // リポジトリで永続化
      const saveResult = await savePainLog(userId, painLogResult.value);
      
      if (saveResult.isOk()) {
        router.push('/dashboard');
      } else {
        // 保存エラー処理
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // フォームUI実装...
  return (
    <form onSubmit={handleSubmit} data-testid="pain-log-form">
      {/* フォーム要素 */}
    </form>
  );
}
```

## セキュリティ考慮事項

### Firebase セキュリティルール

1. **Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && isValidPainLogData(resource.data);
    }
  }
  
  function isValidPainLogData(data) {
    return data.painLevel is int 
      && data.painLevel >= 1 
      && data.painLevel <= 4
      && data.medicineIds.size() <= 5
      && data.painAreaIds.size() <= 5
      && data.memo.size() <= 250;
  }
}
```

2. **Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/images/{imageId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 2 * 1024 * 1024  // 2MB制限
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## パフォーマンス最適化

### 画像最適化
- Next.js Image コンポーネントの使用
- アップロード時の画像圧縮（2MB制限）
- WebP形式への自動変換

### データ取得最適化
```typescript
// app/(auth)/dashboard/page.tsx
import { unstable_cache } from 'next/cache';

const getCachedPainLogs = unstable_cache(
  async (userId: string) => {
    const result = await getPainLogs(userId);
    return result.isOk() ? result.value : [];
  },
  ['pain-logs'],
  { revalidate: 60 }
);
```

## 今後の拡張計画

1. **Phase 1** (MVP)
   - 基本的な痛み記録機能
   - 画像アップロード
   - マスタ管理

2. **Phase 2**
   - グラフ表示機能
   - CSV エクスポート
   - PWA対応

3. **Phase 3**
   - 家族間での記録共有
   - リマインダー機能
   - 多言語対応

---

最終更新: 2025年6月
