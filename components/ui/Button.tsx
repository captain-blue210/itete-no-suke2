import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, forwardRef, KeyboardEvent } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 btn-primary',
      secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 btn-secondary',
      outline:
        'border border-primary-200 bg-white text-primary-600 hover:bg-primary-50 btn-outline',
      danger: 'bg-red-600 text-white hover:bg-red-700 btn-danger',
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm btn-small',
      md: 'h-10 px-4 py-2 btn-medium',
      lg: 'h-11 px-8 text-lg btn-large',
      small: 'h-9 px-3 text-sm btn-small',
      medium: 'h-10 px-4 py-2 btn-medium',
      large: 'h-11 px-8 text-lg btn-large',
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === 'Enter' || event.key === ' ') && onClick && !disabled && !loading) {
        event.preventDefault();
        onClick(event as any);
      }
      onKeyDown?.(event);
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            data-testid="loading-spinner"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
