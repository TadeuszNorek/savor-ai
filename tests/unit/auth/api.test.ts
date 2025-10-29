import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, logout } from '@/lib/auth/api';
import type { AuthSuccessResponse, AuthErrorResponse } from '@/lib/auth/api';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should send POST request to /api/auth/login', async () => {
      const mockResponse: AuthSuccessResponse = {
        user: { id: '123', email: 'test@example.com' },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await login({ email: 'test@example.com', password: 'password123' });

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
    });

    it('should return user data on successful login', async () => {
      const mockResponse: AuthSuccessResponse = {
        user: { id: '123', email: 'test@example.com' },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({ id: '123', email: 'test@example.com' });
    });

    it('should throw error on failed login with error message', async () => {
      const mockError: AuthErrorResponse = {
        error: 'Invalid credentials',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve(mockError),
        } as Response)
      );

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw default error message when no error provided', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Login failed'
      );
    });
  });

  describe('register', () => {
    it('should send POST request to /api/auth/register', async () => {
      const mockResponse: AuthSuccessResponse = {
        user: { id: '456', email: 'new@example.com' },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      await register({ email: 'new@example.com', password: 'password123' });

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
      });
    });

    it('should return user data on successful registration', async () => {
      const mockResponse: AuthSuccessResponse = {
        user: { id: '456', email: 'new@example.com' },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await register({ email: 'new@example.com', password: 'password123' });

      expect(result).toEqual({ id: '456', email: 'new@example.com' });
    });

    it('should throw error on failed registration with error message', async () => {
      const mockError: AuthErrorResponse = {
        error: 'Email already exists',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve(mockError),
        } as Response)
      );

      await expect(
        register({ email: 'existing@example.com', password: 'password123' })
      ).rejects.toThrow('Email already exists');
    });

    it('should throw default error message when no error provided', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(
        register({ email: 'new@example.com', password: 'password123' })
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('logout', () => {
    it('should send POST request to /api/auth/logout', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await logout();

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
    });

    it('should complete successfully on successful logout', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await expect(logout()).resolves.toBeUndefined();
    });

    it('should throw error on failed logout with error message', async () => {
      const mockError: AuthErrorResponse = {
        error: 'Session expired',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve(mockError),
        } as Response)
      );

      await expect(logout()).rejects.toThrow('Session expired');
    });

    it('should throw default error message when no error provided', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(logout()).rejects.toThrow('Logout failed');
    });
  });
});
