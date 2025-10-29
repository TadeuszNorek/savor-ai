import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { EmailInput } from '@/components/auth/EmailInput';

describe('EmailInput component', () => {
  it('should render email input with label', () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with email type and autocomplete', () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('should display current value', () => {
    render(<EmailInput value="test@example.com" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test@example.com');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<EmailInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('should call onBlur when input loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<EmailInput value="" onChange={vi.fn()} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('should display error message when error prop is provided', () => {
    render(<EmailInput value="" onChange={vi.fn()} error="Invalid email" />);

    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('should set aria-invalid when error is present', () => {
    render(<EmailInput value="" onChange={vi.fn()} error="Invalid email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should set aria-describedby when error is present', () => {
    render(<EmailInput value="" onChange={vi.fn()} error="Invalid email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('should not display error when no error prop', () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<EmailInput value="" onChange={vi.fn()} disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should forward ref to input element', () => {
    const ref = createRef<HTMLInputElement>();

    render(<EmailInput ref={ref} value="" onChange={vi.fn()} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.getAttribute('type')).toBe('email');
  });

  it('should have correct label association', () => {
    render(<EmailInput value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email');

    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });
});
