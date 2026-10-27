import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { describe, expect, it } from 'vitest';

import type { BatchWithContributions } from '@/fetch/contributeFetch/batchApi';
import {
  getBatchPublishability,
  isContributionSelectable,
  isSettledStatus,
  summariseBlockers,
} from '@/utils/contribute/batchPublishability';

// Batch list responses aggregate counts without shipping contribution diffs.
const batchOf = (
  ...statuses: ContributionStatus[]
): BatchWithContributions => ({
  id: 1,
  title: 'Batch',
  comments: '',
  published: null,
  contributionCount: statuses.length,
  statusCounts: statuses.reduce<Partial<Record<ContributionStatus, number>>>(
    (counts, status) => {
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    },
    {},
  ),
});

const { WorkInProgress, Submitted, Accepted, Rejected, Published } =
  ContributionStatus;

describe('getBatchPublishability', () => {
  it('publishes a batch whose contributions are all accepted', () => {
    const result = getBatchPublishability(batchOf(Accepted, Accepted));
    expect(result.publishable).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.total).toBe(2);
    expect(result.counts.accepted).toBe(2);
  });

  it('publishes when rejected contributions sit alongside accepted ones', () => {
    // The server only refuses on *undecided* contributions; a rejection is a
    // decision, and publication simply skips it.
    const result = getBatchPublishability(batchOf(Accepted, Rejected));
    expect(result.publishable).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('refuses while any contribution is still awaiting a decision', () => {
    const result = getBatchPublishability(batchOf(Accepted, Submitted));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe(
      '1 contribution still awaiting an editorial decision.',
    );
  });

  it('counts multiple undecided contributions in the reason', () => {
    const result = getBatchPublishability(batchOf(Submitted, Submitted));
    expect(result.reason).toBe(
      '2 contributions still awaiting an editorial decision.',
    );
  });

  it('refuses a batch holding nothing accepted', () => {
    // Batch 15 as it stood: one contribution, still being edited.
    const result = getBatchPublishability(batchOf(WorkInProgress));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe('Nothing in this batch is accepted yet.');
  });

  it('refuses an empty batch, and says so differently', () => {
    const result = getBatchPublishability(batchOf());
    expect(result.publishable).toBe(false);
    expect(result.total).toBe(0);
    expect(result.reason).toBe(
      'This batch is empty. Assign accepted contributions to it first.',
    );
  });

  it('names the already-published case rather than saying nothing is accepted', () => {
    // Batch 13 after its publish: the contribution moved to Published, so a
    // bare "nothing is accepted" would read as though work had gone missing.
    const result = getBatchPublishability(batchOf(Published));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe(
      'Everything in this batch has already been published.',
    );
  });

  it('reports a mixed batch as not accepted rather than already published', () => {
    // Batch 14: work in progress plus one already out. Not the same case.
    const result = getBatchPublishability(
      batchOf(
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        Published,
      ),
    );
    expect(result.total).toBe(7);
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe('Nothing in this batch is accepted yet.');
  });

  it('treats a create response with no aggregate counts as empty', () => {
    // Create/update responses carry no aggregate counts; that must not crash.
    const result = getBatchPublishability({
      id: 1,
      title: 'Batch',
      comments: '',
      published: null,
    } as BatchWithContributions);
    expect(result.total).toBe(0);
    expect(result.publishable).toBe(false);
  });
});

describe('summariseBlockers', () => {
  const textOf = (batch: BatchWithContributions) =>
    summariseBlockers(getBatchPublishability(batch)).map((b) => b.text);

  it('says nothing when the batch is ready', () => {
    expect(textOf(batchOf(Accepted))).toEqual([]);
  });

  it('names undecided contributions', () => {
    expect(textOf(batchOf(Submitted, Accepted))).toEqual([
      '1 awaiting decision',
    ]);
  });

  it('reports several blockers separately', () => {
    expect(textOf(batchOf(Submitted, WorkInProgress))).toEqual([
      '1 awaiting decision',
      '1 still being edited',
    ]);
  });

  it('carries the status so the caller can link to those rows', () => {
    const blockers = summariseBlockers(
      getBatchPublishability(batchOf(Submitted, WorkInProgress)),
    );
    expect(blockers.map((b) => b.status)).toEqual([Submitted, WorkInProgress]);
    expect(blockers.map((b) => b.count)).toEqual([1, 1]);
  });

  it('reports nothing for an empty batch', () => {
    // The empty case is already stated by the publishability reason and the
    // contributions chip; repeating it here would just be a third voice.
    expect(textOf(batchOf())).toEqual([]);
  });

  it('mentions already-published only when nothing is accepted', () => {
    expect(textOf(batchOf(Published, Accepted))).toEqual([]);
    expect(textOf(batchOf(Published, WorkInProgress))).toEqual([
      '1 still being edited',
      '1 already published',
    ]);
  });
});

describe('isSettledStatus', () => {
  it('treats published and rejected as settled', () => {
    expect(isSettledStatus(Published)).toBe(true);
    expect(isSettledStatus(Rejected)).toBe(true);
  });

  it('leaves everything still in play open', () => {
    expect(isSettledStatus(WorkInProgress)).toBe(false);
    expect(isSettledStatus(Submitted)).toBe(false);
    expect(isSettledStatus(Accepted)).toBe(false);
  });
});

describe('isContributionSelectable', () => {
  it('refuses a published contribution', () => {
    // Moving one between batches would strip the record of what its batch
    // published -- the case that prompted the guard.
    expect(isContributionSelectable({ data: { status: Published } })).toBe(
      false,
    );
  });

  it('allows a rejected contribution (so it can be bulk-deleted/rejected)', () => {
    // Only Published is locked; Rejected is selectable so the bulk actions can
    // act on it. Assigning it to a batch is still refused downstream.
    expect(isContributionSelectable({ data: { status: Rejected } })).toBe(true);
  });

  it('allows contributions still in play', () => {
    for (const status of [WorkInProgress, Submitted, Accepted]) {
      expect(isContributionSelectable({ data: { status } })).toBe(true);
    }
  });

  it('allows a row whose page has not loaded', () => {
    // The grid is infinite-scroll: placeholder rows arrive with no data, and
    // refusing those would make the checkbox flicker as pages land.
    expect(isContributionSelectable({ data: null })).toBe(true);
    expect(isContributionSelectable({})).toBe(true);
  });
});
