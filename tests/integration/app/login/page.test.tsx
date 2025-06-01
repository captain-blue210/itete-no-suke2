import LoginPage from '@/app/login/page';
import { ErrorCode } from '@/lib/errors';
import { loginUser } from '@/lib/firebase/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { err, ok } from 'neverthrow';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation');
vi.mock('@/lib/firebase/auth');

const mockPush = vi.fn();

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it('should render login page with correct title and form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /ログイン/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('should redirect to dashboard on successful login', async () => {
    const mockUser = {
      id: 'test-uid',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };
    vi.mocked(loginUser).mockResolvedValue(ok(mockUser));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on failed login', async () => {
    const error = {
      code: ErrorCode.FIREBASE_ERROR,
      message: 'Invalid credentials',
    };
    vi.mocked(loginUser).mockResolvedValue(err(error));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/メールアドレスまたはパスワードが正しくありません/i)
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    const error = {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network error',
    };
    vi.mocked(loginUser).mockResolvedValue(err(error));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ネットワークエラーが発生しました/i)).toBeInTheDocument();
    });
  });

  it('should have correct accessibility attributes', () => {
    render(<LoginPage />);

    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    const passwordInput = screen.getByLabelText(/パスワード/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });
});
