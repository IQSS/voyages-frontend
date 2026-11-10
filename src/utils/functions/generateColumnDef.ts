import { ICellRendererParams } from 'ag-grid-community';

import { GenerateCellTableRenderer } from '@/components/PresentationComponents/Tables/GenerateCellTableRenderer';
import { LabelFilterMeneList } from '@/share/InterfaceTypes';
import { TableCellStructure } from '@/share/InterfaceTypesTable';

import { hasValueGetter } from './hasValueGetter';

export const generateColumnDef = (
  value: TableCellStructure,
  languageValue: string,
  visibleColumnCells?: string[],
) => {
  const nodeClass = value?.cell_val?.fields[0]?.node_class;
  const CELLFN = value?.cell_val?.fields[0]?.cell_fn;
  const colID = value.colID;
  const numberFormat = value.number_format;
  const columnHeader = (value.header_label as LabelFilterMeneList)[
    languageValue
  ];

  return {
    headerName: columnHeader,
    field: value.colID,
    colId: value.colID,
    width: value.col_width_px,
    sortable: !(Array.isArray(value.order_by) && value.order_by.length === 0),
    autoHeight: true,
    wrapText: true,
    resizable: true,
    sortingOrder: ['asc', 'desc'],
    headerTooltip: columnHeader,
    tooltipField: value.colID,
    hide: visibleColumnCells
      ? !visibleColumnCells.includes(value.colID)
      : false,
    filter: true,
    cellRenderer: (params: ICellRendererParams) =>
      GenerateCellTableRenderer(params, CELLFN, colID, numberFormat, nodeClass),
    valueGetter: (params: ICellRendererParams) => hasValueGetter(params, value),
    context: {
      fieldToSort: value.order_by || [colID],
    },
  };
};
