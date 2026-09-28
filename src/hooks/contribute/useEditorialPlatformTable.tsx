/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ContributionStatus,
  getSchema,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
  Contribution,
} from '@slavevoyages/voyages-contribute';
import type {
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { loadingCellSelector } from '@/components/PresentationComponents/Contribute/commons/LoadingCell';
import { useColumnDefs } from '@/components/PresentationComponents/Contribute/commons/useColumnDefs';
import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import {
  transformContributionData,
  TransformedContribution,
} from '@/components/PresentationComponents/Contribute/utils/transformContributionData';
import { bulkDeleteContributions } from '@/fetch/contributeFetch/bulkDeleteContributions';
import {
  bulkUpdateContributionStatus,
  BulkStatusResult,
} from '@/fetch/contributeFetch/bulkUpdateContributionStatus';
import { SubmissionRejectedError } from '@/fetch/contributeFetch/createSubmitChangeContribution';
import {
  fetchContributionByIdForEditor,
  fetchContributionsData,
} from '@/fetch/contributeFetch/fetchContributionsData';
import {
  PublicationConflict,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';
import { submitReview } from '@/fetch/contributeFetch/submitReview';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';
import { RootState } from '@/redux/store';
import { explainNotSelectable } from '@/utils/contribute/batchPublishability';
import {
  chunkIds,
  emptyResult,
  mergeResults,
  summarise,
} from '@/utils/contribute/bulkDecision';
import { loadColumnVisibility } from '@/utils/contribute/columnVisibilityStore';
import { loadContributionRoot } from '@/utils/contribute/loadContributionRoot';
import {
  materializeContributionRoot,
  unloadedExistingRoot,
} from '@/utils/contribute/materializeVoyage';
const REQUESTS_PATH = '/contribute/editor_main/requests';

const BLOCK_SIZE = 50;
const SEARCH_DEBOUNCE_DELAY = 500;

// AG Grid column ids the backend can order by, mapped to its column names.
// Only these carry a sort affordance (see useColumnDefs); the mapping is 1:1,
// but kept explicit so any other colId is ignored rather than forwarded.
const SORTABLE_COL_MAP: Record<string, string> = {
  author: 'author',
  timestamp: 'timestamp',
  comments: 'comments',
  status: 'status',
  decidedBy: 'decidedBy',
  batch: 'batch',
  // Materialized from root.id; the server orders it by a JSON path (best-effort
  // for new-voyage uuids).
  voyage_id: 'voyage_id',
  // Denormalised onto columns on the server (contributions.shipName /
  // contributions.nationality) so they can be ordered.
  shipName: 'shipName',
  nationality: 'nationality',
};

// Submitted rows first, then newest by timestamp within each group
const sortBlock = (
  rows: TransformedContribution[],
): TransformedContribution[] =>
  rows.slice().sort((a, b) => {
    const aRank = a.status === ContributionStatus.Submitted ? 0 : 1;
    const bRank = b.status === ContributionStatus.Submitted ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf();
  });

export const useEditorialPlatformTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { batches } = useBatchManagement({ autoFetch: true });

  /**
   * The contribution that was just submitted, so the contributor lands on it
   * rather than hunting for it.
   *
   * The datasource hoists it to the top of the first block itself. It used to
   * be fetched separately and handed to the grid as a pinned row as well, which
   * drew it twice -- once above the body and once in its own place in the list
   * -- and the pinned copy carried no checkbox, so the row you saw first was
   * the one you could not select. Leaving it to the datasource keeps it a row
   * like any other.
   */
  const submittedId = ((location.state as any)?.submittedId ??
    new URLSearchParams(location.search).get('submitted') ??
    null) as string | null;
  const submittedIdRef = useRef<string | null>(submittedId);
  const [decidedId, setDecidedId] = useState<string | null>(null);
  const decidedHoistRef = useRef<string | null>(null);

  // ── Contribution detail state ──────────────────────────────────────────────
  const [active, setActive] = useState<Contribution | undefined>(undefined);
  const [contributionId, setContributionId] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<
    ContributionStatus | undefined
  >(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mode, setMode] = useState(ReviewMode.ReadOnly);
  const [savedContributionState, setSavedContributionState] = useState<
    Contribution | undefined
  >(undefined);
  const [fetchedEntity, setFetchedEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);
  // Set when the existing voyage behind the open contribution failed to load.
  const [entityLoadWarning, setEntityLoadWarning] = useState<
    string | undefined
  >(undefined);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [batchManagementVisible, setBatchManagementVisible] = useState(false);
  const [batchAssignmentVisible, setBatchAssignmentVisible] = useState(false);
  const [bulkDeciding, setBulkDeciding] = useState(false);
  // Held after a bulk decision only when something was refused. A run where
  // everything landed says so in a line and needs no report.
  const [bulkResult, setBulkResult] = useState<BulkStatusResult | null>(null);
  // The past-participle verb of the last bulk action ("accepted" / "rejected" /
  // "deleted"), so the refusal report is worded to match what was attempted.
  const [bulkVerb, setBulkVerb] = useState<string>('accepted');
  // A decision the server refused because the contribution is not ready.
  // Held rather than announced: it names the fields an editor has to go and
  // fill in, which a message that fades cannot carry.
  const [decisionBlocked, setDecisionBlocked] = useState<{
    conflicts: PublicationConflict[];
    validation: PublicationValidation[];
    reason: string;
  } | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // ── Form + grid refs ───────────────────────────────────────────────────────
  const [form] = Form.useForm();
  const gridRef = useRef<any>(null);

  const {
    filters,
    buildFilterQuery,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,
    hasActiveFilters,
    activeFilterCount,
    // Arriving from the publish screen, which links through to the exact
    // contributions holding a batch back. Read from the route rather than the
    // URL to keep the address bar free of transient filter state.
  } = useSearchEditRequestsFilters(
    form,
    gridRef,
    (location.state as any)?.filters,
  );

  // ── Infinite row model datasource ─────────────────────────────────────────
  // Use refs so the datasource closure (created once) always reads fresh values
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const buildFilterQueryRef = useRef(buildFilterQuery);
  buildFilterQueryRef.current = buildFilterQuery;

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const page = Math.floor(params.startRow / BLOCK_SIZE) + 1;
        const filterQuery = buildFilterQueryRef.current(filtersRef.current);
        // Infinite row model: AG Grid does not sort on the client. A header
        // click re-requests rows with the chosen sort in params.sortModel,
        // which the datasource must honour by fetching server-sorted rows.
        const sort = params.sortModel?.[0];
        const sortBy = sort ? SORTABLE_COL_MAP[sort.colId] : undefined;
        const sortOrder = sortBy ? (sort.sort as 'asc' | 'desc') : undefined;
        const userSortActive = Boolean(sortBy);
        try {
          const response = await fetchContributionsData(
            page,
            BLOCK_SIZE,
            filterQuery,
            sortBy,
            sortOrder,
          );
          const fetched: TransformedContribution[] = (response.data ?? []).map(
            transformContributionData,
          );
          // With a user sort active, keep the server's order untouched — the
          // default submitted-first re-sort would scramble it. Only the
          // no-sort default gets the submitted-first grouping and the hoist.
          let rows = userSortActive ? fetched : sortBlock(fetched);
          const total = response.total ?? -1;

          // On first page, pin the just-submitted row to position 0
          if (page === 1 && submittedIdRef.current) {
            const pinnedId = submittedIdRef.current;
            submittedIdRef.current = null; // only pin once
            decidedHoistRef.current = null;
            const alreadyIn = rows.find((r) => r.id === pinnedId);
            if (alreadyIn) {
              rows = [alreadyIn, ...rows.filter((r) => r.id !== pinnedId)];
            } else {
              try {
                const data = await fetchContributionByIdForEditor(pinnedId);
                rows = [transformContributionData(data), ...rows];
              } catch {
                // if fetch fails, just show normal order
              }
            }
          }

          setTotalCount(total > 0 ? total : rows.length);
          params.successCallback(rows, total);
        } catch {
          params.failCallback();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      event.api.setGridOption('datasource', datasource);
      // Reapply the editor's saved column visibility on top of the defaults.
      const saved = loadColumnVisibility();
      if (saved) {
        event.api.applyColumnState({
          state: Object.entries(saved).map(([colId, hide]) => ({
            colId,
            hide,
          })),
        });
      }
    },
    [datasource],
  );

  // Purge cache when filters change (skip initial mount — onGridReady handles first load)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    gridRef.current?.api?.purgeInfiniteCache();
  }, [filters]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id && id !== contributionId) {
      setContributionId(id);
    } else if (!id && contributionId) {
      setContributionId('');
    }
  }, [id, contributionId]);

  // Load contribution by URL id (deep links / page refresh)
  useEffect(() => {
    if (!id) {
      setActive(undefined);
      setReviews([]);
      setCurrentStatus(undefined);
      setContributionId('');
      setSavedContributionState(undefined);
      setMode(ReviewMode.ReadOnly);
      setFetchedEntity(undefined);
      setEntityLoadWarning(undefined);
      return;
    }

    if ((active as TransformedContribution)?.id === id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchContributionByIdForEditor(id);
        const contribution = transformContributionData(data);
        setActive(contribution);
        setCurrentStatus(contribution.status);
        setSavedContributionState(contribution);
        setMode(ReviewMode.ReadOnly);
        setReviews(contribution.reviews || []);
      } catch (err) {
        console.error('Error loading contribution by ID:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.email]);

  // Fetch entity whenever the active contribution changes
  useEffect(() => {
    if (!active) {
      setFetchedEntity(undefined);
      setEntityLoadWarning(undefined);
      return;
    }

    const fetchEntity = async () => {
      const changes = active.changeSet?.changes;
      if (!changes?.length) return;

      const entityRef = changes[0].entityRef;
      const isExistingVoyage = active.root.type === 'existing';

      setEntityLoadWarning(undefined);
      const { entity, warning } = await loadContributionRoot(
        entityRef.schema,
        entityRef.id,
        isExistingVoyage,
      );
      setFetchedEntity(entity);
      setEntityLoadWarning(warning);
    };

    fetchEntity();
  }, [(active as TransformedContribution)?.id]);

  // ── Grid column definitions ────────────────────────────────────────────────
  const columnDefs = useColumnDefs();

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: { paddingTop: '12px', fontSize: '13px' },
      // Rows still loading show a placeholder bar, not the columns' defaults.
      cellRendererSelector: loadingCellSelector,
    }),
    [],
  );

  const selectionColumnDef = useMemo(
    () => ({
      headerName: 'Assign to\nbatch',
      width: 100,
      resizable: true,
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      // Published rows are not selectable (they cannot be moved or deleted).
      // Without a reason the checkbox just refuses to tick, which reads as a
      // broken control rather than a deliberate one. The grid has
      // `enableBrowserTooltips`, so this surfaces as the native title.
      tooltipValueGetter: (params: any) =>
        explainNotSelectable(params.data?.status) ?? undefined,
    }),
    [],
  );

  const getRowStyle = useCallback(
    (params: any) => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
      ...(params?.node?.rowPinned === 'top'
        ? { background: '#f6ffed', borderBottom: '2px solid #b7eb8f' }
        : {}),
    }),
    [],
  );

  const getRowClass = useCallback(
    (params: any) => {
      const striping = params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
      return decidedId && params?.data?.id === decidedId
        ? `${striping} decided-row`
        : striping;
    },
    [decidedId],
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const empty = useMemo(() => {
    if (!active) return undefined;
    if (fetchedEntity) return fetchedEntity;
    if (active.changeSet?.changes.length > 0) {
      const schema = active.changeSet.changes[0].entityRef.schema;
      const entityId = active.changeSet.changes[0].entityRef.id;
      // Until the fetch answers, an existing voyage is still an existing one.
      return active.root.type === 'existing'
        ? unloadedExistingRoot(getSchema(schema), entityId)
        : materializeContributionRoot(getSchema(schema), entityId);
    }
    return undefined;
  }, [active, fetchedEntity]);

  const shouldShowDetail = Boolean(
    id &&
    active &&
    (active as TransformedContribution).id === id &&
    active.changeSet,
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  // The search box is decoupled from the committed filter: `searchInput` keeps
  // the field responsive on every keystroke, while the committed `filters.search`
  // (which drives the fetch, via the [filters] purge effect) is only updated
  // once typing settles. Without this, every keystroke committed a filter change
  // and refetched a block. The previous setTimeout guard read `filters.search`
  // from a stale closure, so it never fired at all.
  const [searchInput, setSearchInput] = useState<string>(filters.search ?? '');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        handleFilterChange('search', value);
      }, SEARCH_DEBOUNCE_DELAY);
    },
    [handleFilterChange],
  );

  // Keep the box in step when the committed value changes elsewhere — Clear
  // resets filters.search to '' and the field must follow. During typing the
  // committed value only catches up on the debounced commit, which matches what
  // is already shown, so this is a no-op then.
  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  // Drop a pending debounce on unmount so it cannot fire into a gone component.
  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    [],
  );

  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    const selectedIds = selectedNodes?.map((node: any) => node.data.id) || [];
    setSelectedRows(selectedIds);
  }, []);

  useEffect(() => {
    if (!decidedId) return;
    const stillOnTheList = location.pathname.startsWith(REQUESTS_PATH);
    const openedAnother = contributionId !== '' && contributionId !== decidedId;
    if (!stillOnTheList || openedAnother) {
      setDecidedId(null);
    }
  }, [location.pathname, contributionId, decidedId]);

  const closeDetail = useCallback(() => {
    setActive(undefined);
    setReviews([]);
    setCurrentStatus(undefined);
    setContributionId('');
    setSavedContributionState(undefined);
    setMode(ReviewMode.ReadOnly);
    setFetchedEntity(undefined);
    setEntityLoadWarning(undefined);
    navigate(REQUESTS_PATH, { replace: true });
  }, [navigate]);

  const handleStatusChange = useCallback(
    async (
      contribId: string,
      newStatus: ContributionStatus,
      decisionComments?: string,
    ) => {
      try {
        await updateContributionStatus(contribId, newStatus, decisionComments);
        setDecidedId(contribId);
        decidedHoistRef.current = contribId;
        message.success(
          newStatus === ContributionStatus.Accepted
            ? 'Contribution accepted.'
            : newStatus === ContributionStatus.Rejected
              ? 'Contribution rejected.'
              : newStatus === ContributionStatus.Submitted
                ? 'Reopened for editing — it is back in the submitted queue.'
                : 'Contribution status updated.',
        );
        gridRef.current?.api?.purgeInfiniteCache();
        closeDetail();
      } catch (error) {
        if (error instanceof SubmissionRejectedError) {
          setDecisionBlocked({
            conflicts: error.conflicts,
            validation: error.validation,
            reason: error.message,
          });
          return;
        }
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [closeDetail],
  );

  const handleReviewSubmit = useCallback(
    async (review: Review) => {
      if (!id) {
        message.error('Contribution ID is missing');
        return;
      }
      try {
        const hideLoading = message.loading('Submitting review...', 0);
        await submitReview(id, review);
        hideLoading();

        const updatedReviews = [...reviews, review];
        setReviews(updatedReviews);

        if (active?.changeSet) {
          const updated: Contribution = {
            ...active,
            reviews: updatedReviews,
            changeSet: active.changeSet,
          };
          setSavedContributionState(updated);
          setActive(updated);
        }

        setMode(ReviewMode.ReadOnly);
        message.success('Review submitted successfully');
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Failed to submit review';
        message.error(msg);
      }
    },
    [reviews, active, id],
  );

  const handleReviewCancel = useCallback(() => {
    if (savedContributionState) setActive(savedContributionState);
    setMode(ReviewMode.ReadOnly);
    message.info('Review cancelled - changes discarded');
  }, [savedContributionState]);

  const handleStartReview = useCallback(() => {
    if (active) setSavedContributionState(active);
    setMode(ReviewMode.Review);
  }, [active]);

  const handleRowClick = useCallback(
    ({ data, event }: any) => {
      if (!event || !data) return;

      const target = event.target as HTMLElement;
      const isCheckboxClick =
        target.closest('.ag-selection-checkbox') ||
        target.closest('.ag-checkbox-input');
      const colId = target.closest('.ag-cell')?.getAttribute('col-id');
      if (
        isCheckboxClick ||
        (colId && ['status', 'ag-Grid-SelectionColumn'].includes(colId))
      )
        return;

      setActive(data);
      setCurrentStatus(data.status);
      setContributionId(data.id);
      setSavedContributionState(data);
      setMode(ReviewMode.ReadOnly);
      navigate(`/contribute/editor_main/requests/${data.id}`);
    },
    [navigate],
  );

  const handleBackClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeDetail();
    },
    [closeDetail],
  );

  const handleOnEditorialDecision = useCallback(
    (decision: 'accept' | 'reject', decisionComments?: string) => {
      const newStatus =
        decision === 'accept'
          ? ContributionStatus.Accepted
          : ContributionStatus.Rejected;
      handleStatusChange(contributionId, newStatus, decisionComments);
    },
    [contributionId, handleStatusChange],
  );

  /**
   * Put an accepted contribution back in the submitted queue.
   *
   * No comment goes with it. A decision comment records the reasoning for a
   * decision, and reopening undoes one rather than making another — the server
   * clears the comment along with the status either way.
   */
  const handleReopenContribution = useCallback(() => {
    if (!contributionId) {
      message.error('Contribution ID is missing');
      return;
    }
    handleStatusChange(contributionId, ContributionStatus.Submitted);
  }, [contributionId, handleStatusChange]);

  const handleGridRefresh = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  /**
   * Decide every selected contribution.
   *
   * Sent in chunks because the server caps how many one request may carry, and
   * the chunks are sent one after another rather than together: they are
   * writes, and the server decides each contribution against the row as it
   * stands, so overlapping requests would be racing each other over the same
   * rows the editor just ticked.
   *
   * The grid is refreshed and the selection cleared whatever the outcome. Some
   * of the rows have moved, so the selection no longer describes what is on
   * screen, and leaving the boxes ticked invites deciding them a second time.
   */
  const handleBulkDecision = useCallback(
    async (newStatus: ContributionStatus, verb: string) => {
      if (selectedRows.length === 0) {
        return;
      }
      setBulkVerb(verb);
      setBulkDeciding(true);
      const hideLoading = message.loading(
        `Deciding ${selectedRows.length} contributions...`,
        0,
      );
      try {
        let total = emptyResult();
        for (const chunk of chunkIds(selectedRows)) {
          const result = await bulkUpdateContributionStatus(chunk, newStatus);
          total = mergeResults(total, result);
        }
        hideLoading();
        if (total.refused.length > 0) {
          setBulkResult(total);
          message.warning(summarise(total, verb));
        } else {
          message.success(summarise(total, verb));
        }
      } catch (error) {
        hideLoading();
        message.error(
          error instanceof Error
            ? error.message
            : 'Failed to decide the selected contributions',
        );
        console.error('Bulk decision error:', error);
      } finally {
        setBulkDeciding(false);
        gridRef.current?.api?.purgeInfiniteCache();
        gridRef.current?.api?.deselectAll();
        setSelectedRows([]);
      }
    },
    [selectedRows],
  );

  // Bulk delete mirrors the bulk decision flow: chunk the selection, tally the
  // per-id outcome, and surface any refusals (e.g. Published contributions the
  // server will not delete). Deleting is irreversible, so the menu item guards
  // it behind a confirm before calling this.
  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) {
      return;
    }
    setBulkVerb('deleted');
    setBulkDeciding(true);
    const hideLoading = message.loading(
      `Deleting ${selectedRows.length} contributions...`,
      0,
    );
    try {
      let total = emptyResult();
      for (const chunk of chunkIds(selectedRows)) {
        const result = await bulkDeleteContributions(chunk);
        total = mergeResults(total, result);
      }
      hideLoading();
      if (total.refused.length > 0) {
        setBulkResult(total);
        message.warning(summarise(total, 'deleted'));
      } else {
        message.success(summarise(total, 'deleted'));
      }
    } catch (error) {
      hideLoading();
      message.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete the selected contributions',
      );
      console.error('Bulk delete error:', error);
    } finally {
      setBulkDeciding(false);
      gridRef.current?.api?.purgeInfiniteCache();
      gridRef.current?.api?.deselectAll();
      setSelectedRows([]);
    }
  }, [selectedRows]);

  const handleClearSelection = useCallback(() => {
    gridRef.current?.api.deselectAll();
    setSelectedRows([]);
  }, []);

  return {
    // Grid
    gridRef,
    datasource,
    onGridReady,
    columnDefs,
    defaultColDef,
    selectionColumnDef,
    getRowStyle,
    getRowClass,
    totalCount,
    isLoading,

    // Contribution detail
    active,
    setActive,
    contributionId,
    currentStatus,
    reviews,
    mode,
    fetchedEntity,
    empty,
    entityLoadWarning,
    shouldShowDetail,
    accessLevel: PropertyAccessLevel.Editor,

    // UI state
    showFilters,
    setShowFilters,
    selectedRows,
    setSelectedRows,
    batchManagementVisible,
    setBatchManagementVisible,
    batchAssignmentVisible,
    setBatchAssignmentVisible,

    // Filters
    filters,
    form,
    hasActiveFilters,
    activeFilterCount,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,
    // The uncommitted search box value; the debounced commit lands in filters.
    searchInput,

    // Batches
    batches,

    // Handlers
    handleSearchChange,
    onSelectionChanged,
    handleStatusChange,
    handleReviewSubmit,
    handleReviewCancel,
    handleStartReview,
    handleRowClick,
    handleBackClick,
    handleOnEditorialDecision,
    handleReopenContribution,
    handleGridRefresh,
    handleClearSelection,
    handleBulkDecision,
    handleBulkDelete,
    bulkDeciding,
    bulkResult,
    bulkVerb,
    setBulkResult,
    decisionBlocked,
    dismissDecisionBlocked: () => setDecisionBlocked(null),
  };
};
