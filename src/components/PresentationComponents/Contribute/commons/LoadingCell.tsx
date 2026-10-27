import type { ICellRendererParams } from 'ag-grid-community';
import { Skeleton } from 'antd';

/**
 * What a cell shows while its row is still being fetched.
 *
 * The contribution grids load a block at a time, and until a block arrives its
 * rows have no data. The column renderers then fell back to their defaults --
 * "Unassigned", a Work In Progress tag -- so a slow first load looked like a
 * real, broken draft rather than a table still loading.
 */
const LoadingCell = () => (
  <Skeleton.Input
    active
    size="small"
    style={{ width: '70%', minWidth: 40, height: 14, verticalAlign: 'middle' }}
  />
);

/**
 * For a grid's `defaultColDef`: a row with no data yet shows `LoadingCell`;
 * any other row falls through to the column's own renderer.
 */
export const loadingCellSelector = (params: ICellRendererParams) =>
  params.data ? undefined : { component: LoadingCell };
