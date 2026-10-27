import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { HttpError } from '@/fetch/contributeFetch/batchUploadApi';
import {
  describeAuthFailure,
  SESSION_EXPIRED_MESSAGE,
} from '@/utils/contribute/authErrors';

/**
 * `isAxiosError` checks the `isAxiosError` flag, so a hand-built object will
 * not do — the real constructor is used, with the response attached the way
 * axios attaches it.
 */
const axiosFailure = (status: number, body?: unknown): AxiosError => {
  const error = new AxiosError(`Request failed with status code ${status}`);
  error.response = {
    status,
    statusText: '',
    data: body,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe('describeAuthFailure', () => {
  it('leaves anything that is not 401 or 403 to the caller', () => {
    expect(describeAuthFailure(axiosFailure(404))).toBeUndefined();
    expect(describeAuthFailure(axiosFailure(500))).toBeUndefined();
    expect(describeAuthFailure(new Error('network down'))).toBeUndefined();
    expect(describeAuthFailure(undefined)).toBeUndefined();
  });

  // The whole point of the helper: the backend answers an expired token with
  // 403, the same code it uses for a missing role.
  it('reads the expired-token 403 as a session failure, not a permission one', () => {
    const failure = describeAuthFailure(
      axiosFailure(403, { error: 'Invalid or expired token' }),
    );
    expect(failure?.kind).toBe('session');
    expect(failure?.message).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('reads a missing role as a permission failure', () => {
    const failure = describeAuthFailure(
      axiosFailure(403, { error: 'Editor role required' }),
    );
    expect(failure?.kind).toBe('permission');
    expect(failure?.message).toContain('Editor role required');
    expect(failure?.message).not.toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('reads an ownership refusal as a permission failure', () => {
    const failure = describeAuthFailure(
      axiosFailure(403, {
        error: 'You cannot read contributions made by others',
      }),
    );
    expect(failure?.kind).toBe('permission');
  });

  it.each([
    'Token missing required subject claim',
    'Cannot determine author from token',
  ])('treats the other token faults as session failures: %s', (reason) => {
    expect(
      describeAuthFailure(axiosFailure(403, { error: reason }))?.kind,
    ).toBe('session');
  });

  it.each(['Authorization header missing or invalid', 'Token missing'])(
    'treats every 401 as a session failure: %s',
    (reason) => {
      const failure = describeAuthFailure(axiosFailure(401, { error: reason }));
      expect(failure?.kind).toBe('session');
      expect(failure?.message).toBe(SESSION_EXPIRED_MESSAGE);
    },
  );

  it('falls back to a session failure when the 403 body cannot be read', () => {
    expect(describeAuthFailure(axiosFailure(403))?.kind).toBe('session');
    expect(describeAuthFailure(axiosFailure(403, 'not json'))?.kind).toBe(
      'session',
    );
    expect(describeAuthFailure(axiosFailure(403, { error: 42 }))?.kind).toBe(
      'session',
    );
  });

  // The batch-upload client throws HttpError rather than an axios error, and
  // carries the server's `error` string as the message.
  it('classifies HttpError the same way', () => {
    expect(
      describeAuthFailure(new HttpError(403, 'Invalid or expired token'))?.kind,
    ).toBe('session');
    expect(
      describeAuthFailure(new HttpError(403, 'Editor role required'))?.kind,
    ).toBe('permission');
    expect(
      describeAuthFailure(new HttpError(404, 'Not found')),
    ).toBeUndefined();
  });

  it('matches the backend strings regardless of case or padding', () => {
    expect(
      describeAuthFailure(
        axiosFailure(403, { error: '  invalid or expired token ' }),
      )?.kind,
    ).toBe('session');
  });
});
