import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { PasswordInput } from '@/components/auth/PasswordInput';

describe('PasswordInput component', () => {
  it('should render password input with default label', () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('should render with custom label', () => {
    render(<PasswordInput value="" onChange={vi.fn()} label="Enter Password" />);

    expect(screen.getByLabelText('Enter Password')).toBeInTheDocument();
  });

  it('should render with password type initially', () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should have autocomplete attribute', () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
  });

  it('should display current value', () => {
    render(<PasswordInput value="secret123" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveValue('secret123');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<PasswordInput value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'p');

    expect(handleChange).toHaveBeenCalledWith('p');
  });

  it('should call onBlur when input loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<PasswordInput value="" onChange={vi.fn()} onBlur={handleBlur} />);

    const input = screen.getByLabelText('Password');
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('should toggle password visibility when button is clicked', async () => {
    const user = userEvent.setup();

    render(<PasswordInput value="secret" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Initially hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click to show
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click to hide again
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should update toggle button aria-label based on visibility state', async () => {
    const user = userEvent.setup();

    render(<PasswordInput value="" onChange={vi.fn()} />);

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
  });

  it('should display error message when error prop is provided', () => {
    render(<PasswordInput value="" onChange={vi.fn()} error="Password is required" />);

    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
  });

  it('should set aria-invalid when error is present', () => {
    render(<PasswordInput value="" onChange={vi.fn()} error="Invalid password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should set aria-describedby when error is present', () => {
    render(<PasswordInput value="" onChange={vi.fn()} error="Invalid password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-describedby', 'password-error');
  });

  it('should not display error when no error prop', () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should disable input when disabled prop is true', () => {
    render(<PasswordInput value="" onChange={vi.fn()} disabled />);

    const input = screen.getByLabelText('Password');
    expect(input).toBeDisabled();
  });

  it('should disable toggle button when disabled prop is true', () => {
    render(<PasswordInput value="" onChange={vi.fn()} disabled />);

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toBeDisabled();
  });

  it('should forward ref to input element', () => {
    const ref = createRef<HTMLInputElement>();

    render(<PasswordInput ref={ref} value="" onChange={vi.fn()} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.getAttribute('type')).toBe('password');
  });

  it('should have correct label association', () => {
    render(<PasswordInput value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('id', 'password');

    const label = screen.getByText('Password');
    expect(label).toHaveAttribute('for', 'password');
  });
});
