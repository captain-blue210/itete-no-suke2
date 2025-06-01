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
    if (!(auth as any)._delegate?.config?.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }

    // Firestoreエミュレータ接続確認
    if (!(db as any)._delegate?._databaseId?.projectId?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8081);
    }

    // Storageエミュレータ接続確認
    if (!(storage as any)._delegate?._host?.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }

    console.log('🔧 Firebase Emulator接続完了');
  } catch (error) {
    // Emulator接続エラーは開発時のみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Firebase Emulator接続失敗:', error);
    }
  }
}
