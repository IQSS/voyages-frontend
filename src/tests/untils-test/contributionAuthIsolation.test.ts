import { afterEach, describe, expect, it, vi } from 'vitest';

const { state, get } = vi.hoisted(() => ({
  state: { getAuthUserSlice: { user: null as null | { accessToken: string } } },
  get: vi.fn(async () => ({ data: [] })),
}));
vi.mock('@/redux/store', () => ({ default: { getState: () => state } }));
vi.mock('axios', () => ({ default: { get } }));

afterEach(() => {
  state.getAuthUserSlice.user = null;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('Django and contribution authentication isolation', () => {
  it('does not send the Django public token to the contribution service when signed out', async () => {
    vi.stubGlobal('__VOYAGES_RUNTIME_CONFIG__', {
      apiAuthToken: 'Token django-public',
    });
    const { getAuthHeader, getAuthHeaders } =
      await import('@/utils/getAuthHeaders');
    expect(getAuthHeader()).toBe('');
    expect(getAuthHeaders()).toEqual({ Authorization: '' });
  });

  it('uses the current Supabase bearer only for the contribution service', async () => {
    vi.stubGlobal('__VOYAGES_RUNTIME_CONFIG__', {
      apiAuthToken: 'Token django-public',
    });
    vi.stubEnv('VITE_API_BASE_URL', '/api');
    state.getAuthUserSlice.user = { accessToken: 'supabase-user-jwt' };
    const { getAuthHeader } = await import('@/utils/getAuthHeaders');
    expect(getAuthHeader()).toBe('Bearer supabase-user-jwt');
    state.getAuthUserSlice.user.accessToken = 'refreshed-user-jwt';
    expect(getAuthHeader()).toBe('Bearer refreshed-user-jwt');
    const { fetchTreeSelectedContributeLocation } =
      await import('@/fetch/contributeFetch/fetchTreeSelectedContributeLocation');
    await fetchTreeSelectedContributeLocation();
    expect(get).toHaveBeenCalledWith('/api/contrib/location_tree', {
      headers: {
        Authorization: 'Token django-public',
        'Content-Type': 'application/json',
      },
    });
  });
});
