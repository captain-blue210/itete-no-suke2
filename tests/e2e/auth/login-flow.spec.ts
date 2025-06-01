import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary test data or configurations
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/ログイン/);
    await expect(page.getByRole('heading', { name: /ログイン/ })).toBeVisible();
    await expect(page.getByLabel(/メールアドレス/)).toBeVisible();
    await expect(page.getByLabel(/パスワード/)).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Test invalid email
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/正しいメールアドレスを入力してください/)).toBeVisible();

    // Test short password
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', '123');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/パスワードは6文字以上で入力してください/)).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should display error message
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/)).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show loading state during login attempt', async ({ page }) => {
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');
    await expect(page.getByText(/ログイン中/)).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeDisabled();
  });

  test('should clear error message when user starts typing', async ({ page }) => {
    // First, trigger an error
    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/)).toBeVisible();
    
    // Start typing in email field
    await page.fill('[name="email"]', 'test@example.com');
    
    // Error message should disappear
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/)).not.toBeVisible();
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Tab to email field
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/メールアドレス/)).toBeFocused();
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/パスワード/)).toBeFocused();
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeFocused();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await expect(page.getByRole('heading', { name: /ログイン/ })).toBeVisible();
    await expect(page.getByLabel(/メールアドレス/)).toBeVisible();
    await expect(page.getByLabel(/パスワード/)).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible();
    
    // Form should be properly sized
    const form = page.locator('form');
    const boundingBox = await form.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should maintain form state when navigating back', async ({ page, context }) => {
    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Navigate away and back
    await page.goto('/');
    await page.goBack();
    
    // Form should be empty (security best practice)
    await expect(page.getByLabel(/メールアドレス/)).toHaveValue('');
    await expect(page.getByLabel(/パスワード/)).toHaveValue('');
  });

  // Test with mock successful login (requires test environment setup)
  test.skip('should redirect to dashboard on successful login', async ({ page }) => {
    // This test would require proper test environment with mock Firebase
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/ダッシュボード/)).toBeVisible();
  });
});