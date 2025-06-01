import { Input } from '@/components/ui/Input';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Input Component', () => {
  it('should render with correct attributes', () => {
    render(<Input id="test-input" name="test" type="email" placeholder="Enter email" required />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'test');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toBeRequired();
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'test value' }),
      })
    );
  });

  it('should display error state', () => {
    render(<Input error="This field is required" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-error');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should display label when provided', () => {
    render(<Input label="Email Address" id="email" />);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<Input label="Email" required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="tel" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should support controlled and uncontrolled modes', () => {
    const { rerender } = render(<Input defaultValue="initial" />);
    const input = screen.getByDisplayValue('initial');

    // Uncontrolled - can change value
    fireEvent.change(input, { target: { value: 'changed' } });
    expect(screen.getByDisplayValue('changed')).toBeInTheDocument();

    // Controlled - value is controlled by prop
    rerender(<Input value="controlled" onChange={() => {}} />);
    expect(screen.getByDisplayValue('controlled')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<Input label="Email" error="Invalid email" id="email-input" required />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });
});
