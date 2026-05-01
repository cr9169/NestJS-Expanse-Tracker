import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryAndLocalStorageTokenStore } from './token-store';

describe('InMemoryAndLocalStorageTokenStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the access token in memory only', () => {
    const store = new InMemoryAndLocalStorageTokenStore();
    store.setAccessToken('a-token');
    expect(store.getAccessToken()).toBe('a-token');
    expect(localStorage.getItem('expense-tracker.refreshToken')).toBeNull();
  });

  it('persists the refresh token in localStorage', () => {
    const store = new InMemoryAndLocalStorageTokenStore();
    store.setRefreshToken('r-token');
    expect(localStorage.getItem('expense-tracker.refreshToken')).toBe('r-token');

    const replacement = new InMemoryAndLocalStorageTokenStore();
    expect(replacement.getRefreshToken()).toBe('r-token');
  });

  it('clear() resets both', () => {
    const store = new InMemoryAndLocalStorageTokenStore();
    store.setAccessToken('a');
    store.setRefreshToken('r');
    store.clear();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
  });

  it('notifies subscribers on changes', () => {
    const store = new InMemoryAndLocalStorageTokenStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setAccessToken('a');
    store.setRefreshToken('r');
    store.clear();

    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(3);

    unsubscribe();
    store.setAccessToken('b');
    const callsAfter = listener.mock.calls.length;
    store.setAccessToken('c');
    expect(listener.mock.calls.length).toBe(callsAfter);
  });
});
