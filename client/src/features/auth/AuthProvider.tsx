import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from '@/api/auth.api';
import { clearAccessToken, onSessionExpired, setAccessToken } from '@/api/session';
import { updateProfileRequest } from '@/api/users.api';
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types/auth';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

/**
 * StrictMode mounts effects twice in development. Refresh tokens rotate on every
 * use, so two parallel refreshes would invalidate each other; one shared promise
 * keeps the bootstrap to a single request.
 */
let sessionRestore: Promise<AuthSession> | null = null;

function restoreSessionOnce(): Promise<AuthSession> {
  if (!sessionRestore) {
    sessionRestore = refreshRequest().finally(() => {
      sessionRestore = null;
    });
  }

  return sessionRestore;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();

  const applySession = useCallback((session: AuthSession) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  // On a hard reload the access token is gone, but the httpOnly refresh cookie
  // still identifies the session, so restore it before rendering protected UI.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      try {
        const session = await restoreSessionOnce();

        if (!cancelled) {
          applySession(session);
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setStatus('guest');
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  useEffect(() => {
    return onSessionExpired(() => {
      clearSession();
    });
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await loginRequest(payload);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await registerRequest(payload);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const nextUser = await updateProfileRequest(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // A stale session is still cleared locally even if the server call fails.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, status, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
