import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/auth/useAuth';
import { supabaseClient } from '@/db/supabase.client';
import { sendSessionStartOnColdStart } from '@/lib/auth/telemetry';
import type { User, Session } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@/db/supabase.client', () => {
  const mockUnsubscribe = vi.fn();
  const mockOnAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  }));

  return {
    supabaseClient: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: mockOnAuthStateChange,
      },
    },
    mockUnsubscribe,
    mockOnAuthStateChange,
  };
});

// Mock telemetry
vi.mock('@/lib/auth/telemetry', () => ({
  sendSessionStartOnColdStart: vi.fn(() => Promise.resolve()),
}));

describe('useAuth hook', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  const mockSession: Session = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
  } as Session;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should set user when session exists', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should set user to null when no session exists', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('should call sendSessionStartOnColdStart when user exists', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(sendSessionStartOnColdStart).toHaveBeenCalled();
    });
  });

  it('should not call sendSessionStartOnColdStart when no user', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(supabaseClient.auth.getSession).toHaveBeenCalled();
    });

    expect(sendSessionStartOnColdStart).not.toHaveBeenCalled();
  });

  it('should not throw when sendSessionStartOnColdStart fails', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    vi.mocked(sendSessionStartOnColdStart).mockRejectedValueOnce(new Error('Telemetry error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook should still work despite telemetry error
    expect(result.current.user).toEqual(mockUser);
  });

  it('should subscribe to auth state changes', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(supabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  it('should update user on auth state change', async () => {
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate auth state change
    const authStateChangeCallback = vi.mocked(supabaseClient.auth.onAuthStateChange).mock
      .calls[0][0];
    authStateChangeCallback('SIGNED_IN', mockSession);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should unsubscribe on unmount', async () => {
    const { mockUnsubscribe } = await import('@/db/supabase.client');

    vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(supabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
