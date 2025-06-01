import { Result, ok, err } from 'neverthrow';
import { LoginCredentials, RegisterCredentials } from '@/types';
import { AppError, ErrorCode, createError } from '@/lib/errors';

// メールアドレスの形式をチェック
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// パスワードの強度をチェック
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// ログイン情報の検証
export function validateLoginCredentials(credentials: LoginCredentials): Result<LoginCredentials, AppError> {
  const { email, password } = credentials;

  if (!email.trim()) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'メールアドレスを入力してください'));
  }

  if (!validateEmail(email)) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'メールアドレスの形式が正しくありません'));
  }

  if (!password) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'パスワードを入力してください'));
  }

  return ok(credentials);
}

// 登録情報の検証
export function validateRegisterCredentials(credentials: RegisterCredentials): Result<RegisterCredentials, AppError> {
  const { email, password, confirmPassword } = credentials;

  if (!email.trim()) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'メールアドレスを入力してください'));
  }

  if (!validateEmail(email)) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'メールアドレスの形式が正しくありません'));
  }

  if (!password) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'パスワードを入力してください'));
  }

  if (!validatePassword(password)) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'パスワードは6文字以上で入力してください'));
  }

  if (password !== confirmPassword) {
    return err(createError(ErrorCode.VALIDATION_ERROR, 'パスワードが一致しません'));
  }

  return ok(credentials);
}