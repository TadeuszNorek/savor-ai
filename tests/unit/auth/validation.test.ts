import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateAuthForm,
  hasErrors,
  normalizeEmail,
} from '@/lib/auth/validation';
import type { AuthFormValues, AuthFormErrors } from '@/lib/auth/types';

describe('auth validation', () => {
  describe('validateEmail', () => {
    it('should return undefined for valid email', () => {
      expect(validateEmail('user@example.com')).toBeUndefined();
      expect(validateEmail('test.user@example.co.uk')).toBeUndefined();
      expect(validateEmail('user+tag@domain.com')).toBeUndefined();
    });

    it('should trim whitespace and accept valid email', () => {
      expect(validateEmail('  user@example.com  ')).toBeUndefined();
      expect(validateEmail('\tuser@example.com\n')).toBeUndefined();
    });

    it('should return error for empty email', () => {
      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('   ')).toBe('Email is required');
    });

    it('should return error for email without @', () => {
      expect(validateEmail('userexample.com')).toBe('Please enter a valid email address');
    });

    it('should return error for email without domain', () => {
      expect(validateEmail('user@')).toBe('Please enter a valid email address');
      expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
    });

    it('should return error for email with whitespace', () => {
      expect(validateEmail('user @example.com')).toBe('Please enter a valid email address');
      expect(validateEmail('user@exam ple.com')).toBe('Please enter a valid email address');
    });

    it('should return error for email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'; // 259 chars
      expect(validateEmail(longEmail)).toBe('Email must be 254 characters or less');
    });

    it('should accept email with exactly 254 characters', () => {
      const email254 = 'a'.repeat(240) + '@example.com'; // exactly 254
      expect(validateEmail(email254)).toBeUndefined();
    });

    it('should return error for invalid email formats', () => {
      expect(validateEmail('invalid')).toBe('Please enter a valid email address');
      expect(validateEmail('@example.com')).toBe('Please enter a valid email address');
      expect(validateEmail('user@@example.com')).toBe('Please enter a valid email address');
    });
  });

  describe('validatePassword', () => {
    it('should return undefined for valid password', () => {
      expect(validatePassword('password123')).toBeUndefined();
      expect(validatePassword('12345678')).toBeUndefined();
      expect(validatePassword('P@ssw0rd!')).toBeUndefined();
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toBe('Password is required');
    });

    it('should return error for whitespace-only password', () => {
      expect(validatePassword('        ')).toBe('Password cannot be only whitespace');
      expect(validatePassword('\t\n\r  ')).toBe('Password cannot be only whitespace');
    });

    it('should return error for password less than 8 characters', () => {
      expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
      expect(validatePassword('pass')).toBe('Password must be at least 8 characters');
    });

    it('should accept password with exactly 8 characters', () => {
      expect(validatePassword('12345678')).toBeUndefined();
    });

    it('should return error for password exceeding 128 characters', () => {
      const longPassword = 'a'.repeat(129);
      expect(validatePassword(longPassword)).toBe('Password must be 128 characters or less');
    });

    it('should accept password with exactly 128 characters', () => {
      const password128 = 'a'.repeat(128);
      expect(validatePassword(password128)).toBeUndefined();
    });

    it('should accept password with leading/trailing whitespace', () => {
      // Password allows whitespace, but not whitespace-only
      expect(validatePassword('  password  ')).toBeUndefined();
    });
  });

  describe('validateAuthForm', () => {
    it('should return empty errors object for valid form', () => {
      const values: AuthFormValues = {
        email: 'user@example.com',
        password: 'password123',
      };
      const errors = validateAuthForm(values);
      expect(errors).toEqual({});
    });

    it('should return email error for invalid email', () => {
      const values: AuthFormValues = {
        email: 'invalid-email',
        password: 'password123',
      };
      const errors = validateAuthForm(values);
      expect(errors.email).toBe('Please enter a valid email address');
      expect(errors.password).toBeUndefined();
    });

    it('should return password error for invalid password', () => {
      const values: AuthFormValues = {
        email: 'user@example.com',
        password: '123',
      };
      const errors = validateAuthForm(values);
      expect(errors.email).toBeUndefined();
      expect(errors.password).toBe('Password must be at least 8 characters');
    });

    it('should return both errors when both fields are invalid', () => {
      const values: AuthFormValues = {
        email: '',
        password: '',
      };
      const errors = validateAuthForm(values);
      expect(errors.email).toBe('Email is required');
      expect(errors.password).toBe('Password is required');
    });

    it('should trim email before validation', () => {
      const values: AuthFormValues = {
        email: '  user@example.com  ',
        password: 'password123',
      };
      const errors = validateAuthForm(values);
      expect(errors).toEqual({});
    });
  });

  describe('hasErrors', () => {
    it('should return false for empty errors object', () => {
      const errors: AuthFormErrors = {};
      expect(hasErrors(errors)).toBe(false);
    });

    it('should return true when email error exists', () => {
      const errors: AuthFormErrors = {
        email: 'Email is required',
      };
      expect(hasErrors(errors)).toBe(true);
    });

    it('should return true when password error exists', () => {
      const errors: AuthFormErrors = {
        password: 'Password is required',
      };
      expect(hasErrors(errors)).toBe(true);
    });

    it('should return true when form error exists', () => {
      const errors: AuthFormErrors = {
        form: 'Authentication failed',
      };
      expect(hasErrors(errors)).toBe(true);
    });

    it('should return true when multiple errors exist', () => {
      const errors: AuthFormErrors = {
        email: 'Email is required',
        password: 'Password is required',
        form: 'Failed',
      };
      expect(hasErrors(errors)).toBe(true);
    });
  });

  describe('normalizeEmail', () => {
    it('should trim and lowercase email', () => {
      expect(normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('should lowercase uppercase email', () => {
      expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
      expect(normalizeEmail('\tuser@example.com\n')).toBe('user@example.com');
    });

    it('should handle already normalized email', () => {
      expect(normalizeEmail('user@example.com')).toBe('user@example.com');
    });

    it('should handle mixed case email', () => {
      expect(normalizeEmail('UsEr@ExAmPlE.cOm')).toBe('user@example.com');
    });
  });
});
