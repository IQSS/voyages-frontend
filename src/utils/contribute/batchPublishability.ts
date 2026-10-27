/**
 * Whether a batch can be published, decided from the contributions the batch
 * list already carries.
 *
 * The server refuses a batch for two distinct reasons, and both are knowable
 * before asking it:
 *
 * - any contribution still Submitted — "Batch has contributions without an
 *   editorial decision"
 * - nothing Accepted — "No accepted contributions found in batch"
 *
 * Deciding it here turns a round trip and a refusal into a disabled button with
 * the reason attached. The rules are duplicated from the server on purpose: this
 * is a courtesy check, and the server stays the authority. If the two ever
 * disagree the publish is still refused correctly — the button is just wrong
 * about it.
 */

import { ContributionStatus } from '@slavevoyages/voyages-contribute';

import type { BatchWithContributions } from '@/fetch/contributeFetch/batchApi';

export interface BatchStatusCounts {
  workInProgress: number;
  submitted: number;
  accepted: number;
  rejected: number;
  published: number;
}

export interface BatchPublishability {
  /** How many contributions the batch holds, whatever their status. */
  total: number;
  counts: BatchStatusCounts;
  publishable: boolean;
  /**
   * Why not, in words for the editor. Null when the batch is publishable, so
   * the caller can key a tooltip off its presence.
   */
  reason: string | null;
}

const emptyCounts = (): BatchStatusCounts => ({
  workInProgress: 0,
  submitted: 0,
  accepted: 0,
  rejected: 0,
  published: 0,
});

const COUNT_KEY: Partial<Record<ContributionStatus, keyof BatchStatusCounts>> =
  {
    [ContributionStatus.WorkInProgress]: 'workInProgress',
    [ContributionStatus.Submitted]: 'submitted',
    [ContributionStatus.Accepted]: 'accepted',
    [ContributionStatus.Rejected]: 'rejected',
    [ContributionStatus.Published]: 'published',
  };

const countByStatus = (
  statusCounts: BatchWithContributions['statusCounts'],
): BatchStatusCounts => {
  const counts = emptyCounts();
  for (const [status, count] of Object.entries(statusCounts ?? {})) {
    const key = COUNT_KEY[Number(status) as ContributionStatus];
    // An unrecognised status is left out rather than folded into another
    // bucket, which would shift the counts away from what the editor can see.
    if (key) {
      counts[key] += count;
    }
  }
  return counts;
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/**
 * Phrased as what the editor has to *do*, not as what the batch lacks — the
 * message appears next to a disabled button, where "why can't I click this"
 * is the only question being asked.
 */
const explain = (counts: BatchStatusCounts, total: number): string | null => {
  if (total === 0) {
    return 'This batch is empty. Assign accepted contributions to it first.';
  }
  if (counts.submitted > 0) {
    return `${plural(counts.submitted, 'contribution')} still awaiting an editorial decision.`;
  }
  if (counts.accepted === 0) {
    if (counts.published === total) {
      return 'Everything in this batch has already been published.';
    }
    return 'Nothing in this batch is accepted yet.';
  }
  return null;
};

export const getBatchPublishability = (
  batch: BatchWithContributions,
): BatchPublishability => {
  const counts = countByStatus(batch.statusCounts);
  const total = batch.contributionCount ?? 0;
  const reason = explain(counts, total);
  return {
    total,
    counts,
    // Mirrors the server: every contribution decided, and at least one accepted.
    publishable: counts.submitted === 0 && counts.accepted > 0,
    reason,
  };
};

/**
 * Whether a contribution is still open to editorial action.
 *
 * Published and rejected are settled: neither can publish, and a published
 * contribution is the record of what its batch published — moving it leaves
 * that batch attributed to somebody for work it no longer contains.
 *
 * Mirrors the guard in `assignContributionToBatch`. The server refuses these
 * either way; this only keeps the UI from offering the choice.
 */
export const isSettledStatus = (status: ContributionStatus): boolean =>
  status === ContributionStatus.Published ||
  status === ContributionStatus.Rejected;

/**
 * Why a contribution's checkbox is inert, in one line for a tooltip. Null when
 * the row is selectable and there is nothing to explain.
 *
 * A disabled control with no reason reads as a broken one — the editor sees a
 * checkbox that will not tick and has no way to learn that this is deliberate.
 */
export const explainNotSelectable = (
  status: ContributionStatus | undefined,
): string | null => {
  if (status === ContributionStatus.Published) {
    return 'Already published. Its batch is the record of what it published, so it cannot be moved.';
  }
  return null;
};

/**
 * Row-level predicate for the editorial grid's selection checkboxes. Rows that
 * have not loaded yet stay selectable — an infinite-scroll grid renders
 * placeholder rows with no data, and refusing those would make the checkbox
 * flicker as pages arrive.
 *
 * Only Published is locked: it cannot be moved or deleted. Everything else,
 * including Rejected, is selectable so the bulk actions (delete / reject /
 * approve) can act on it. A bulk action that does not apply to a given row —
 * assigning a rejected row to a batch, say — is refused server-side and
 * reported back, rather than being blocked here for every action at once.
 */
export const isContributionSelectable = (row: {
  data?: { status?: ContributionStatus } | null;
}): boolean => {
  const status = row?.data?.status;
  return status === undefined || status !== ContributionStatus.Published;
};

/**
 * One group of contributions standing in the way of publishing a batch.
 *
 * Carries the status as well as the wording so the caller can offer a way
 * through to exactly those contributions. A count on its own answers "how
 * many" but not "which", and on a batch of 1,401 that is the only question
 * worth asking.
 */
export interface BatchBlocker {
  status: ContributionStatus;
  count: number;
  /** e.g. "2 awaiting decision" */
  text: string;
}

/**
 * What stands between a batch and publication, grouped by status. Empty when
 * nothing does.
 */
export const summariseBlockers = (
  publishability: BatchPublishability,
): BatchBlocker[] => {
  const { counts, total } = publishability;
  if (total === 0) {
    return [];
  }
  const blockers: BatchBlocker[] = [];
  if (counts.submitted > 0) {
    blockers.push({
      status: ContributionStatus.Submitted,
      count: counts.submitted,
      text: `${counts.submitted} awaiting decision`,
    });
  }
  if (counts.workInProgress > 0) {
    blockers.push({
      status: ContributionStatus.WorkInProgress,
      count: counts.workInProgress,
      text: `${counts.workInProgress} still being edited`,
    });
  }
  // Only worth saying when nothing is accepted: otherwise the batch publishes
  // regardless and the already-published ones are simply along for the ride.
  if (counts.accepted === 0 && counts.published > 0) {
    blockers.push({
      status: ContributionStatus.Published,
      count: counts.published,
      text: `${counts.published} already published`,
    });
  }
  return blockers;
};
