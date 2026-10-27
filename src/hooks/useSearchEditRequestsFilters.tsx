/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';

import { RootState } from '@/redux/store';

// Types
export interface ContributionFilters {
  status?: ContributionStatus;
  author: string;
  voyageId: string;
  shipName: string;
  nationality: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  publicationBatch: number | string;
  reviewer: string;
  search?: string;
}

const initialFilters: ContributionFilters = {
  status: undefined,
  author: '',
  voyageId: '',
  shipName: '',
  nationality: '',
  dateRange: null,
  publicationBatch: '',
  reviewer: '',
  search: '',
};
export interface NewVoyagesFilters {
  author?: string;
}

// Custom hooks
export const useSearchEditRequestsFilters = (
  form: any,
  gridRef?: any,
  /**
   * Filters to open with, for arriving from somewhere that already knows what
   * the editor is looking for — the publish screen links through to the exact
   * contributions holding a batch back. Read once, at mount; from then on the
   * filter panel owns them like any other.
   */
  seed?: Partial<ContributionFilters>,
) => {
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const [newVoyagesFilters, setNewVoyagesFilters] = useState<NewVoyagesFilters>(
    { author: user?.email },
  );

  // The status (or "all except Published") is added by the Welcome table.
  const buildNewVoyagesFilterQuery = useCallback((): string => {
    const params = new URLSearchParams();
    if (user?.email) params.append('author', user.email);
    return params.toString();
  }, [user?.email]);
  // `useState`'s initial value, not an effect: seeding after the first render
  // would fire one unfiltered fetch of every contribution before narrowing.
  const [filters, setFilters] = useState<ContributionFilters>(() => ({
    ...initialFilters,
    ...seed,
  }));

  // Mirror the seed into the filter panel, which reads from the form rather
  // than from `filters`. Without this the grid is filtered while the panel
  // shows nothing, and Clear does not appear to have anything to clear.
  useEffect(() => {
    if (seed && Object.keys(seed).length > 0) {
      form.setFieldsValue(seed);
    }
    // Once, at mount: afterwards the panel is authoritative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildExisingVoyagesFilterQuery = useCallback((): string => {
    const params = new URLSearchParams();
    params.append('status', '0');
    if (user?.email) params.append('author', user.email);
    return params.toString();
  }, [user?.email]);

  const buildFilterQuery = useCallback(
    (filters: ContributionFilters): string => {
      const params = new URLSearchParams();

      if (filters.status !== undefined)
        params.append('status', String(filters.status));
      // No status chosen: default to everything except Published, so the list
      // is not swamped by the (tens of thousands of) published rows. Picking a
      // specific status -- Published included -- sends that status instead.
      else
        params.append('exclude_status', String(ContributionStatus.Published));

      if (filters.author) params.append('author', String(filters.author));
      if (filters.voyageId) params.append('voyageId', String(filters.voyageId));
      if (filters.shipName) params.append('shipName', String(filters.shipName));
      if (filters.nationality)
        params.append('nationality', filters.nationality);
      // `batch_id` on the wire, `publicationBatch` in this hook's state. The
      // server has always read `batch_id` -- it is what `assign_to_batch` takes
      // and what tests/api.http documents -- so sending the state's own name
      // filtered nothing: the batch half of a request was dropped in silence
      // and the results came back filtered by status alone.
      if (filters.publicationBatch)
        params.append('batch_id', String(filters.publicationBatch));
      if (filters.reviewer) params.append('reviewer', filters.reviewer);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateRange?.[0])
        params.append('dateFrom', filters.dateRange[0].toISOString());
      if (filters.dateRange?.[1])
        params.append('dateTo', filters.dateRange[1].toISOString());

      return params.toString();
    },
    [],
  );

  const handleFilterChange = useCallback(
    (field: keyof ContributionFilters, value: any) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    form.resetFields();
    gridRef?.current?.api.refreshInfiniteCache();
  }, [form, gridRef]);

  const handleApplyFilters = useCallback(() => {
    gridRef?.current?.api.refreshInfiniteCache();
  }, [gridRef]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'status') return value !== undefined;
      if (key === 'dateRange')
        return value !== null && (value[0] !== null || value[1] !== null);
      return value !== '';
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'status') return value !== undefined;
      if (key === 'dateRange')
        return value !== null && (value[0] !== null || value[1] !== null);
      return value !== '';
    }).length;
  }, [filters]);

  return {
    filters,
    setFilters,
    buildFilterQuery,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,
    hasActiveFilters,
    activeFilterCount,
    buildNewVoyagesFilterQuery,
    newVoyagesFilters,
    setNewVoyagesFilters,
    buildExisingVoyagesFilterQuery,
  };
};
