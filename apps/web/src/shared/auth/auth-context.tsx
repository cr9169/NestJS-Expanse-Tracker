import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiPost } from '@/shared/api/http-client';
import type { LoginInput, RegisterInput, TokenResponse } from '@/shared/schemas/auth.schemas';

import { decodeJwt } from './jwt';
import { tokenStore } from './token-store';

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [user, setUser] = useState<AuthUser | null>(null);
  const bootRanRef = useRef(false);

  const applyTokens = useCallback((tokens: TokenResponse) => {
    tokenStore.setAccessToken(tokens.accessToken);
    tokenStore.setRefreshToken(tokens.refreshToken);
    const payload = decodeJwt(tokens.accessToken);
    if (payload?.sub && payload.email) {
      setUser({ id: payload.sub, email: payload.email });
    }
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Boot-time: if a refresh token exists, try to resume the session.
  useEffect(() => {
    if (bootRanRef.current) return;
    bootRanRef.current = true;

    const refresh = tokenStore.getRefreshToken();
    if (!refresh) {
      setStatus('unauthenticated');
      return;
    }

    void (async () => {
      try {
        const tokens = await apiPost<TokenResponse, { refreshToken: string }>(
          '/api/v1/auth/refresh',
          { refreshToken: refresh },
        );
        applyTokens(tokens);
      } catch {
        tokenStore.clear();
        setStatus('unauthenticated');
      }
    })();
  }, [applyTokens]);

  const login = useCallback(
    async (input: LoginInput) => {
      const tokens = await apiPost<TokenResponse, LoginInput>('/api/v1/auth/login', input);
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const tokens = await apiPost<TokenResponse, RegisterInput>(
        '/api/v1/auth/register',
        input,
      );
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
