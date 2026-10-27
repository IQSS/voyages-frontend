/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

import dayjs from 'dayjs';

import ActionCellRenderer from './ActionCellRenderer';
import StatusCellRenderer from './StatusCellRenderer';

export const useColumnDefs = () => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Comments',
          field: 'comments' as string,
          valueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          width: 200,
          sortable: true,
          // Hidden by default (committee request); re-addable via the Columns
          // control on the Edit Requests toolbar.
          hide: true,
        },
        {
          headerName: 'Batch',
          field: 'batch' as string,
          valueGetter: (params: any) => {
            return (
              params.data?.batch?.title || params.data?.batch || 'Unassigned'
            );
          },
          tooltipValueGetter: (params: any) =>
            params.data?.batch?.title || params.data?.batch || 'Unassigned',
          width: 180,
          // Server orders by the batch relation's title.
          sortable: true,
        },
        {
          headerName: 'Voyage ID',
          field: 'voyage_id' as any,
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          valueGetter: (params: any) => {
            return params.data?.voyage_id || params.data?.voyage_id || '';
          },
          width: 120,
          // Materialized from root.id; server orders it via a JSON path.
          sortable: true,
        },
        {
          headerName: 'Ship',
          field: 'shipName' as any,
          colId: 'shipName',
          width: 150,
          tooltipField: 'shipName',
          // Denormalised onto contributions.shipName on the server, so it can
          // be ordered (see SORTABLE_COL_MAP).
          sortable: true,
        },
        {
          headerName: 'Contributor',
          field: 'author' as any,
          valueGetter: (params: any) =>
            params.data?.changeSet?.author || params.data?.author || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.author || params.data?.author || '—',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueGetter: (p: any) => p.data?.timestamp,
          valueFormatter: ({ value }: { value: number }) =>
            value && dayjs(value).isValid()
              ? dayjs(value).format('MM/DD/YYYY')
              : '—',
          width: 100,
          // No default `sort` here: under the infinite row model a default sort
          // would arrive in params.sortModel on first load and suppress the
          // submitted-first default ordering + hoist. The column stays sortable
          // (defaultColDef) so a header click still sorts by timestamp server-side.
          sortable: true,
        },
        {
          headerName: 'Nationality',
          field: 'nationality' as any,
          colId: 'nationality',
          width: 120,
          flex: 1,
          tooltipField: 'nationality',
          // Denormalised onto contributions.nationality on the server so it can
          // be ordered (see SORTABLE_COL_MAP).
          sortable: true,
          // Hidden by default (committee request); re-addable via the Columns
          // control on the Edit Requests toolbar.
          hide: true,
        },
        {
          headerName: 'Reviewer',
          field: 'decidedBy' as any,
          /**
           * Who decided this contribution's status, recorded by
           * `change_status`. An em dash rather than a name when there is none:
           * contributions decided before the column existed genuinely have no
           * recorded decider, and every undecided one has nobody to name.
           */
          valueGetter: (p: any) => p.data?.decidedBy ?? '—',
          width: 120,
          flex: 1,
          // Reviewer is the real `decidedBy` column, so the server can order it.
          sortable: true,
        },
        {
          headerName: 'Status & Actions',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          width: 180,
          flex: 1,
          sortable: true,
        },
      ] as any[],
    [],
  );
};

export const useColumnNewVoyagesDefs = (
  onEdit?: (data: any) => void,
  onDelete?: (contributionId: string) => Promise<void>,
) => {
  return useMemo(
    () =>
      [
        {
          headerName: 'Voyage ID(s)',
          field: 'voyage_id' as any,
          colId: 'voyage_id',
          valueGetter: (params: any) => {
            return params.data?.voyage_id || params.voyage_id || '-';
          },
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyage_id}`,
          // Materialized from root.id; the server orders it via a JSON path
          // (json_extract(root,'$.id')) when sortBy=voyage_id.
          sortable: true,
          flex: 1,
        },
        {
          headerName: 'Comments',
          field: 'comments' as any,
          valueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          tooltipValueGetter: (params: any) =>
            params.data?.changeSet?.comments || params.data?.comments || '—',
          sortable: true,
          flex: 1,
        },
        {
          headerName: 'Type of contribution',
          field: 'type' as string,
          tooltipField: 'type',
          flex: 1,
          // Derived on the client from `root.type`, so there is no column or
          // JSON path the server can order by.
          sortable: false,
        },

        {
          headerName: 'Status',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          flex: 1,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueGetter: (p: any) => p.data?.timestamp,
          valueFormatter: ({ value }: { value: number }) =>
            value && dayjs(value).isValid()
              ? dayjs(value).format('MM/DD/YYYY')
              : '—',
          width: 200,
          sort: 'desc',
        },
        {
          headerName: 'Action',
          field: 'action' as any,
          cellRenderer: ActionCellRenderer,
          cellRendererParams: {
            onEdit,
            onDelete,
          },
          width: 120,
          sortable: false,
        },
      ] as any[],
    [onEdit, onDelete],
  );
};
