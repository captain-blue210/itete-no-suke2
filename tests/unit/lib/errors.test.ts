import { describe, it, expect } from 'vitest';
import { ErrorCode, AppError } from '@/lib/errors';

describe('AppError', () => {
  it('should define correct error codes', () => {
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.FIREBASE_ERROR).toBe('FIREBASE_ERROR');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });

  it('should create AppError with required properties', () => {
    const error: AppError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid input',
      details: { field: 'email' },
    };

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create AppError without details', () => {
    const error: AppError = {
      code: ErrorCode.UNAUTHORIZED,
      message: 'Not authorized',
    };

    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe('Not authorized');
    expect(error.details).toBeUndefined();
  });
});