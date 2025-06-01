import { AppError, ErrorCode, createError } from '@/lib/errors';
import { log } from '@/lib/logger';
import { LoginCredentials, RegisterCredentials, User } from '@/types';
import {
  AuthError,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Result, err, fromAsyncThrowable, ok } from 'neverthrow';
import { auth, db } from './config';

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

// Firebaseユーザーをアプリ用ユーザーに変換
async function createUserDocument(firebaseUser: FirebaseUser): Promise<Result<User, AppError>> {
  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    createdAt: new Date().toISOString(),
  };

  const createDoc = fromAsyncThrowable(
    async () => {
      await setDoc(doc(db, 'users', user.id), user);
      return user;
    },
    (error) => createError(ErrorCode.FIREBASE_ERROR, 'ユーザー情報の保存に失敗しました', error)
  );

  const result = await createDoc();

  if (result.isOk()) {
    log.info('User document created', { userId: user.id });
    return ok(result.value);
  } else {
    log.error('Failed to create user document', result.error);
    return err(result.error);
  }
}

// ユーザー情報を取得
export async function getUserDocument(userId: string): Promise<Result<User | null, AppError>> {
  const getDoc_ = fromAsyncThrowable(
    async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    },
    (error) => createError(ErrorCode.FIREBASE_ERROR, 'ユーザー情報の取得に失敗しました', error)
  );

  return await getDoc_();
}

// ログイン
export async function loginUser(credentials: LoginCredentials): Promise<Result<User, AppError>> {
  const { email, password } = credentials;

  const signIn = fromAsyncThrowable(
    async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    },
    (error) => {
      if (error && typeof error === 'object' && 'code' in error) {
        return mapFirebaseAuthError(error as AuthError);
      }
      return createError(ErrorCode.FIREBASE_ERROR, 'ログインに失敗しました', error);
    }
  );

  const result = await signIn();

  if (result.isErr()) {
    log.error('Login failed', result.error, { email });
    return err(result.error);
  }

  const firebaseUser = result.value;

  // ユーザードキュメントを取得または作成
  const userDocResult = await getUserDocument(firebaseUser.uid);

  if (userDocResult.isErr()) {
    return err(userDocResult.error);
  }

  if (userDocResult.value === null) {
    // ユーザードキュメントが存在しない場合は作成
    return await createUserDocument(firebaseUser);
  }

  log.info('User logged in successfully', { userId: firebaseUser.uid });
  return ok(userDocResult.value);
}

// ユーザー登録
export async function registerUser(
  credentials: RegisterCredentials
): Promise<Result<User, AppError>> {
  const { email, password } = credentials;

  const createUser = fromAsyncThrowable(
    async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    },
    (error) => {
      if (error && typeof error === 'object' && 'code' in error) {
        return mapFirebaseAuthError(error as AuthError);
      }
      return createError(ErrorCode.FIREBASE_ERROR, 'ユーザー登録に失敗しました', error);
    }
  );

  const result = await createUser();

  if (result.isErr()) {
    log.error('Registration failed', result.error, { email });
    return err(result.error);
  }

  const firebaseUser = result.value;

  // ユーザードキュメントを作成
  const userDocResult = await createUserDocument(firebaseUser);

  if (userDocResult.isOk()) {
    log.info('User registered successfully', { userId: firebaseUser.uid });
  }

  return userDocResult;
}

// ログアウト
export async function logoutUser(): Promise<Result<void, AppError>> {
  const logout = fromAsyncThrowable(
    async () => {
      await signOut(auth);
    },
    (error) => createError(ErrorCode.FIREBASE_ERROR, 'ログアウトに失敗しました', error)
  );

  const result = await logout();

  if (result.isOk()) {
    log.info('User logged out successfully');
  } else {
    log.error('Logout failed', result.error);
  }

  return result;
}
