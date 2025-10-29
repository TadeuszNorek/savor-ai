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

  describe('Form submission', () => {
    // Mock window.location.href
    const originalLocation = window.location;

    beforeEach(() => {
      // @ts-ignore
      delete window.location;
      window.location = { ...originalLocation, href: '' };
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    describe('Successful login', () => {
      it('should call signInWithPassword with normalized email and password', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '123', email: 'test@example.com' } };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'Test@Example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
          });
        });
      });

      it('should redirect to /app on successful login', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '123', email: 'test@example.com' } };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(window.location.href).toBe('/app');
        }, { timeout: 3000 });
      });

      it('should send telemetry event on successful login', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '123', email: 'test@example.com' } };
        const { sendSessionStartEvent } = await import('@/lib/auth/telemetry');

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(sendSessionStartEvent).toHaveBeenCalled();
        }, { timeout: 3000 });
      });
    });

    describe('Successful registration', () => {
      it('should call signUp with normalized email and password', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '456', email: 'new@example.com' } };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        } as any);

        render(<AuthForm initialMode="register" />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password \(min\. 8 characters\)/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        await user.type(emailInput, 'NEW@EXAMPLE.COM');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
            email: 'new@example.com',
            password: 'password123',
          });
        });
      });

      it('should redirect to /app on successful registration', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '456', email: 'new@example.com' } };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        } as any);

        render(<AuthForm initialMode="register" />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password \(min\. 8 characters\)/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        await user.type(emailInput, 'new@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(window.location.href).toBe('/app');
        }, { timeout: 3000 });
      });
    });

    describe('Login errors', () => {
      it('should show error for invalid credentials', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 },
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
        });
      });

      it('should show error for unconfirmed email', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Email not confirmed', name: 'AuthError', status: 400 },
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/please verify your email address/i)).toBeInTheDocument();
        });
      });

      it('should show error for rate limiting', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Too many requests, rate limit exceeded', name: 'AuthError', status: 429 },
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        });
      });

      it('should show generic error for other login failures', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Something went wrong', name: 'AuthError', status: 500 },
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
      });
    });

    describe('Registration errors', () => {
      it('should show error message on registration failure', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'User already registered', name: 'AuthError', status: 400 },
        } as any);

        render(<AuthForm initialMode="register" />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password \(min\. 8 characters\)/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        await user.type(emailInput, 'existing@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
        });
      });
    });

    describe('Session verification errors', () => {
      it('should show error when session is not available after login', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '123', email: 'test@example.com' } };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        // Session check returns null
        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: null },
          error: null,
        } as any);

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/session error/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      });

      it('should show error when session is not available after registration', async () => {
        const user = userEvent.setup({ delay: null });
        const mockSession = { user: { id: '456', email: 'new@example.com' } };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValueOnce({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        } as any);

        // Session check returns null
        vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
          data: { session: null },
          error: null,
        } as any);

        render(<AuthForm initialMode="register" />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password \(min\. 8 characters\)/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        await user.type(emailInput, 'new@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/session error/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      });
    });

    describe('Network errors', () => {
      it('should show network error on exception during login', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signInWithPassword).mockRejectedValueOnce(
          new Error('Network request failed')
        );

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/network error/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      });

      it('should show network error on exception during registration', async () => {
        const user = userEvent.setup({ delay: null });

        vi.mocked(supabaseClient.auth.signUp).mockRejectedValueOnce(
          new Error('Network request failed')
        );

        render(<AuthForm initialMode="register" />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password \(min\. 8 characters\)/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        await user.type(emailInput, 'new@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/network error/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      });
    });

    describe('Loading state', () => {
      it('should disable submit button during submission', async () => {
        const user = userEvent.setup({ delay: null });

        // Mock slow response
        vi.mocked(supabaseClient.auth.signInWithPassword).mockImplementationOnce(() =>
          new Promise((resolve) => setTimeout(() => resolve({
            data: { user: null, session: null },
            error: { message: 'Error', name: 'AuthError', status: 400 },
          } as any), 1000))
        );

        render(<AuthForm />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Button should be disabled during submission
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
        });
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
