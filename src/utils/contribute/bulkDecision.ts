/**
 * Deciding a selection of contributions in one action.
 *
 * The server decides them one at a time and answers for each, and it caps how
 * many one request may carry. Both facts surface here rather than in the
 * component: the selection is split into requests, the answers are added back
 * together, and what comes out is a single tally the editor can read.
 *
 * Nothing here decides anything. It splits, adds up, and phrases. The rules
 * about who may move what live on the server, which is the only place they can
 * be enforced.
 */

import {
  BULK_STATUS_LIMIT,
  BulkStatusRefusal,
  BulkStatusResult,
} from '@/fetch/contributeFetch/bulkUpdateContributionStatus';

export const chunkIds = (
  ids: string[],
  size: number = BULK_STATUS_LIMIT,
): string[][] => {
  if (size < 1) {
    return ids.length > 0 ? [ids] : [];
  }
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

export const emptyResult = (): BulkStatusResult => ({
  requested: 0,
  changed: [],
  unchanged: [],
  refused: [],
});

export const mergeResults = (
  a: BulkStatusResult,
  b: BulkStatusResult,
): BulkStatusResult => ({
  requested: a.requested + b.requested,
  changed: [...a.changed, ...b.changed],
  unchanged: [...a.unchanged, ...b.unchanged],
  refused: [...a.refused, ...b.refused],
});

/**
 * Refusals gathered by the reason they share.
 *
 * A thousand drafts refused for one reason is one thing to understand and act
 * on, not a thousand. Listing them individually would bury that, and the ids
 * are only useful for finding the rows again afterwards.
 */
export interface RefusalGroup {
  error: string;
  details?: string;
  ids: string[];
}

export const groupRefusals = (refused: BulkStatusRefusal[]): RefusalGroup[] => {
  const groups = new Map<string, RefusalGroup>();
  for (const refusal of refused) {
    const key = `${refusal.error} ${refusal.details ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.ids.push(refusal.id);
    } else {
      groups.set(key, {
        error: refusal.error,
        ...(refusal.details ? { details: refusal.details } : {}),
        ids: [refusal.id],
      });
    }
  }
  // Commonest first: the reason that stopped the most work is the one worth
  // reading, and it is not necessarily the one that came back first.
  return [...groups.values()].sort((x, y) => y.ids.length - x.ids.length);
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/**
 * What landed, in one sentence.
 *
 * Says what changed before what did not. An editor who accepted nine hundred
 * drafts and was refused two has done the thing they set out to do, and a
 * message led by the failure would read as though they had not.
 */
export const summarise = (result: BulkStatusResult, verb: string): string => {
  const parts = [`${plural(result.changed.length, 'contribution')} ${verb}`];
  if (result.unchanged.length > 0) {
    parts.push(`${result.unchanged.length} already ${verb}`);
  }
  if (result.refused.length > 0) {
    parts.push(`${result.refused.length} could not be`);
  }
  return `${parts.join(', ')}.`;
};
