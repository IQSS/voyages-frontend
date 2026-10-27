import { Contribution } from '@slavevoyages/voyages-contribute';

import { fetchContributionByIdForEditor } from '@/fetch/contributeFetch/fetchContributionsData';

import { loadContributionRoot } from './loadContributionRoot';

type Loaded = {
  contribution: Contribution;
  root: Awaited<ReturnType<typeof loadContributionRoot>>;
};

// Contributions fetched ahead of a Previous / Next click, by id.
const cache = new Map<string, Promise<Loaded>>();
const MAX_ENTRIES = 6;

const load = async (id: string): Promise<Loaded> => {
  const contribution: Contribution = await fetchContributionByIdForEditor(id);
  const root = await loadContributionRoot(
    contribution.root.schema,
    contribution.root.id,
    contribution.root.type === 'existing',
  );
  return { contribution, root };
};

/** Starts loading a contribution and the entity its form opens on. */
export const prefetchContribution = (id: string | null | undefined) => {
  if (!id || cache.has(id)) return;
  const pending = load(id);
  // A failed prefetch is dropped; opening it fetches again.
  pending.catch(() => cache.delete(id));
  cache.set(id, pending);
  if (cache.size > MAX_ENTRIES) {
    cache.delete(cache.keys().next().value as string);
  }
};

/**
 * The contribution and its root entity, from a prefetch when there is one.
 * Each prefetch is used once, so the next visit reads fresh data.
 */
export const loadContribution = (id: string): Promise<Loaded> => {
  const pending = cache.get(id);
  cache.delete(id);
  return pending ?? load(id);
};
