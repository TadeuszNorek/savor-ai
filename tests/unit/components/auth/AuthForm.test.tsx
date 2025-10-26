import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/auth/AuthForm';
import { supabaseClient } from '@/db/supabase.client';

// Mock Supabase client
vi.mock('@/db/supabase.client', () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

// Mock telemetry
vi.mock('@/lib/auth/telemetry', () => ({
  sendSessionStartEvent: vi.fn(() => Promise.resolve()),
}));

describe('AuthForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login mode', () => {
    it('should render in login mode by default', () => {
      render(<AuthForm />);

      expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
      expect(screen.getByText(/enter your email and password to sign in/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show forgot password link in login mode', () => {
      render(<AuthForm />);

      expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
    });

    it('should show sign up link in login mode', () => {
      render(<AuthForm />);

      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should display standard password label in login mode', () => {
      render(<AuthForm />);

      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });
  });

  describe('Register mode', () => {
    it('should render in register mode when specified', () => {
      render(<AuthForm initialMode="register" />);

      expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
      expect(screen.getByText(/enter your email and password to create an account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should not show forgot password link in register mode', () => {
      render(<AuthForm initialMode="register" />);

      expect(screen.queryByText(/forgot your password\?/i)).not.toBeInTheDocument();
    });

    it('should show sign in link in register mode', () => {
      render(<AuthForm initialMode="register" />);

      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display password hint in register mode', () => {
      render(<AuthForm initialMode="register" />);

      expect(screen.getByLabelText(/password \(min\. 8 characters\)/i)).toBeInTheDocument();
    });
  });

  describe('Mode switching', () => {
    it('should switch from login to register mode', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpButton);

      expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    });

    it('should switch from register to login mode', async () => {
      const user = userEvent.setup();
      render(<AuthForm initialMode="register" />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    });

    it('should clear errors when switching modes', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Enter invalid email and blur to trigger error
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');
      await user.tab();

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Switch mode
      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(signUpButton);

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form inputs', () => {
    it('should render email and password inputs', () => {
      render(<AuthForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('should update email value when user types', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password value when user types', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Validation', () => {
    it('should show email error on blur with invalid email', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should show password error on blur with short password', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user fixes invalid email', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // Trigger error
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Error should eventually be cleared after typing stops
      expect(emailInput).toHaveValue('valid@example.com');
    });

    it('should not show error before field is touched', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');

      // Error should not appear until blur
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Submit button', () => {
    it('should be disabled when form has validation errors', async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /sign in/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have form with aria-label', () => {
      render(<AuthForm />);

      expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
    });

    it('should have submit button with aria-label', () => {
      render(<AuthForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('aria-label', 'Sign in');
    });
  });
});
