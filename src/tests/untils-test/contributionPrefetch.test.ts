import { beforeEach, describe, expect, test, vi } from 'vitest';

const fetchContribution = vi.fn();
vi.mock('@/fetch/contributeFetch/fetchContributionsData', () => ({
  fetchContributionByIdForEditor: (id: string) => fetchContribution(id),
}));
vi.mock('@/utils/contribute/loadContributionRoot', () => ({
  loadContributionRoot: async () => ({ entity: { entityRef: { id: 1 } } }),
}));

const { loadContribution, prefetchContribution } =
  await import('@/utils/contribute/contributionPrefetch');

const contribution = (id: string) => ({
  id,
  root: { schema: 'Voyage', id, type: 'new' },
});

describe('contribution prefetch', () => {
  beforeEach(() => {
    fetchContribution.mockReset();
    fetchContribution.mockImplementation(async (id: string) =>
      contribution(id),
    );
  });

  test('opening a prefetched contribution does not fetch it again', async () => {
    prefetchContribution('a');
    prefetchContribution('a');
    const { contribution: loaded } = await loadContribution('a');
    expect(loaded.id).toBe('a');
    expect(fetchContribution).toHaveBeenCalledTimes(1);
  });

  test('a prefetch is used once, so the next visit is fresh', async () => {
    prefetchContribution('b');
    await loadContribution('b');
    await loadContribution('b');
    expect(fetchContribution).toHaveBeenCalledTimes(2);
  });

  test('a failed prefetch is fetched again when opened', async () => {
    fetchContribution.mockRejectedValueOnce(new Error('offline'));
    prefetchContribution('c');
    await new Promise((r) => setTimeout(r, 0));
    const { contribution: loaded } = await loadContribution('c');
    expect(loaded.id).toBe('c');
    expect(fetchContribution).toHaveBeenCalledTimes(2);
  });
});
