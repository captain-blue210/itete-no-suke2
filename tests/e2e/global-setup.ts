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

    // Firestore Emulator確認
    const firestoreResponse = await page.request.get('http://localhost:8080');
    if (firestoreResponse.ok()) {
      console.log('✅ Firebase Firestore Emulator確認完了');
    }

    // Storage Emulator確認
    const storageResponse = await page.request.get('http://localhost:9199');
    if (storageResponse.ok()) {
      console.log('✅ Firebase Storage Emulator確認完了');
    }
  } catch (error) {
    console.error('❌ Firebase Emulator確認失敗:', error);
    throw new Error(
      'Firebase Emulatorが起動していません。firebase emulators:startを実行してください。'
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
