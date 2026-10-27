import axios, { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { describeAuthFailure } from '@/utils/contribute/authErrors';
import { checkVoyageConflict } from '@/utils/functions/voyageValidation';

vi.mock('@/utils/getAuthHeaders', () => ({
  getAuthHeader: () => 'Bearer expired.token.here',
  getAuthHeaders: () => ({ Authorization: 'Bearer expired.token.here' }),
}));

/**
 * The unit tests hand `describeAuthFailure` an error built for the purpose.
 * This one checks the link they cannot: that a real 403 from the contributions
 * endpoint survives `checkVoyageConflict`'s rethrow still carrying the status
 * and the `{ error }` body the classifier reads.
 *
 * The 401/403 bodies below are copied from a live `curl` against the node
 * backend on :7127 — see `requireAuth` in voyages-contribute/src/backend.
 */
describe('an auth failure reaching the search handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const rejectWith = (status: number, body: unknown) => {
    // Let axios build the error itself, so its shape is the real one rather
    // than this test's idea of it.
    vi.spyOn(axios, 'get').mockImplementation(async (url: string) => {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        String(status),
        { headers: new AxiosHeaders() } as never,
        null,
        {
          status,
          statusText: '',
          data: body,
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders(), url } as never,
        },
      );
    });
  };

  it('classifies an expired session as such rather than a failed search', async () => {
    rejectWith(403, { error: 'Invalid or expired token' });

    const error = await checkVoyageConflict(12, 'existing').then(
      () => undefined,
      (e: unknown) => e,
    );

    expect(error).toBeDefined();
    const failure = describeAuthFailure(error);
    expect(failure?.kind).toBe('session');
    // The message the user now sees instead of the old one.
    expect(failure?.message).toMatch(/session has expired/i);
    expect(failure?.message).not.toMatch(/existing contributions/i);
  });

  it('classifies a signed-out 401 as a session failure too', async () => {
    rejectWith(401, { error: 'Authorization header missing or invalid' });

    const error = await checkVoyageConflict(12, 'existing').then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(describeAuthFailure(error)?.kind).toBe('session');
  });

  it('leaves a server fault alone, so the caller keeps its own message', async () => {
    rejectWith(500, { error: 'boom' });

    const error = await checkVoyageConflict(12, 'existing').then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(error).toBeDefined();
    expect(describeAuthFailure(error)).toBeUndefined();
  });
});
