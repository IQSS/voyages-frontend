import { PivotTablesProps } from './InterfaceTypes';

export interface PivotCrosstabMetadata {
  total_results_count: number;
  offset: number;
  limit: number | null;
}

export interface PivotCrosstabResponse {
  row_label: string;
  column_labels: string[];
  value_label: string;
  columns: string[][];
  rows: string[];
  values: number[][];
  totals: number[];
  metadata: PivotCrosstabMetadata;
}

export interface PivotSort {
  column: string | null;
  direction: 'asc' | 'desc';
}

export interface StatePivotRowData {
  table: PivotCrosstabResponse | null;
  pivotValueOptions: PivotTablesProps;
  aggregation: string;
  rowsPerPage: number;
}
