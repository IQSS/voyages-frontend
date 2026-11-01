import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  PivotColumnDef,
  StatePivotRowData,
} from '@/share/InterfaceTypePivotTable';
import { PivotTablesProps } from '@/share/InterfaceTypes';
import VOYAGE_PIVOT_OPTIONS from '@/utils/flatfiles/voyages/voyages_pivot_options.json';
import { getRowsPerPage } from '@/utils/functions/getRowsPerPage';

const initialState: StatePivotRowData = {
  data: [],
  rowData: [],
  columnDefs: [],
  offset: 0,
  pivotValueOptions: {
    row_vars: VOYAGE_PIVOT_OPTIONS.row_vars[12].rows,
    rows_label: VOYAGE_PIVOT_OPTIONS.row_vars[12].rows_label,
    label: VOYAGE_PIVOT_OPTIONS.row_vars[12].label,
    binsize: VOYAGE_PIVOT_OPTIONS.row_vars[12].binsize,
    column_vars: VOYAGE_PIVOT_OPTIONS.column_vars[6].columns,
    cell_vars: VOYAGE_PIVOT_OPTIONS.cell_vars[1].value_field,
    agg_fn: VOYAGE_PIVOT_OPTIONS.cell_vars[1].agg_fn,
  },
  aggregation: 'sum',
  rowsPerPage: getRowsPerPage(window.innerWidth, window.innerHeight),
  totalResultsCount: 0,
  orderBy: [],
};
const getPivotTablesDataSlice = createSlice({
  name: 'getPivotTablesDataSlice',
  initialState,
  reducers: {
    setPivotTableData: (
      state,
      action: PayloadAction<Record<string, any>[]>,
    ) => {
      state.data = action.payload;
    },
    setRowPivotTableData: (
      state,
      action: PayloadAction<Record<string, any>[]>,
    ) => {
      state.rowData = action.payload;
    },
    setPivotTablColumnDefs: (
      state,
      action: PayloadAction<PivotColumnDef[]>,
    ) => {
      state.columnDefs = action.payload;
    },
    setOffset: (state, action: PayloadAction<number>) => {
      state.offset = action.payload;
    },
    setPivotValueOptions: (state, action: PayloadAction<PivotTablesProps>) => {
      state.pivotValueOptions = action.payload;
      if (state.orderBy.length > 0) {
        state.orderBy = [];
        state.offset = 0;
      }
    },
    setPivotOrderBy: (state, action: PayloadAction<string[]>) => {
      state.orderBy = action.payload;
      state.offset = 0;
    },
    setAggregation: (state, action: PayloadAction<string>) => {
      state.aggregation = action.payload;
    },
    setRowsPerPage: (state, action: PayloadAction<number>) => {
      state.rowsPerPage = action.payload;
    },
    setTotalResultsCount: (state, action: PayloadAction<number>) => {
      state.totalResultsCount = action.payload;
    },
  },
});

export const {
  setTotalResultsCount,
  setRowsPerPage,
  setPivotTableData,
  setRowPivotTableData,
  setAggregation,
  setPivotTablColumnDefs,
  setOffset,
  setPivotValueOptions,
  setPivotOrderBy,
} = getPivotTablesDataSlice.actions;
export default getPivotTablesDataSlice.reducer;
