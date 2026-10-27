import { useCallback, useEffect, useRef, useState } from 'react';

import {
  publish as publishRequest,
  pollPublication,
  PublicationConflict,
  PublicationMode,
  PublicationRejectedError,
  PublicationStatus,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';

const POLL_INTERVAL_MS = 3000;

/**
 * Where an in-flight run is remembered across a reload.
 *
 * Publication is a background process on the server: it keeps committing
 * whether or not this page is open. Without this the editor who refreshes gets
 * an idle table and no way back to a run that is still going.
 *
 * `sessionStorage` rather than `localStorage` on purpose — the run belongs to
 * this tab's sitting, and a key surviving into next week would offer to resume
 * something long finished.
 */
const ACTIVE_RUN_KEY = 'contribute.publication.activeRun';

/** Consecutive unanswered polls before the run is called stalled. */
const MAX_POLL_MISSES = 3;

interface PersistedRun {
  publicationKey: string;
  target: PublicationTarget;
  startedAt: number;
}

const readPersistedRun = (): PersistedRun | null => {
  try {
    const raw = sessionStorage.getItem(ACTIVE_RUN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedRun;
    // Storage is shared with anything else on the origin, so treat its contents
    // as untrusted rather than assuming the shape we wrote.
    return parsed?.publicationKey && parsed?.target?.id ? parsed : null;
  } catch {
    return null;
  }
};

const writePersistedRun = (run: PersistedRun): void => {
  try {
    sessionStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run));
  } catch {
    // A full or unavailable storage costs the resume, not the publication.
  }
};

const clearPersistedRun = (): void => {
  try {
    sessionStorage.removeItem(ACTIVE_RUN_KEY);
  } catch {
    // As above.
  }
};

/**
 * Where a publication run currently stands.
 *
 * Neither `blocked` nor `failed` leaves anything written: the refusal happens
 * before the change set reaches Django, and the run itself is one transaction
 * that rolls back whole. They are separate states because the editor's next
 * move differs — `blocked` means contributions to fix, `failed` means a bug to
 * report, since data problems are caught before publishing starts.
 *
 * `stalled` is neither. It means this page lost contact while the run was still
 * going: the outcome is *unknown*, not rolled back. Reporting that as `failed`
 * would tell an editor nothing was written at the exact moment the transaction
 * may be committing, so it gets its own state and its own wording.
 */
export type PublicationPhase =
  | 'idle'
  | 'starting'
  | 'blocked'
  | 'publishing'
  | 'stalled'
  | 'completed'
  | 'failed';

export interface PublicationTarget {
  id: string | number;
  mode: PublicationMode;
  /** For messages — e.g. the batch title. */
  label?: string;
}

export interface UsePublicationResult {
  phase: PublicationPhase;
  target: PublicationTarget | null;
  /** Live status while publishing, and the final one afterwards. */
  status: PublicationStatus | null;
  /** Set when the server refused: properties two contributions disagree on. */
  conflicts: PublicationConflict[];
  /** Errors when blocked; warnings once published. */
  validation: PublicationValidation[];
  /** Set when the run itself broke, or a request failed. */
  error: string | null;
  /**
   * When the current run began, for elapsed time. Survives a reload, so the
   * timer keeps counting from the real start rather than from the resume.
   */
  startedAt: number | null;
  publish: (target: PublicationTarget) => Promise<void>;
  /** Re-attach to a run already in flight, e.g. after a reload. */
  resume: (
    target: PublicationTarget,
    publicationKey: string,
    since?: number,
  ) => void;
  /** Re-attach after a stall, on the same key. */
  retry: () => void;
  reset: () => void;
}

export const usePublication = (options?: {
  onPublished?: (status: PublicationStatus) => void;
}): UsePublicationResult => {
  const [phase, setPhase] = useState<PublicationPhase>('idle');
  const [target, setTarget] = useState<PublicationTarget | null>(null);
  const [status, setStatus] = useState<PublicationStatus | null>(null);
  const [conflicts, setConflicts] = useState<PublicationConflict[]>([]);
  const [validation, setValidation] = useState<PublicationValidation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  /** Consecutive polls that never got a reply. Reset by any reply. */
  const missesRef = useRef(0);
  // Callbacks are read through a ref so the polling loop never closes over a
  // stale one, and so changing it doesn't restart the loop.
  const onPublishedRef = useRef(options?.onPublished);
  onPublishedRef.current = options?.onPublished;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    activeKeyRef.current = null;
    missesRef.current = 0;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  /**
   * Recursive setTimeout rather than setInterval, so each request waits for the
   * previous response instead of stacking up when the server is slow.
   */
  const startPolling = useCallback(
    (publicationKey: string) => {
      activeKeyRef.current = publicationKey;

      const tick = async () => {
        if (activeKeyRef.current !== publicationKey) {
          return;
        }
        try {
          const next = await pollPublication(publicationKey);
          // Check again: another run may have started while this was in flight.
          if (activeKeyRef.current !== publicationKey) {
            return;
          }
          setStatus(next);

          // A reply of any kind means contact is back.
          missesRef.current = 0;

          if (next.status === 'completed') {
            stopPolling();
            clearPersistedRun();
            setPhase('completed');
            onPublishedRef.current?.(next);
          } else if (next.status === 'failed') {
            stopPolling();
            clearPersistedRun();
            setError(
              next.error ?? 'The publication failed and was rolled back.',
            );
            setPhase('failed');
          } else {
            pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
          }
        } catch (err) {
          if (activeKeyRef.current !== publicationKey) {
            return;
          }
          missesRef.current += 1;
          // One dropped request is not a lost publication. Back off and try
          // again before saying anything alarming: 3s, 6s, 12s.
          if (missesRef.current < MAX_POLL_MISSES) {
            pollTimerRef.current = setTimeout(
              tick,
              POLL_INTERVAL_MS * 2 ** (missesRef.current - 1),
            );
            return;
          }
          stopPolling();
          // Deliberately not `failed`: the run may well be committing right
          // now. The key is kept so a retry can re-attach to it.
          setError(
            err instanceof Error
              ? `Lost contact with the publication: ${err.message}`
              : 'Lost contact with the publication.',
          );
          setPhase('stalled');
        }
      };

      // Ask once immediately — a short batch can be finished already.
      void tick();
    },
    [stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    clearPersistedRun();
    setPhase('idle');
    setTarget(null);
    setStatus(null);
    setConflicts([]);
    setValidation([]);
    setError(null);
    setStartedAt(null);
  }, [stopPolling]);

  const publish = useCallback(
    async (next: PublicationTarget) => {
      stopPolling();
      setTarget(next);
      setStatus(null);
      setConflicts([]);
      setValidation([]);
      setError(null);
      setPhase('starting');
      const runStartedAt = Date.now();
      setStartedAt(runStartedAt);

      try {
        const accepted = await publishRequest(next.id, next.mode);
        // Warnings ride the success path and have nowhere else to surface.
        setValidation(accepted.validation ?? []);

        if (accepted.status === 'completed') {
          setPhase('completed');
          return;
        }
        // `accepted` and `processing` are the same to us: the server keys the
        // task on the target, so a second call joins the run already going.
        // Remembered before polling starts, so a reload one tick later still
        // finds the key.
        writePersistedRun({
          publicationKey: accepted.publication_key,
          target: next,
          startedAt: runStartedAt,
        });
        setPhase('publishing');
        startPolling(accepted.publication_key);
      } catch (err) {
        if (err instanceof PublicationRejectedError) {
          setConflicts(err.conflicts);
          setValidation(err.validation);
          setError(err.message);
          setPhase('blocked');
          return;
        }
        // Anything thrown by the publish call itself is a refusal, not a failed
        // run: the server never handed the change set to Django. Reported as
        // `blocked` so the wording stays about fixing contributions rather than
        // reporting a bug.
        setError(err instanceof Error ? err.message : 'Could not publish.');
        setPhase('blocked');
      }
    },
    [startPolling, stopPolling],
  );

  const resume = useCallback(
    (next: PublicationTarget, publicationKey: string, since?: number) => {
      stopPolling();
      setTarget(next);
      setError(null);
      setStartedAt(since ?? Date.now());
      setPhase('publishing');
      startPolling(publicationKey);
    },
    [startPolling, stopPolling],
  );

  /**
   * Re-attach after a stall. Same key, so this rejoins the original run rather
   * than starting a second one.
   */
  const retry = useCallback(() => {
    const run = readPersistedRun();
    if (!run) {
      return;
    }
    resume(run.target, run.publicationKey, run.startedAt);
  }, [resume]);

  /**
   * Pick up a run left behind by a reload. Runs once: a later `reset` clears
   * the key, so this cannot re-attach to something the editor dismissed.
   */
  useEffect(() => {
    const run = readPersistedRun();
    if (run) {
      resume(run.target, run.publicationKey, run.startedAt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    target,
    status,
    conflicts,
    validation,
    error,
    startedAt,
    retry,
    publish,
    resume,
    reset,
  };
};
