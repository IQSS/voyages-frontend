/** Where the sign-in page's Remember Me choice is kept. */
const REMEMBER_ME_KEY = 'contribute.rememberMe';
/** The email last signed in with Remember Me, to fill the form next time. */
const REMEMBERED_EMAIL_KEY = 'contribute.rememberedEmail';

// Keys Supabase keeps the session (and the PKCE code verifier) under.
const isAuthKey = (key: string) => key.startsWith('sb-');

/** Remember Me as last chosen; checked until someone unticks it. */
export const getRememberMe = (): boolean => {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setRememberMe = (remember: boolean) => {
  try {
    localStorage.setItem(REMEMBER_ME_KEY, String(remember));
  } catch {
    // Without storage the choice is not kept; sign-in still works.
  }
};

export const getRememberedEmail = (): string => {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
};

/** Keeps the email with Remember Me; forgets it without. Never the password. */
export const rememberEmail = (email: string, remember: boolean) => {
  try {
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Without storage the email is simply not filled in next time.
  }
};

/**
 * Session storage for Supabase. With Remember Me the session is kept in
 * localStorage, so it outlasts the browser; without, in sessionStorage, so it
 * ends with the tab.
 */
export const authStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      const [keep, drop] = getRememberMe()
        ? [localStorage, sessionStorage]
        : [sessionStorage, localStorage];
      keep.setItem(key, value);
      drop.removeItem(key);
    } catch {
      // Storage unavailable: the session lasts for this page only.
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Nothing stored to remove.
    }
  },
};

/**
 * Empties the site's saved data (searches, filters, ...), keeping the sign-in,
 * the Remember Me choice and email, and any `keep` keys: clearing all of
 * localStorage signed people out.
 */
export const clearSavedData = (keep: string[] = []) => {
  try {
    Object.keys(localStorage)
      .filter(
        (key) =>
          !isAuthKey(key) &&
          key !== REMEMBER_ME_KEY &&
          key !== REMEMBERED_EMAIL_KEY &&
          !keep.includes(key),
      )
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Nothing to clear.
  }
};
