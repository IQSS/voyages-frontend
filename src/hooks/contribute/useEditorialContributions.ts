/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-backed list state for the editorial platform pages (Voyages /
 * Enslavers / Enslaved). Each page is one entity kind, selected by `rootSchema`
 * and read from `/contributions?root_schema=…`.
 *
 * Rows load through AG Grid's infinite row model — the same scrolling model the
 * Edit Requests table uses — so the grid fetches a block at a time as the
 * editor scrolls, rather than paging through a footer control.
 *
 * The header's "N contributions awaiting review" is the count of Submitted
 * rows for the same filter, fetched as a cheap sibling call (limit=1, read for
 * its `total`) so the number is accurate rather than counted from one block.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import {
  AllCommunityModule,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { message } from 'antd';

import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';

// Infinite row model lives in the community module. Registration is global and
// idempotent, so doing it here means these pages work whether or not the Edit
// Requests table (which also registers it) has been mounted.
ModuleRegistry.registerModules([AllCommunityModule]);

const BLOCK_SIZE = 50;
const SEARCH_DEBOUNCE_DELAY = 500;

// AG Grid column ids the backend can order by, mapped to its sort keys. Any
// other colId is ignored, so the server falls back to its default ordering.
const SORTABLE_COL_MAP: Record<string, string> = {
  voyage_id: 'voyage_id',
  timestamp: 'timestamp',
  contributor: 'author',
  status: 'status',
  // Denormalised onto contributions.shipName on the server so it can be ordered.
  shipName: 'shipName',
};

const buildQuery = (params: Record<string, string>): string =>
  new URLSearchParams(params).toString();

export interface EditorialContributionsGrid {
  gridRef: React.MutableRefObject<any>;
  onGridReady: (event: { api: any }) => void;
  totalCount: number;
  pendingCount: number;
  searchInput: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
  status?: ContributionStatus;
  onStatusChange: (status?: ContributionStatus) => void;
  refresh: () => void;
  blockSize: number;
}

export function useEditorialContributions<T>(
  rootSchema: string,
  mapRow: (c: Contribution) => T,
): EditorialContributionsGrid {
  const gridRef = useRef<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Uncommitted box value vs the committed term that drives the fetch. The
  // committed term lives in a ref so the datasource closure (built once) always
  // reads the current value; a change purges the grid's cache to refetch.
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef('');

  // Status filter (undefined = the default, everything except Published). Held
  // in a ref for the same reason as search: the datasource closure reads it live.
  const [status, setStatus] = useState<ContributionStatus | undefined>(
    undefined,
  );
  const statusRef = useRef<ContributionStatus | undefined>(undefined);

  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const refresh = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  const refreshPendingCount = useCallback(() => {
    const filter: Record<string, string> = {
      root_schema: rootSchema,
      status: String(ContributionStatus.Submitted),
    };
    if (searchRef.current) filter.search = searchRef.current;
    fetchContributionsData(1, 1, buildQuery(filter))
      .then((res) => setPendingCount(res?.total ?? 0))
      .catch(() => setPendingCount(0));
  }, [rootSchema]);

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const page = Math.floor(params.startRow / BLOCK_SIZE) + 1;
        const filter: Record<string, string> = { root_schema: rootSchema };
        if (searchRef.current) filter.search = searchRef.current;
        if (statusRef.current !== undefined) {
          filter.status = String(statusRef.current);
        } else {
          // Default view leaves out Published: they are the bulk of the table
          // (tens of thousands) and are not what an editor is reviewing.
          // Selecting "Published" in the filter still lists them.
          filter.exclude_status = String(ContributionStatus.Published);
        }

        const sort = params.sortModel?.[0];
        const sortBy = sort ? SORTABLE_COL_MAP[sort.colId] : undefined;
        const sortOrder = sortBy ? (sort.sort as 'asc' | 'desc') : undefined;

        try {
          const res = await fetchContributionsData(
            page,
            BLOCK_SIZE,
            buildQuery(filter),
            sortBy,
            sortOrder,
          );
          const data: Contribution[] = res?.data ?? [];
          const rows = data.map((c) => mapRowRef.current(c));
          const total = res?.total ?? -1;
          setTotalCount(total > 0 ? total : rows.length);
          // Refresh the "awaiting review" count alongside the first block, so
          // it tracks the active filter without its own trigger.
          if (params.startRow === 0) refreshPendingCount();
          params.successCallback(rows, total);
        } catch (error) {
          message.error('Failed to load contributions');
          console.error('Editorial contributions load error:', error);
          params.failCallback();
        }
      },
    }),
    [rootSchema, refreshPendingCount],
  );

  const onGridReady = useCallback(
    (event: { api: any }) => {
      event.api.setGridOption('datasource', datasource);
    },
    [datasource],
  );

  // Debounced search commit; a new term purges the cache so the grid refetches
  // from the top, and refreshes the awaiting-review count.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = useCallback(
    (value: string, immediate = false) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const apply = () => {
        searchRef.current = value.trim();
        refresh();
        refreshPendingCount();
      };
      if (immediate) apply();
      else debounceRef.current = setTimeout(apply, SEARCH_DEBOUNCE_DELAY);
    },
    [refresh, refreshPendingCount],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => commit(e.target.value),
    [commit],
  );

  const onSearch = useCallback(
    (value: string) => commit(value, true),
    [commit],
  );

  const onStatusChange = useCallback(
    (next?: ContributionStatus) => {
      statusRef.current = next;
      setStatus(next);
      refresh();
    },
    [refresh],
  );

  return {
    gridRef,
    onGridReady,
    totalCount,
    pendingCount,
    searchInput,
    onSearchChange,
    onSearch,
    status,
    onStatusChange,
    refresh,
    blockSize: BLOCK_SIZE,
  };
}
