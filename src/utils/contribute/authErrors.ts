import { isAxiosError } from 'axios';

import { HttpError } from '@/fetch/contributeFetch/batchUploadApi';

/**
 * A rejected request is either a session that is no longer good, or an account
 * that was never entitled. They read alike in a toast and are fixed by opposite
 * actions: one by signing in again, the other by asking an admin for a role.
 */
export type AuthFailureKind = 'session' | 'permission';

export interface AuthFailure {
  kind: AuthFailureKind;
  /** Ready to hand to `message.error` as-is. */
  message: string;
  /** The backend's own words, kept for the console. */
  reason?: string;
}

export const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please sign in again, then retry.';

/**
 * The contribute backend answers a bad session with 403, not 401 — see
 * `requireAuth` in voyages-contribute, which returns 403 "Invalid or expired
 * token" once a token is present but does not verify. Only the *absence* of a
 * usable header is a 401. So the status code alone cannot separate an expired
 * session from a missing role, and these are the strings that can.
 */
const SESSION_REASONS = [
  'invalid or expired token',
  'token missing required subject claim',
  'cannot determine author from token',
];

/** Reads the backend's `{ error }` body off either error shape we throw. */
const reasonOf = (error: unknown): string | undefined => {
  if (error instanceof HttpError) {
    // HttpError carries the server's `error` string as its message.
    return error.message;
  }
  if (isAxiosError(error)) {
    const data = error.response?.data;
    return typeof data?.error === 'string' ? data.error : undefined;
  }
  return undefined;
};

const statusOf = (error: unknown): number | undefined => {
  if (error instanceof HttpError) {
    return error.status;
  }
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/**
 * Classifies an authentication or authorization failure, or returns undefined
 * for anything else so the caller keeps the message it already had.
 */
export const describeAuthFailure = (
  error: unknown,
): AuthFailure | undefined => {
  const status = statusOf(error);
  if (status !== 401 && status !== 403) {
    return undefined;
  }

  const reason = reasonOf(error);

  // 401 is only ever raised before a token is inspected: no Authorization
  // header, or a header with nothing after "Bearer". Both mean signed out.
  if (status === 401) {
    return { kind: 'session', message: SESSION_EXPIRED_MESSAGE, reason };
  }

  const normalised = reason?.trim().toLowerCase();
  // An unreadable 403 body is treated as a session failure on purpose. Every
  // request passes the token check before any role check, so it is the likelier
  // of the two; and sending someone to sign in again when the real fault was a
  // missing role costs them one attempt, where sending them to chase a role
  // they already hold is the exact detour this message exists to prevent.
  if (!normalised || SESSION_REASONS.includes(normalised)) {
    return { kind: 'session', message: SESSION_EXPIRED_MESSAGE, reason };
  }

  return {
    kind: 'permission',
    message: `Your account does not have permission to do this — ${reason}.`,
    reason,
  };
};
