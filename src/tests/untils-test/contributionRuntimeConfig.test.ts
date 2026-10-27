import { afterEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: { getSession: vi.fn() } })),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('contribution runtime configuration', () => {
  it('uses the container runtime values without replacing the Django credential', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://build.supabase.co');
    vi.stubGlobal('__VOYAGES_RUNTIME_CONFIG__', {
      apiAuthToken: 'Token django-public',
      contributeApiBaseUrl: '/contribute-api/',
      supabaseUrl: 'https://candidate.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    });
    const config = await import('@/share/AUTH_BASEURL');
    expect(config.AUTHTOKEN).toBe('Token django-public');
    expect(config.BASEURLNODE).toBe('/contribute-api');
    expect(config.SUPABASE_URL).toBe('https://candidate.supabase.co');
    expect(config.SUPABASE_ANON_KEY).toBe('public-anon-key');

    const auth = await import('@/utils/supabase/supabaseClient');
    expect(auth.hasSupabaseConfiguration).toBe(true);
    expect(createClient).not.toHaveBeenCalled();
    expect(auth.supabase.auth).toBeDefined();
    expect(createClient).toHaveBeenCalledWith(
      'https://candidate.supabase.co',
      'public-anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({ flowType: 'pkce' }),
      }),
    );
  });

  it('keeps the public application importable without contribution authentication', async () => {
    vi.stubGlobal('__VOYAGES_RUNTIME_CONFIG__', {
      apiAuthToken: 'Token django-public',
    });
    vi.stubEnv('VITE_API_BASE_NODE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
    const config = await import('@/share/AUTH_BASEURL');
    const auth = await import('@/utils/supabase/supabaseClient');
    expect(config.BASEURLNODE).toBe('/contribute-api');
    expect(auth.hasSupabaseConfiguration).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
    expect(() => auth.supabase.auth).toThrow(
      'Contribution sign-in is not configured.',
    );
  });
});
