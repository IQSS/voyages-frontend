import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import type {
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Form, message } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { loadingCellSelector } from '@/components/PresentationComponents/Contribute/commons/LoadingCell';
import { useColumnNewVoyagesDefs } from '@/components/PresentationComponents/Contribute/commons/useColumnDefs';
import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import {
  TransformedContribution,
  transformContributionData,
} from '@/components/PresentationComponents/Contribute/utils/transformContributionData';
import {
  deleteContribution,
  fetchContributionsDataByAuthor,
} from '@/fetch/contributeFetch/fetchContributionsData';
import { useNavigation } from '@/hooks/useNavigation';
import { usePageRouter } from '@/hooks/usePageRouter';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';
import { useVoyageContribution } from '@/hooks/useVoyageContribution';
import { RootState } from '@/redux/store';
import { loadContributionRoot } from '@/utils/contribute/loadContributionRoot';
import { getDisplayButtons } from '@/utils/functions/contribuitePath';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

/** Rows per request, matching the Edit Requests grid. */
const WIP_BLOCK_SIZE = 50;

const SORT_FIELDS: Record<string, string> = {
  voyage_id: 'voyage_id',
  comments: 'comments',
  status: 'status',
  timestamp: 'timestamp',
};

const sortParams = (
  sortModel: { colId: string; sort: string }[] | undefined,
): Record<string, string> => {
  const first = sortModel?.[0];
  const field = first && SORT_FIELDS[first.colId];
  return field
    ? { sortBy: field, sortOrder: first.sort === 'desc' ? 'DESC' : 'ASC' }
    : {};
};

export const useContributeNewVoyages = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);

  const translatedContribute = translationLanguagesContribute(languageValue);
  const { contributePath } = usePageRouter();
  const { handleClickSideBar } = useNavigation();
  const buttons = getDisplayButtons(translatedContribute);

  const [form] = Form.useForm();
  const gridRef = useRef<AgGridReact<TransformedContribution>>(null);
  const { buildNewVoyagesFilterQuery } = useSearchEditRequestsFilters(
    form,
    gridRef,
  );

  const { contributions, setSelectedContribution, updateFormEntity } =
    useVoyageContribution();

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

  const getRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
      // The row opens the contribution form on click (except the Action cell).
      cursor: 'pointer',
    }),
    [],
  );

  const [totalContributions, setTotalContributions] = useState(0);

  // Status filter (undefined = all of the contributor's contributions). Held in
  // a ref so the datasource closure, built once, reads the current value.
  const [statusFilter, setStatusFilter] = useState<
    ContributionStatus | undefined
  >(undefined);
  const statusRef = useRef<ContributionStatus | undefined>(undefined);

  // The grid asks for one block at a time as it is scrolled, the way Edit
  // Requests does. Fetching the whole list meant taking whatever single page
  // the server would give -- ten by default, five hundred at most -- and a
  // contributor with more drafts than that had no way to reach the rest.
  //
  // Read the query through a ref so the datasource, which is built once, always
  // sees the current one.
  const buildQueryRef = useRef(buildNewVoyagesFilterQuery);
  buildQueryRef.current = buildNewVoyagesFilterQuery;

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const page = Math.floor(params.startRow / WIP_BLOCK_SIZE) + 1;
        const query = new URLSearchParams(buildQueryRef.current());
        query.set('page', String(page));
        query.set('limit', String(WIP_BLOCK_SIZE));
        if (statusRef.current !== undefined) {
          query.set('status', String(statusRef.current));
        } else {
          // Default view leaves out Published: they are the bulk of the list
          // and are not what an editor is reviewing. Selecting "Published" in
          // the filter still lists them.
          query.set('exclude_status', String(ContributionStatus.Published));
        }
        Object.entries(sortParams(params.sortModel)).forEach(([k, v]) =>
          query.set(k, v),
        );
        try {
          const response = await fetchContributionsDataByAuthor(
            query.toString(),
          );
          const rows = (response?.data || []).map(transformContributionData);
          const total =
            typeof response?.total === 'number' ? response.total : -1;
          setTotalContributions(total > 0 ? total : rows.length);
          params.successCallback(rows, total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      event.api.setGridOption('datasource', datasource);
    },
    [datasource],
  );

  /** Re-ask the server for every block, after something changed underneath. */
  const refreshTable = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  useEffect(() => {
    const state = location.state as { reload?: boolean };
    if (state?.reload && user?.email) {
      refreshTable();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user?.email, refreshTable]);

  const handleEditContribution = useCallback(
    async (data: TransformedContribution) => {
      if (!data) return;
      const isExistingVoyage = data.root.type === 'existing';
      const { entity: entityToUse, warning } = await loadContributionRoot(
        data.root.schema,
        data.root.id,
        isExistingVoyage,
      );
      if (warning) message.warning(warning, 8);

      const editableContribution: Contribution = {
        ...data,
        root: {
          ...data.root,
          type: (isExistingVoyage ? 'existing' : 'new') as 'existing' | 'new',
        },
      };

      updateFormEntity(entityToUse);
      setSelectedContribution(editableContribution);
      navigate(`/contribute/interim/new/${data.id}`, {
        state: {
          formEntity: entityToUse,
          selectedContribution: editableContribution,
          formMode: ReviewMode.Edit,
        },
      });
    },
    [navigate, setSelectedContribution, updateFormEntity],
  );

  const handleDelete = useCallback(
    async (contributionId: string) => {
      try {
        await deleteContribution(contributionId);
        message.success('Contribution deleted successfully');
        refreshTable();
      } catch {
        message.error('Failed to delete contribution');
      }
    },
    [refreshTable],
  );

  const columnDefs = useColumnNewVoyagesDefs(
    handleEditContribution,
    handleDelete,
  );

  // Clicking anywhere on a row (except the Action column, which owns the
  // pencil/trash) opens the contribution form for that draft -- a quick way
  // back into an unsubmitted contribution, alongside the pencil icon.
  const onStatusChange = useCallback((next?: ContributionStatus) => {
    statusRef.current = next;
    setStatusFilter(next);
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  const handleRowClick = useCallback(
    ({
      data,
      event,
    }: {
      data?: TransformedContribution;
      event?: Event | null;
    }) => {
      if (!data || !event) return;
      const target = event.target as HTMLElement | null;
      const colId = target?.closest('.ag-cell')?.getAttribute('col-id') ?? '';
      if (colId === 'action') return;
      handleEditContribution(data);
    },
    [handleEditContribution],
  );

  return {
    gridRef,
    form,
    contributions,
    totalContributions,
    onGridReady,
    refreshTable,
    contributePath,
    buttons,
    translatedContribute,
    handleClickSideBar,
    columnDefs,
    defaultColDef,
    getRowStyle,
    handleRowClick,
    statusFilter,
    onStatusChange,
  };
};
