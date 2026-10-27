import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/share/AUTH_BASEURL';

import { authStorage } from './authStorage';

export const hasSupabaseConfiguration = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY,
);
let client: SupabaseClient | undefined;

// The public site remains usable when contribution authentication is not configured.
// Create the client only when an auth operation needs it; never contact a fallback host.
const getClient = (): SupabaseClient => {
  if (!hasSupabaseConfiguration) {
    throw new Error('Contribution sign-in is not configured.');
  }
  return (client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: authStorage,
      flowType: 'pkce',
    },
  }));
};

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, property) => Reflect.get(getClient(), property),
});
