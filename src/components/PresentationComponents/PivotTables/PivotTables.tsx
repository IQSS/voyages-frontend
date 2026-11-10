import { useMemo, useState, useEffect, useCallback, useRef } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Pagination } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPivotCrosstabsCSV } from '@/fetch/voyagesFetch/fetchPivotCrosstabsCSV';
import { fetchPivotCrosstabsTables } from '@/fetch/voyagesFetch/fetchPivotCrosstabsTables';
import { usePageRouter } from '@/hooks/usePageRouter';
import {
  setPivotTable,
  setPivotValueOptions,
  setRowsPerPage,
} from '@/redux/getPivotTablesDataSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  PivotCrosstabResponse,
  PivotSort,
} from '@/share/InterfaceTypePivotTable';
import {
  AutoCompleteInitialState,
  CurrentPageInitialState,
  LabelFilterMeneList,
  PivotTablesPropsRequest,
  FilterObjectsState,
  PivotRowVar,
  PivotColumnVar,
  PivotCellVar,
} from '@/share/InterfaceTypes';
import VOYAGE_PIVOT_OPTIONS from '@/utils/flatfiles/voyages/voyages_pivot_options.json';
import { filtersDataSend } from '@/utils/functions/filtersDataSend';
import {
  getColorBTNVoyageDatasetBackground,
  getColorBoxShadow,
  getColorHoverBackground,
  getHeaderColomnColor,
} from '@/utils/functions/getColorStyle';
import { getRowsPerPage } from '@/utils/functions/getRowsPerPage';
import '@/style/table.scss';
import { downLoadText } from '@/utils/languages/title_pages';

import { SelectDropdownPivotable } from '../../SelectorComponents/SelectDrowdown/SelectDropdownPivotable';

import PivotHtmlTable from './PivotHtmlTable';

const PivotTables = () => {
  const dispatch: AppDispatch = useDispatch();
  const latestRequest = useRef(0);

  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { autoLabelName } = useSelector(
    (state: RootState) => state.autoCompleteList as AutoCompleteInitialState,
  );
  const { rangeSliderMinMax: rang, varName } = useSelector(
    (state: RootState) => state.rangeSlider as FilterObjectsState,
  );
  const { currentPage } = useSelector(
    (state: RootState) => state.getScrollPage as CurrentPageInitialState,
  );
  const { styleName } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );
  const { geoTreeValue } = useSelector(
    (state: RootState) => state.getGeoTreeData,
  );
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );
  const { styleName: styleNameRoute } = usePageRouter();
  const { clusterNodeKeyVariable, clusterNodeValue } = useSelector(
    (state: RootState) => state.getNodeEdgesAggroutesMapData,
  );
  const { filtersObj } = useSelector((state: RootState) => state.getFilter);
  const { table, pivotValueOptions, rowsPerPage } = useSelector(
    (state: RootState) => state.getPivotTablesData,
  );

  const [rowVars, setSelectRowValues] = useState<PivotRowVar[]>([]);
  const [columnVars, setSelectColumnValue] = useState<PivotColumnVar[]>([]);
  const [cellVars, setSelectCellValue] = useState<PivotCellVar[]>([]);
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<PivotSort | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const VoyagePivotTableOptions = useCallback(() => {
    Object.entries(VOYAGE_PIVOT_OPTIONS).forEach(([key, value]) => {
      if (key === 'row_vars' && Array.isArray(value)) {
        const pivotRowVars: PivotRowVar[] = (value as PivotRowVar[]).map(
          (item: PivotRowVar) => ({
            rows: item.rows,
            binsize: item.binsize,
            rows_label: item.rows_label,
            label: item.label,
          }),
        );
        setSelectRowValues(pivotRowVars);
      } else if (key === 'column_vars' && Array.isArray(value)) {
        const pivotColumnVars: PivotColumnVar[] = (
          value as PivotColumnVar[]
        ).map((item: PivotColumnVar) => ({
          columns: item.columns,
          label: item.label,
        }));
        setSelectColumnValue(pivotColumnVars);
      } else if (key === 'cell_vars' && Array.isArray(value)) {
        const pivotCellVars: PivotCellVar[] = (value as PivotCellVar[]).map(
          (item: PivotCellVar) => ({
            value_field: item.value_field,
            label: item.label,
            agg_fn: item.agg_fn,
          }),
        );
        setSelectCellValue(pivotCellVars);
      }
    });
  }, []);

  const { row_vars, rows_label, binsize, column_vars, cell_vars, agg_fn } =
    pivotValueOptions;
  const updatedRowsValue = row_vars.replace(/_(\d+)$/, '');
  const updatedRowsLabel = rows_label.replace(/_(\d+)$/, '');

  const filters = useMemo(
    () =>
      filtersDataSend(
        filtersObj,
        styleName!,
        clusterNodeKeyVariable,
        clusterNodeValue,
      ),
    [filtersObj, styleName, clusterNodeKeyVariable, clusterNodeValue],
  );
  const newFilters = useMemo(() => {
    return filters?.map(({ ...rest }) => rest) || [];
  }, [filters]);

  const dataSend: PivotTablesPropsRequest = useMemo(() => {
    const baseDataSend: PivotTablesPropsRequest = {
      columns: column_vars,
      rows: updatedRowsValue,
      rows_label: updatedRowsLabel,
      agg_fn: agg_fn,
      binsize: binsize,
      value_field: cell_vars,
      filter: newFilters || [],
    };
    if (inputSearchValue) {
      baseDataSend.global_search = inputSearchValue;
    }
    return baseDataSend;
  }, [
    column_vars,
    updatedRowsValue,
    updatedRowsLabel,
    agg_fn,
    binsize,
    cell_vars,
    newFilters,
    inputSearchValue,
  ]);

  const fetchData = useCallback(async () => {
    const requestId = ++latestRequest.current;
    dispatch(setPivotTable(null));
    setLoading(true);
    setError(null);
    try {
      const response = await dispatch(
        fetchPivotCrosstabsTables(dataSend),
      ).unwrap();
      if (response && requestId === latestRequest.current) {
        dispatch(setPivotTable(response.data as PivotCrosstabResponse));
      }
    } catch {
      if (requestId === latestRequest.current)
        setError('Could not load pivot table.');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [dispatch, dataSend]);

  useEffect(() => {
    VoyagePivotTableOptions();
    fetchData();
    const headerColor = getHeaderColomnColor(styleNameRoute!);

    document.documentElement.style.setProperty(
      '--pagination-table--',
      headerColor,
    );
    const handleResize = () => {
      dispatch(
        setRowsPerPage(getRowsPerPage(window.innerWidth, window.innerHeight)),
      );
    };

    window.addEventListener('resize', handleResize);
    return () => {
      latestRequest.current += 1;
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtersObj,
    pivotValueOptions.cell_vars,
    pivotValueOptions.column_vars,
    pivotValueOptions.row_vars,
    pivotValueOptions.rows_label,
    pivotValueOptions.binsize,
    pivotValueOptions.agg_fn,
    varName,
    rang,
    currentPage,
    autoLabelName,
    geoTreeValue,
    inputSearchValue,
    styleNameRoute,
    VoyagePivotTableOptions,
    dispatch,
  ]);

  useEffect(() => {
    setSort(null);
  }, [pivotValueOptions]);

  useEffect(() => {
    setPage(1);
  }, [table]);

  const handleSort = useCallback((column: string | null) => {
    setSort((previous) =>
      previous && previous.column === column
        ? {
            column,
            direction: previous.direction === 'asc' ? 'desc' : 'asc',
          }
        : { column, direction: column === null ? 'asc' : 'desc' },
    );
    setPage(1);
  }, []);

  const handleChangeOptions = useCallback(
    (
      value: string | string[],
      name: string,
      options?: PivotRowVar[] | PivotCellVar[],
    ) => {
      if (name === 'row_vars' && options) {
        const selectedRow = (options as PivotRowVar[]).find(
          (row) => row.rows === value,
        );
        if (selectedRow) {
          dispatch(
            setPivotValueOptions({
              ...pivotValueOptions,
              [name]: selectedRow.rows,
              binsize: selectedRow.binsize ?? null,
              rows_label: selectedRow.rows_label ?? '',
              label: selectedRow.label ?? '',
            }),
          );
        }
      } else if (name === 'column_vars') {
        dispatch(
          setPivotValueOptions({
            ...pivotValueOptions,
            [name]: Array.isArray(value) ? value : [value],
          }),
        );
      } else if (name === 'cell_vars' && options) {
        const [valueField, aggFn] = (value as string).split('|');
        dispatch(
          setPivotValueOptions({
            ...pivotValueOptions,
            cell_vars: valueField,
            agg_fn: aggFn,
          }),
        );
      } else {
        dispatch(
          setPivotValueOptions({
            ...pivotValueOptions,
            [name]: value,
          }),
        );
      }
    },
    [dispatch, pivotValueOptions],
  );

  const handleButtonExportCSV = useCallback(async () => {
    setDownloading(true);
    try {
      const request: PivotTablesPropsRequest = sort
        ? {
            ...dataSend,
            order_by: [
              `${sort.direction === 'desc' ? '-' : ''}${
                sort.column ?? updatedRowsLabel
              }`,
            ],
          }
        : dataSend;
      const blob = await fetchPivotCrosstabsCSV(request);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'voyages_pivot_table.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log('error', error);
    } finally {
      setDownloading(false);
    }
  }, [dataSend, sort, updatedRowsLabel]);

  const handleChangePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangePageSize = useCallback(
    (_current: number, size: number) => {
      dispatch(setRowsPerPage(size));
      setPage(1);
    },
    [dispatch],
  );

  let DownloadCSVExport = '';
  for (const header of downLoadText.title) {
    DownloadCSVExport = (header.label as LabelFilterMeneList)[languageValue];
  }

  return (
    <div className="mobile-responsive">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column' as const,
        }}
      >
        <SelectDropdownPivotable
          selectedPivottablesOptions={pivotValueOptions}
          selectRowValue={rowVars}
          selectColumnValue={columnVars}
          selectCellValue={cellVars}
          handleChangeOptions={handleChangeOptions}
        />
        <span className="tableContainer-pivot  ">
          <div className="button-export-csv">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleButtonExportCSV}
              loading={downloading}
              disabled={loading || !table}
              style={{
                backgroundColor: getColorBTNVoyageDatasetBackground(styleName!),
                borderColor: getColorBTNVoyageDatasetBackground(styleName!),
                boxShadow: getColorBoxShadow(styleName!),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getColorHoverBackground(
                  styleName!,
                );
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  getColorBTNVoyageDatasetBackground(styleName!);
              }}
            >
              {DownloadCSVExport}
            </Button>
          </div>
        </span>

        {loading && <div role="status">Loading pivot table…</div>}
        {error && (
          <div role="alert">
            {error}{' '}
            <button type="button" onClick={fetchData}>
              Retry
            </button>
          </div>
        )}
        {table && (
          <>
            <PivotHtmlTable
              table={table}
              sort={sort}
              onSort={handleSort}
              page={page}
              pageSize={rowsPerPage}
              headerColor={getHeaderColomnColor(styleName!)}
            />
            <div className="pivot-table-pagination-container">
              <Pagination
                current={page}
                total={table.rows.length}
                pageSize={rowsPerPage}
                pageSizeOptions={[
                  '5',
                  '10',
                  '15',
                  '20',
                  '25',
                  '30',
                  '45',
                  '50',
                  '100',
                ]}
                showSizeChanger={true}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
                onChange={handleChangePage}
                onShowSizeChange={handleChangePageSize}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PivotTables;
