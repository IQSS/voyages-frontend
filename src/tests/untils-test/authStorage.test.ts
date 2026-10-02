import { beforeEach, describe, expect, test } from 'vitest';

import {
  authStorage,
  clearSavedData,
  getRememberedEmail,
  getRememberMe,
  rememberEmail,
  setRememberMe,
} from '@/utils/supabase/authStorage';

const SESSION_KEY = 'sb-project-auth-token';

describe('auth storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('Remember Me is checked until someone unticks it', () => {
    expect(getRememberMe()).toBe(true);
    setRememberMe(false);
    expect(getRememberMe()).toBe(false);
  });

  test('remembered: the session is kept in localStorage', () => {
    setRememberMe(true);
    authStorage.setItem(SESSION_KEY, 'token');
    expect(localStorage.getItem(SESSION_KEY)).toBe('token');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authStorage.getItem(SESSION_KEY)).toBe('token');
  });

  test('not remembered: the session is kept for the tab only', () => {
    setRememberMe(false);
    localStorage.setItem(SESSION_KEY, 'old');
    authStorage.setItem(SESSION_KEY, 'token');
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('token');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(authStorage.getItem(SESSION_KEY)).toBe('token');
  });

  test('removing the session clears both stores', () => {
    localStorage.setItem(SESSION_KEY, 'a');
    sessionStorage.setItem(SESSION_KEY, 'b');
    authStorage.removeItem(SESSION_KEY);
    expect(authStorage.getItem(SESSION_KEY)).toBeNull();
  });

  test('clearing saved data keeps the sign-in and the Remember Me choice', () => {
    setRememberMe(false);
    localStorage.setItem(SESSION_KEY, 'token');
    localStorage.setItem('saveSearch', 'x');
    localStorage.setItem('filterObject', 'y');
    clearSavedData();
    expect(localStorage.getItem(SESSION_KEY)).toBe('token');
    expect(getRememberMe()).toBe(false);
    expect(localStorage.getItem('saveSearch')).toBeNull();
    expect(localStorage.getItem('filterObject')).toBeNull();
  });
});

describe('remembered email', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('kept with Remember Me, forgotten without, and kept by clearSavedData', () => {
    rememberEmail('dev@example.org', true);
    clearSavedData();
    expect(getRememberedEmail()).toBe('dev@example.org');
    rememberEmail('dev@example.org', false);
    expect(getRememberedEmail()).toBe('');
  });
});
