import { describe, expect, it } from 'vitest';

import type {
  BulkStatusRefusal,
  BulkStatusResult,
} from '@/fetch/contributeFetch/bulkUpdateContributionStatus';
import {
  chunkIds,
  emptyResult,
  groupRefusals,
  mergeResults,
  summarise,
} from '@/utils/contribute/bulkDecision';

/**
 * Splitting a selection into requests, and adding the answers back together.
 *
 * The server caps how many contributions one request may carry and answers for
 * each one separately, so a selection larger than the cap becomes several
 * requests whose answers have to read as one. What matters is that nothing is
 * lost or double-counted in the split, and that the sentence at the end does
 * not misdescribe what happened.
 */

const resultOf = (over: Partial<BulkStatusResult>): BulkStatusResult => ({
  ...emptyResult(),
  ...over,
});

describe('chunkIds', () => {
  it('leaves a selection under the limit as one request', () => {
    expect(chunkIds(['a', 'b', 'c'], 10)).toEqual([['a', 'b', 'c']]);
  });

  it('splits without losing or repeating an id', () => {
    const ids = Array.from({ length: 25 }, (_, i) => `c${i}`);
    const chunks = chunkIds(ids, 10);
    expect(chunks.map((c) => c.length)).toEqual([10, 10, 5]);
    expect(chunks.flat()).toEqual(ids);
  });

  it('has nothing to send for an empty selection', () => {
    expect(chunkIds([], 10)).toEqual([]);
  });
});

describe('mergeResults', () => {
  it('adds the answers to several requests into one tally', () => {
    const merged = mergeResults(
      resultOf({ requested: 2, changed: ['a'], unchanged: ['b'] }),
      resultOf({
        requested: 2,
        changed: ['c'],
        refused: [{ id: 'd', status: 403, error: 'Not yours' }],
      }),
    );
    expect(merged).toEqual({
      requested: 4,
      changed: ['a', 'c'],
      unchanged: ['b'],
      refused: [{ id: 'd', status: 403, error: 'Not yours' }],
    });
  });
});

describe('groupRefusals', () => {
  const refusal = (id: string, error: string, details?: string) =>
    ({
      id,
      status: 403,
      error,
      ...(details ? { details } : {}),
    }) as BulkStatusRefusal;

  it('gathers contributions stopped by the same reason', () => {
    const groups = groupRefusals([
      refusal('a', 'Editor role required', 'Only an editor can accept.'),
      refusal('b', 'Contribution not found'),
      refusal('c', 'Editor role required', 'Only an editor can accept.'),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      error: 'Editor role required',
      details: 'Only an editor can accept.',
      ids: ['a', 'c'],
    });
  });

  it('puts the reason that stopped the most work first', () => {
    const groups = groupRefusals([
      refusal('a', 'Rare'),
      refusal('b', 'Common'),
      refusal('c', 'Common'),
    ]);
    expect(groups.map((g) => g.error)).toEqual(['Common', 'Rare']);
  });

  it('keeps refusals with the same error but different detail apart', () => {
    const groups = groupRefusals([
      refusal('a', 'Editor role required', 'Only an editor can accept.'),
      refusal('b', 'Editor role required', 'Already decided.'),
    ]);
    expect(groups).toHaveLength(2);
  });
});

describe('summarise', () => {
  it('leads with what was decided', () => {
    expect(
      summarise(
        resultOf({ requested: 3, changed: ['a', 'b', 'c'] }),
        'accepted',
      ),
    ).toBe('3 contributions accepted.');
  });

  it('counts one contribution as one', () => {
    expect(
      summarise(resultOf({ requested: 1, changed: ['a'] }), 'accepted'),
    ).toBe('1 contribution accepted.');
  });

  it('mentions what did not move without leading on it', () => {
    const sentence = summarise(
      resultOf({
        requested: 4,
        changed: ['a', 'b'],
        unchanged: ['c'],
        refused: [
          { id: 'd', status: 409, error: 'Contribution status changed' },
        ],
      }),
      'accepted',
    );
    expect(sentence).toBe(
      '2 contributions accepted, 1 already accepted, 1 could not be.',
    );
  });

  it('does not claim anything was decided when nothing was', () => {
    expect(
      summarise(
        resultOf({
          requested: 1,
          refused: [{ id: 'a', status: 403, error: 'Not yours' }],
        }),
        'accepted',
      ),
    ).toBe('0 contributions accepted, 1 could not be.');
  });
});
