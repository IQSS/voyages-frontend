/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Pagination } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { CustomLoadingOverlay } from '@/components/CommonComponts/CustomLoadingOverlay';
import CardModal from '@/components/PresentationComponents/Cards/CardModal';
import ModalNetworksGraph from '@/components/PresentationComponents/NetworkGraph/ModalNetworksGraph';
import ButtonDropdownColumnSelector from '@/components/SelectorComponents/ButtonComponents/ButtonDropdownColumnSelector';
import DownloadCSV from '@/components/SelectorComponents/ButtonComponents/DownloadCSV';
import { fetchEnslavedOptionsList } from '@/fetch/pastEnslavedFetch/fetchPastEnslavedOptionsList';
import { fetchEnslaversOptionsList } from '@/fetch/pastEnslaversFetch/fetchPastEnslaversOptionsList';
import { fetchVoyageOptionsAPI } from '@/fetch/voyagesFetch/fetchVoyageOptionsAPI';
import useDataTableProcessingEffect from '@/hooks/useDataTableProcessingEffect';
import { useOtherTableCellStructure } from '@/hooks/useOtherTableCellStructure';
import { usePageRouter } from '@/hooks/usePageRouter';
import { useTableCellStructure } from '@/hooks/useTableCellStructure';
import { setVisibleColumn } from '@/redux/getColumnSlice';
import { initializeSortColumn, setData, setPage } from '@/redux/getTableSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  FilterObjectsState,
  TableListPropsRequest,
} from '@/share/InterfaceTypes';
import {
  StateRowData,
  TableCellStructureInitialStateProp,
  TableCellStructure,
} from '@/share/InterfaceTypesTable';
import {
  checkPagesRouteForEnslaved,
  checkPagesRouteForEnslavers,
  checkPagesRouteForVoyages,
} from '@/utils/functions/checkPagesRoute';
import { filtersDataSend } from '@/utils/functions/filtersDataSend';
import { getHeaderColomnColor } from '@/utils/functions/getColorStyle';
import { getRowHeightTable } from '@/utils/functions/getRowHeightTable';
import { getRowsPerPage } from '@/utils/functions/getRowsPerPage';

import CustomHeaderTable from '../../NavigationComponents/Header/CustomHeaderTable';

import '@/style/table.scss';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register the module
ModuleRegistry.registerModules([
  AllCommunityModule, // or AllEnterpriseModule
]);

const Tables: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { styleName: styleNameRoute, currentBlockName } = usePageRouter();
  const { rangeSliderMinMax } = useSelector(
    (state: RootState) => state.rangeSlider as FilterObjectsState,
  );
  const { filtersObj } = useSelector((state: RootState) => state.getFilter);
  const { textFilterValue } = useSelector(
    (state: RootState) => state.autoCompleteList,
  );
  const { reloadTable } = useSelector(
    (state: RootState) => state.getSaveSearch,
  );

  const { viewAll, textFilter } = useSelector(
    (state: RootState) => state.getShowFilterObject,
  );
  const { visibleColumnCells } = useSelector(
    (state: RootState) =>
      state.getColumns as TableCellStructureInitialStateProp,
  );
  const [dataTable, setDataTable] = useState<Record<string, any>[]>([]);

  const { columnDefs, rowData, page } = useSelector(
    (state: RootState) => state.getTableData as StateRowData,
  );

  const { isChangeGeoTree } = useSelector(
    (state: RootState) => state.getGeoTreeData,
  );
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const gridRef = useRef<any>(null);
  const [tablesCell, setTableCell] = useState<TableCellStructure[]>([]);
  const [currentColumnState, setCurrentColumnState] = useState<any[]>([]);
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );
  const { clusterNodeKeyVariable, clusterNodeValue } = useSelector(
    (state: RootState) => state.getNodeEdgesAggroutesMapData,
  );
  // Voyages States
  const { tableFlatfileVoyages } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );
  // Enslaved States
  const { tableFlatfileEnslaved } = useSelector(
    (state: RootState) => state.getPeopleEnlavedDataSetCollection,
  );
  const { currentEnslavedPage } = useSelector(
    (state: RootState) => state.getScrollEnslavedPage,
  );
  // Enslavers States
  const { tableFlatfileEnslavers } = useSelector(
    (state: RootState) => state.getEnslaverDataSetCollections,
  );

  const [rowsPerPage, setRowsPerPage] = useState(
    getRowsPerPage(window.innerWidth, window.innerHeight),
  );

  const otherTableCellStrructure = useOtherTableCellStructure(styleNameRoute!);
  const { sortColumn } = useSelector(
    (state: RootState) => state.getTableData as StateRowData,
  );

  useEffect(() => {
    if (otherTableCellStrructure?.default_order_by && sortColumn.length === 0) {
      dispatch(initializeSortColumn(otherTableCellStrructure.default_order_by));
    }
  }, [otherTableCellStrructure?.default_order_by, sortColumn.length, dispatch]);

  const {
    data: tableCellStructure,
    isLoading,
    isError,
  } = useTableCellStructure(styleNameRoute);

  useEffect(() => {
    if (!isLoading && !isError && tableCellStructure) {
      setTableCell(tableCellStructure as TableCellStructure[]);
    }

    if (tablesCell.length > 0) {
      const visibleColumns = tablesCell
        .filter((cell) => cell.visible)
        .map((cell) => cell.colID);
      dispatch(setVisibleColumn(visibleColumns));
      localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
    }

    const headerColor = getHeaderColomnColor(styleNameRoute!);
    document.documentElement.style.setProperty(
      '--pagination-table--',
      headerColor,
    );

    const handleResize = () => {
      setRowsPerPage(getRowsPerPage(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [
    dispatch,
    isLoading,
    isError,
    tableCellStructure,
    tablesCell,
    styleNameRoute,
  ]);

  const filters = useMemo(() => {
    return filtersDataSend(
      filtersObj,
      styleNameRoute!,
      clusterNodeKeyVariable,
      clusterNodeValue,
    );
  }, [filtersObj, styleNameRoute, clusterNodeKeyVariable, clusterNodeValue]);

  const stableFilters = useMemo(() => {
    return filters?.map(({ ...rest }) => rest) || [];
  }, [filters]);

  const stableSortColumn = useMemo(() => {
    return sortColumn;
  }, [sortColumn]);

  const dataSend = useMemo(() => {
    // Use the active sort column, or fall back to the default order so the
    // very first request already carries order_by (avoids a race condition
    // where the unsorted initial fetch overwrites the sorted second fetch).
    const effectiveOrderBy =
      stableSortColumn.length > 0
        ? stableSortColumn
        : otherTableCellStrructure?.default_order_by
          ? [otherTableCellStrructure.default_order_by]
          : [];

    const base: TableListPropsRequest = {
      filter: stableFilters,
      page: Number(page + 1),
      page_size: Number(rowsPerPage),
    };
    if (inputSearchValue) base.global_search = inputSearchValue;
    if (effectiveOrderBy.length) base.order_by = effectiveOrderBy;
    return base;
  }, [stableFilters, page, rowsPerPage, inputSearchValue, stableSortColumn, otherTableCellStrructure?.default_order_by]);

  const dataSendToDownloadCSV = useMemo(() => {
    const base: TableListPropsRequest = {
      filter: stableFilters,
    };
    return base;
  }, [stableFilters]);

  const isShowDownloadButton = checkPagesRouteForVoyages(styleNameRoute!);
  const shouldFetchData = useMemo(() => {
    return (
      (checkPagesRouteForVoyages(styleNameRoute!) &&
        (filtersObj || textFilterValue)) ||
      (checkPagesRouteForEnslaved(styleNameRoute!) &&
        (filtersObj || textFilterValue)) ||
      (checkPagesRouteForEnslavers(styleNameRoute!) &&
        (filtersObj || textFilterValue)) ||
      isChangeGeoTree ||
      rangeSliderMinMax
    );
  }, [
    styleNameRoute,
    filtersObj,
    textFilterValue,
    isChangeGeoTree,
    rangeSliderMinMax,
  ]);

  const fetchDataTable = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (checkPagesRouteForVoyages(styleNameRoute!)) {
        response = await dispatch(fetchVoyageOptionsAPI(dataSend)).unwrap();
      } else if (checkPagesRouteForEnslaved(styleNameRoute!)) {
        response = await dispatch(fetchEnslavedOptionsList(dataSend)).unwrap();
      } else if (checkPagesRouteForEnslavers(styleNameRoute!)) {
        response = await dispatch(fetchEnslaversOptionsList(dataSend)).unwrap();
      }

      if (response) {
        const { count, results } = response.data;
        setTotalResultsCount(Number(count));
        setDataTable(results);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, dataSend, styleNameRoute]);

  // Main data fetching effect
  useEffect(() => {
    fetchDataTable();
    return () => {
      if (!textFilter) {
        dispatch(setData([]));
      }
    };
  }, [
    dataSend,
    dispatch,
    reloadTable,
    rowsPerPage,
    page,
    currentEnslavedPage,
    inputSearchValue,
    currentBlockName,
    styleNameRoute,
    shouldFetchData,
    stableFilters,
    textFilter,
    fetchDataTable,
  ]);

  useDataTableProcessingEffect(
    dataTable,
    visibleColumnCells,
    tableFlatfileVoyages,
    tableFlatfileEnslaved,
    tableFlatfileEnslavers,
    tablesCell,
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: false,
      resizable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      headerComponent: CustomHeaderTable,
    }),
    [],
  );

  // Updated components memo to include handleSortChange

  const getRowRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
    }),
    [],
  );

  // Create a function to specifically save column order after dragging
  const handleColumnDragStop = useCallback(() => {
    if (gridRef.current?.api) {
      // Strip sort info — sorting is server-side, ag-grid must not re-sort on restore
      const columnState = gridRef.current.api.getColumnState().map((col: any) => ({
        ...col,
        sort: null,
        sortIndex: null,
      }));
      setCurrentColumnState(columnState);
      localStorage.setItem('columnState', JSON.stringify(columnState));

      // Extract visible columns for other parts of your app that need it
      const visibleColumns = columnState
        .filter((col: any) => !col.hide)
        .map((col: any) => col.colId);

      dispatch(setVisibleColumn(visibleColumns));
      localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
    }
  }, [dispatch]);

  // This function applies the column state whenever needed
  const applyColumnState = useCallback(() => {
    if (!gridRef.current?.api) return;

    // First try to use current state from component memory
    if (currentColumnState.length > 0) {
      gridRef.current.api.applyColumnState({
        state: currentColumnState,
        applyOrder: true,
      });
      return;
    }

    // Fallback to localStorage if needed
    const savedState = localStorage.getItem('columnState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        gridRef.current.api.applyColumnState({
          state: parsedState,
          applyOrder: true,
        });
        setCurrentColumnState(parsedState);
      } catch (error) {
        console.error('Error applying column state:', error);
      }
    }
  }, [currentColumnState]);

  // Use useEffect to reapply column state after the grid data updates or pagination
  useEffect(() => {
    // Short timeout to ensure grid is ready

    const timeoutId = setTimeout(() => {
      // removing this timeout seemed to reduce the bug occurrence for John? Unsure

      if (gridRef.current?.api && rowData.length > 0) {
        applyColumnState();
      }
    }, 100);
    // this is what causes the change of data in the table and is triggered by the page and row data variables and the apply column state function
    // Even though the data is being pulled correctly, it is not showing in the table...why is that? Tried using a reference variable to no avail, maybe try state?
    return () => clearTimeout(timeoutId);
  }, [rowData, applyColumnState, page]);

  // Add this useEffect to handle column visibility changes
  useEffect(() => {
    if (!gridRef.current?.api || !visibleColumnCells.length) return;

    // Get the current column state to preserve ordering
    const currentState = gridRef.current.api.getColumnState();

    // Create a map of visible/hidden status
    const visibilityMap = visibleColumnCells.reduce(
      (acc: Record<string, boolean>, colId: string) => {
        acc[colId] = true;
        return acc;
      },
      {},
    );

    // Apply new visibility while preserving order
    const newState = currentState.map((col: any) => ({
      ...col,
      hide: !visibilityMap[col.colId],
    }));

    // Apply the updated state
    gridRef.current.api.applyColumnState({
      state: newState,
      applyOrder: true,
    });

    // Save the updated state
    localStorage.setItem('columnState', JSON.stringify(newState));
    setCurrentColumnState(newState);
  }, [visibleColumnCells]);

  const handleChangePagePagination = useCallback(
    (newPage: number) => {
      // Save column state before pagination
      if (gridRef.current?.api) {
        setCurrentColumnState(gridRef.current.api.getColumnState());
      }
      dispatch(setPage(newPage - 1));
    },
    [dispatch],
  );

  // Add this new function to handle page size changes:
  const handlePageSizeChange = (current: number, size: number) => {
    if (gridRef.current?.api) {
      setCurrentColumnState(gridRef.current.api.getColumnState());
    }
    setRowsPerPage(size);
    dispatch(setPage(0));
  };

  const handleColumnVisibleChange = useCallback(
    (params: any) => {
      const allColumns = params.api.getColumns(); //* getAllColumns - removed, use api.getColumns instead. https://www.ag-grid.com/react-data-grid/upgrading-to-ag-grid-31/
      const visibleColumns =
        allColumns &&
        allColumns
          .filter((column: any) => column.isVisible())
          .map((column: any) => column.getColId());
      dispatch(setVisibleColumn(visibleColumns));
      const visibleColumnsString = JSON.stringify(visibleColumns);
      localStorage.setItem('visibleColumns', visibleColumnsString);
    },
    [dispatch],
  );

  const hanldeGridReady = useCallback(
    (params: any) => {
      const { api, columnApi } = params;
      columnApi?.autoSizeColumns();

      // First apply column visibility from visibleColumnCells
      const columnState = columnDefs.map((col) => ({
        colId: col.field,
        hide: !visibleColumnCells.includes(col.field),
      }));

      // Then try to apply saved column order
      const savedState = localStorage.getItem('columnState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          // Merge visibility with saved order
          const mergedState = parsedState.map((saved: any) => {
            const visibilityState = columnState.find(
              (col) => col.colId === saved.colId,
            );
            return {
              ...saved,
              hide: visibilityState ? visibilityState.hide : saved.hide,
              // Strip any saved ag-grid sort — sorting is server-side only
              sort: null,
              sortIndex: null,
            };
          });

          api.applyColumnState({
            state: mergedState,
            applyOrder: true,
          });
          setCurrentColumnState(mergedState);
        } catch (error) {
          console.error('Failed to apply saved column state:', error);
          api.applyColumnState({
            state: columnState,
            applyOrder: false,
          });
        }
      } else {
        // Just apply visibility if no order is saved
        api.applyColumnState({
          state: columnState,
          applyOrder: false,
        });
      }
    },
    [columnDefs, visibleColumnCells, setCurrentColumnState],
  );

  const gridOptions = useMemo(
    () => ({
      headerHeight: 35,
      suppressHorizontalScroll: true,
      onGridReady: (params: any) => {
        const { columnApi } = params;
        columnApi?.autoSizeColumns();
      },
    }),
    [],
  );

  return (
    <>
      <div
        className={!viewAll ? 'mobile-responsive' : 'mobile-responsive-view'}
      >
        <div
          className="ag-theme-alpine grid-container ag-theme-balham"
          style={{
            height: 'calc(90vh - 220px)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <span className="tableContainer">
            <ButtonDropdownColumnSelector />
            <div className="tableContainer">
              {isShowDownloadButton && (
                <DownloadCSV
                  dataSend={dataSendToDownloadCSV}
                  styleNameRoute={styleNameRoute}
                />
              )}
            </div>
          </span>
          {loading && rowData.length === 0 ? (
            <CustomLoadingOverlay />
          ) : (
            <AgGridReact
              theme="legacy"
              key={`grid-${styleNameRoute}`}
              ref={gridRef}
              suppressHorizontalScroll={false}
              loading={loading}
              rowData={rowData}
              columnDefs={columnDefs}
              suppressMenuHide={true}
              onGridReady={hanldeGridReady}
              animateRows={true}
              onDragStopped={handleColumnDragStop}
              onColumnMoved={handleColumnDragStop}
              onColumnVisible={handleColumnVisibleChange}
              onColumnPinned={handleColumnDragStop}
              gridOptions={gridOptions}
              getRowHeight={getRowHeightTable}
              paginationPageSize={rowsPerPage}
              defaultColDef={defaultColDef}
              getRowStyle={getRowRowStyle}
              enableBrowserTooltips={true}
              tooltipShowDelay={0}
              tooltipHideDelay={1000}
              rowModelType="clientSide"
            />
          )}
        </div>
        <div className="pagination-div">
          <Pagination
            current={page + 1} // Convert 0-based to 1-based for display
            total={totalResultsCount} // Use total items, not pages
            pageSize={rowsPerPage}
            onChange={handleChangePagePagination}
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger={true}
            pageSizeOptions={[
              '5',
              '8',
              '10',
              '12',
              '15',
              '20',
              '25',
              '30',
              '45',
              '50',
              '100',
            ]}
            showQuickJumper={false}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </div>
      <ModalNetworksGraph />
      <CardModal />
    </>
  );
};

export default Tables;
