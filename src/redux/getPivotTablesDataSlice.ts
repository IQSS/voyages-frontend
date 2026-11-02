import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  PivotCrosstabResponse,
  StatePivotRowData,
} from '@/share/InterfaceTypePivotTable';
import { PivotTablesProps } from '@/share/InterfaceTypes';
import VOYAGE_PIVOT_OPTIONS from '@/utils/flatfiles/voyages/voyages_pivot_options.json';
import { getRowsPerPage } from '@/utils/functions/getRowsPerPage';

const initialState: StatePivotRowData = {
  table: null,
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
};

const getPivotTablesDataSlice = createSlice({
  name: 'getPivotTablesDataSlice',
  initialState,
  reducers: {
    setPivotTable: (
      state,
      action: PayloadAction<PivotCrosstabResponse | null>,
    ) => {
      state.table = action.payload;
    },
    setPivotValueOptions: (state, action: PayloadAction<PivotTablesProps>) => {
      state.pivotValueOptions = action.payload;
    },
    setAggregation: (state, action: PayloadAction<string>) => {
      state.aggregation = action.payload;
    },
    setRowsPerPage: (state, action: PayloadAction<number>) => {
      state.rowsPerPage = action.payload;
    },
  },
});

export const {
  setPivotTable,
  setPivotValueOptions,
  setAggregation,
  setRowsPerPage,
} = getPivotTablesDataSlice.actions;
export default getPivotTablesDataSlice.reducer;
