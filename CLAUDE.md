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
- **スタイリング**: Tailwind CSS or CSS Modules
- **認証**: Firebase Auth (Email/Password)
- **データベース**: Firestore
- **ストレージ**: Firebase Storage
- **ホスティング**: Cloudflare Pages
- **パッケージ管理**: npm
- **エラーハンドリング**: neverthrow

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
├── lib/                   # ユーティリティ・設定
│   ├── firebase/         # Firebase設定・ヘルパー
│   ├── errors/           # エラー定義
│   └── utils/            # 共通ユーティリティ
├── types/                # TypeScript型定義
├── hooks/                # カスタムフック
├── stories/              # Storybook
├── tests/                # テストファイル
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/               # 静的ファイル
```

## Workflow: Explore, Plan, Code, Commit

- **Step 1: Explore**
    - Ask Claude to read relevant files, images, or URLs  
    - Use explicit file references or general pointers 
    - Consider using subagents for complex problems to verify details

- **Step 2: Plan**
    - Use "think" modes to trigger extended thinking
        - "think" < "think hard" < "think harder" < "ultrathink"
    - Create a document or GitHub issue to document the plan
    - Allows resetting to planning stage if implementation differs

- **Step 3: Code**
    - Implement solution based on plan
    - Verify reasonableness of solution during implementation

- **Step 4: Commit**
    - Commit the result
    - Create pull request
    - Update READMEs or changelogs if relevant

**Note:** Steps 1-2 are crucial for improving solution quality, preventing premature coding

-「コミット」と一言指定された場合は以下の処理を実行
  - 現在がdevブランチの場合は、そのままコミットするか、作業用ブランチを作成するかユーザーに問い合わせてください。
    - 新しいブランチを作る選択をした場合は適切なブランチ名を付けてブランチを作成し、以下の作業はそのブランチに対して実行してください
  - 現在の差分を適切に分割し、それぞれ過不足無くメッセージを付けてコミットしてください
    - .gitignoreに記載されていないが、不要と思われるファイルが変更されている場合はユーザーに確認してください
    - fs_exportなどのfirestore emulatorのimportファイル、package-lock.jsonについては.gitignoreには記述せず、コミットから除外してください

-「作業開始」と一言指定された場合は以下の処理を実行
  - ローカルのブランチを全て最新にしてください
  - 現在のブランチをユーザーに提示してください。その際devブランチの場合は注意を促してください

## 開発環境のセットアップ

### 前提条件
- Node.js 18.x以上
- npm 9.x以上
- Firebaseプロジェクト（開発用・本番用）

### 環境変数設定

`.env.local` (開発環境):
```env
# Firebase - Development
NEXT_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-dev-app-id

# App Config
NEXT_PUBLIC_ENVIRONMENT=development
```

`.env.production` (本番環境):
```env
# Firebase - Production
NEXT_PUBLIC_FIREBASE_API_KEY=your-prod-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-prod-app-id

# App Config
NEXT_PUBLIC_ENVIRONMENT=production
```

### 初期セットアップ
```bash
# リポジトリのクローン
git clone [repository-url]
cd iteteno-suke

# 依存関係のインストール
npm install

# Firebase CLIのインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseログイン
firebase login

# 開発環境の起動
npm run dev
```

### Firebase設定

1. **Firebaseプロジェクトの作成**
   - 開発用: `iteteno-suke-dev`
   - 本番用: `iteteno-suke-prod`

2. **Authentication設定**
   - Email/Password認証を有効化

3. **Firestore設定**
   - セキュリティルール（`firestore.rules`）:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // ユーザーは自分のデータのみアクセス可能
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Storage設定**
   - セキュリティルール（`storage.rules`）:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /users/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId
           && request.resource.size < 2 * 1024 * 1024  // 2MB制限
           && request.resource.contentType.matches('image/.*');
       }
     }
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

// 使用例: lib/firebase/painLogs.ts
import { Result, ok, err, fromAsyncThrowable } from 'neverthrow';

export async function createPainLog(
  userId: string,
  data: PainLogInput
): Promise<Result<PainLog, AppError>> {
  const firebaseCreate = fromAsyncThrowable(
    async () => {
      // Firestore操作
      const docRef = await addDoc(collection(db, `users/${userId}/painLogs`), data);
      return { id: docRef.id, ...data };
    },
    (error) => ({
      code: ErrorCode.FIREBASE_ERROR,
      message: 'Failed to create pain log',
      details: error,
    })
  );

  const result = await firebaseCreate();
  
  if (result.isOk()) {
    logger.info(`Pain log created for user ${userId}`);
    return ok(result.value);
  } else {
    logger.error('Failed to create pain log', result.error);
    return err(result.error);
  }
}
```

### データ型定義

```typescript
// types/index.ts
export type PainLevel = 1 | 2 | 3 | 4;

export interface PainLog {
  id: string;
  painLevel: PainLevel;
  medicineIds: string[];  // 最大5個
  painAreaIds: string[];  // 最大5個
  memo: string;          // 最大250文字
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PainArea {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PainImage {
  id: string;
  url: string;
  uploadedAt: string;
  painLogId: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}
```

### ログ戦略

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// 構造化ログ
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, { timestamp: new Date().toISOString(), ...meta });
  },
  error: (message: string, error: unknown, meta?: Record<string, unknown>) => {
    logger.error(message, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    });
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, { timestamp: new Date().toISOString(), ...meta });
  },
};
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

### コンポーネント開発パターン

```typescript
// components/features/PainLogForm.tsx
'use client';

import { useState } from 'react';
import { Result } from 'neverthrow';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/logger';

interface PainLogFormProps {
  userId: string;
  medicines: Medicine[];
  painAreas: PainArea[];
  onSubmit?: (data: PainLogInput) => Promise<Result<PainLog, AppError>>;
}

export function PainLogForm({ userId, medicines, painAreas, onSubmit }: PainLogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PainLogInput>({
    painLevel: 1,
    medicineIds: [],
    painAreaIds: [],
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onSubmit?.(formData);
      
      if (result?.isOk()) {
        log.info('Pain log created successfully', { userId });
        router.push('/dashboard');
      } else if (result?.isErr()) {
        log.error('Failed to create pain log', result.error);
        // エラー表示処理
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // フォームUI実装...
}
```

### テスト戦略

1. **単体テスト** (Vitest):
```typescript
// tests/unit/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validatePainLog } from '@/lib/validation';

describe('validatePainLog', () => {
  it('should accept valid pain log data', () => {
    const result = validatePainLog({
      painLevel: 3,
      medicineIds: ['med1', 'med2'],
      painAreaIds: ['area1'],
      memo: 'Test memo',
    });
    
    expect(result.isOk()).toBe(true);
  });

  it('should reject more than 5 medicines', () => {
    const result = validatePainLog({
      painLevel: 2,
      medicineIds: ['1', '2', '3', '4', '5', '6'],
      painAreaIds: [],
      memo: '',
    });
    
    expect(result.isErr()).toBe(true);
  });
});
```

2. **統合テスト** (React Testing Library):
```typescript
// tests/integration/PainLogForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PainLogForm } from '@/components/features/PainLogForm';

describe('PainLogForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(ok({ id: '123' }));
    
    render(
      <PainLogForm
        userId="user123"
        medicines={[]}
        painAreas={[]}
        onSubmit={mockSubmit}
      />
    );
    
    // テスト実装...
  });
});
```

3. **E2Eテスト** (Playwright):
```typescript
// tests/e2e/pain-log-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Pain Log Flow', () => {
  test('should create new pain log', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 新規記録作成
    await page.goto('/pain-log/new');
    await page.click('[data-pain-level="3"]');
    await page.fill('[name="memo"]', 'Test pain log');
    await page.click('button[type="submit"]');
    
    // 確認
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## デプロイメント

### Cloudflare Pages設定

1. **ビルド設定**:
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `.next`
   - Node.jsバージョン: 18.x

2. **環境変数**:
   - Cloudflare Pagesダッシュボードで本番用環境変数を設定

3. **自動デプロイ**:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Cloudflare Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run test
         - run: npm run build
         - uses: cloudflare/pages-action@v1
           with:
             apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
             projectName: iteteno-suke
             directory: .next
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
  { revalidate: 60 } // 60秒キャッシュ
);
```

## トラブルシューティング

### よくある問題と対処法

1. **Firebase認証エラー**
   - 環境変数が正しく設定されているか確認
   - Firebase Authの設定でメール認証が有効になっているか確認

2. **画像アップロードエラー**
   - ファイルサイズが2MB以下か確認
   - Storage セキュリティルールを確認
   - CORS設定を確認

3. **ビルドエラー**
   - `npm run type-check` で型エラーを確認
   - 環境変数がすべて設定されているか確認

### デバッグコマンド

```bash
# 型チェック
npm run type-check

# Lintチェック
npm run lint

# テスト実行
npm run test        # 単体テスト
npm run test:e2e    # E2Eテスト

# Storybookの起動
npm run storybook

# Firebase エミュレータ
npm run firebase:emulators
```

## セキュリティ考慮事項

1. **認証・認可**
   - すべてのAPIリクエストでユーザー認証を確認
   - ユーザーは自分のデータのみアクセス可能

2. **入力検証**
   - クライアント側とサーバー側の両方で検証
   - XSS対策（React のデフォルトエスケープ）

3. **データ保護**
   - HTTPS通信の強制
   - 個人情報の最小限の収集

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
