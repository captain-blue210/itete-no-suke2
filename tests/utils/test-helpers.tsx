import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Firebase Auth User
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  ...overrides,
});

// Mock Firebase Auth Error
export const createMockFirebaseError = (code: string, message: string) => ({
  code: `auth/${code}`,
  message,
  name: 'FirebaseError',
});

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Common test utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(),
  };
})();

// Setup common mocks
export const setupCommonMocks = () => {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  Object.defineProperty(window, 'sessionStorage', { value: mockLocalStorage });
};

// Clean up mocks
export const cleanupMocks = () => {
  vi.clearAllMocks();
  mockLocalStorage.clear();
};