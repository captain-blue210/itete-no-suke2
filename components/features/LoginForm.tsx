'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginUser } from '@/lib/firebase/auth';
import { log } from '@/lib/logger';
import { validateLoginCredentials } from '@/lib/utils/validation';
import { LoginCredentials } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSubmit?: (email: string, password: string) => Promise<any>;
}

export function LoginForm({ onSuccess, onSubmit }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  // エラーメッセージを日本語に変換
  const translateErrorMessage = (message: string): string => {
    if (message === 'Invalid credentials') {
      return 'メールアドレスまたはパスワードが正しくありません';
    }
    if (message === 'Network error') {
      return 'ネットワークエラーが発生しました';
    }
    // バリデーションエラーメッセージは既に日本語なのでそのまま返す
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError('');

    try {
      // バリデーション
      const validationResult = validateLoginCredentials(formData);

      if (validationResult.isErr()) {
        setGeneralError(translateErrorMessage(validationResult.error.message));
        setIsSubmitting(false);
        return;
      }

      // テスト用のonSubmitが提供されている場合はそれを使用
      if (onSubmit) {
        const result = await onSubmit(formData.email, formData.password);

        if (result.isOk()) {
          log.info('Login successful via onSubmit');
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/dashboard');
          }
        } else {
          setGeneralError(translateErrorMessage(result.error.message));
          log.error('Login failed via onSubmit', result.error);
        }
      } else {
        // 通常のログイン処理
        const result = await loginUser(formData);

        if (result.isOk()) {
          log.info('Login successful', { userId: result.value.id });

          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/dashboard');
          }
        } else {
          setGeneralError(translateErrorMessage(result.error.message));
          log.error('Login failed', result.error);
        }
      }
    } catch (error) {
      setGeneralError('予期しないエラーが発生しました');
      log.error('Unexpected error during login', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">ログイン</h1>

        <form onSubmit={handleSubmit} className="space-y-4" role="form" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              error={errors.email}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="パスワードを入力"
              error={errors.password}
              required
            />
          </div>

          {generalError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない場合は{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              新規登録
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
