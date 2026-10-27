/**
 * The list a contribution was opened from, kept so its page can step to the
 * previous or next one in the same order, filter and sort.
 */
export interface ContributionNavList {
  /** Which table the list came from; each detail page reads its own. */
  source: 'editorial' | 'welcome';
  /** Ids by row position; null where the table had not loaded the row. */
  ids: (string | null)[];
  total: number;
  pageSize: number;
  /** What the table fetched with, to load more rows the same way. */
  query: Record<string, string | undefined>;
}

const storageKey = (source: ContributionNavList['source']) =>
  `contributionNav:${source}`;

// Session storage, so a refresh keeps the list; it can be unavailable.
export const saveNavList = (list: ContributionNavList) => {
  try {
    sessionStorage.setItem(storageKey(list.source), JSON.stringify(list));
  } catch {
    // Without storage the page simply shows no navigation.
  }
};

export const loadNavList = (
  source: ContributionNavList['source'],
): ContributionNavList | undefined => {
  try {
    const raw = sessionStorage.getItem(storageKey(source));
    return raw ? (JSON.parse(raw) as ContributionNavList) : undefined;
  } catch {
    return undefined;
  }
};

interface GridRows {
  forEachNode: (
    callback: (node: {
      rowIndex: number | null;
      data?: { id: string };
    }) => void,
  ) => void;
}

/** The ids a grid has loaded, by row position. */
export const idsFromGrid = (api: GridRows | undefined): (string | null)[] => {
  const ids: (string | null)[] = [];
  api?.forEachNode(({ rowIndex, data }) => {
    if (rowIndex !== null && data?.id) ids[rowIndex] = data.id;
  });
  return Array.from(ids, (id) => id ?? null);
};

/** The 1-based page holding a row position. */
export const pageOf = (index: number, pageSize: number) =>
  Math.floor(index / pageSize) + 1;

/** `ids` with one page of fetched ids put in place. */
export const withPage = (
  ids: (string | null)[],
  page: number,
  pageSize: number,
  pageIds: string[],
): (string | null)[] => {
  const next = [...ids];
  const start = (page - 1) * pageSize;
  pageIds.forEach((id, i) => {
    next[start + i] = id;
  });
  return Array.from(next, (id) => id ?? null);
};
