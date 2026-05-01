/**
 * TokenStore is a small DI seam: components and the http-client interceptor
 * depend on this interface, never on the concrete localStorage implementation.
 * Tests can swap in a fake by passing a different implementation to
 * configureHttpClient(). This is the DIP principle in practice.
 *
 * Storage policy:
 *   - access token  -> in memory only (ephemeral, lost on tab close — refresh restores it).
 *   - refresh token -> localStorage (persists across reloads).
 *
 * This is the recommended balance: an XSS attacker can read localStorage and
 * exfiltrate the refresh token, but the impact is bounded — the attacker still
 * needs to drive the gateway to mint access tokens. HttpOnly cookies would be
 * stronger but require a backend change (deferred).
 */

import { REFRESH_TOKEN_STORAGE_KEY } from '@/shared/lib/constants';

export interface TokenStore {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string | null): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export class InMemoryAndLocalStorageTokenStore implements TokenStore {
  private accessToken: string | null = null;
  private listeners = new Set<() => void>();

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    this.notify();
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string | null): void {
    try {
      if (token === null) localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      else localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } catch {
      // Storage unavailable (private mode, quota exceeded) — keep going,
      // user will simply need to re-login on next reload.
    }
    this.notify();
  }

  clear(): void {
    this.accessToken = null;
    this.setRefreshToken(null);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}

export const tokenStore: TokenStore = new InMemoryAndLocalStorageTokenStore();
