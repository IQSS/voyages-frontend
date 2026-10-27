/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useCallback } from 'react';

import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Box,
  IconButton,
  Chip,
  Typography as MuiTypography,
} from '@mui/material';
import {
  ContributionStatus,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Tooltip } from 'antd';

import { formatBatchDate } from '@/fetch/contributeFetch/batchApi';

import { ApproveBatchIcon } from './ApproveBatchIcon';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface BatchTableProps {
  batches: PublicationBatch[];
  loading: boolean;
  onEditBatch?: (batch: PublicationBatch) => void;
  onDeleteBatch?: (batch: PublicationBatch) => void;
  onApproveBatch?: (batch: PublicationBatch) => void;
}

// Custom cell renderers
const TitleCellRenderer = (params: any) => {
  const batch = params.data;
  return (
    <Box>
      <MuiTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {batch.title}
      </MuiTypography>
    </Box>
  );
};

// Custom cell renderers
const BatchIDCellRenderer = (params: any) => {
  const batch = params.data;
  return (
    <Box>
      <MuiTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {batch.id}
      </MuiTypography>
    </Box>
  );
};
const StatusCellRenderer = (params: any) => {
  const batch = params.data;
  const isPublished = batch.published !== null;

  return (
    <Chip
      label={isPublished ? 'Published' : 'Pending'}
      color={isPublished ? 'success' : 'warning'}
      size="small"
      sx={{ fontSize: '0.75rem' }}
    />
  );
};

const PublishedDateCellRenderer = (params: any) => {
  const batch = params.data;
  // Shared with the publication screen — the stored timestamp comes back as
  // text and needs coercing before it will parse. See parseBatchDate.
  return (
    <MuiTypography variant="body2">
      {formatBatchDate(batch.published)}
    </MuiTypography>
  );
};

const ContributionsCellRenderer = (params: any) => {
  const count = params.data?.contributionCount ?? 0;
  return (
    <Chip
      label={count}
      color={count > 0 ? 'primary' : 'default'}
      size="small"
      sx={{ fontSize: '0.75rem' }}
    />
  );
};

const CommentsCellRenderer = (params: any) => {
  const comments = params.data.comments || 'No comments';
  return (
    <MuiTypography
      variant="body2"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={comments}
    >
      {comments}
    </MuiTypography>
  );
};

const ActionsCellRenderer = (
  params: any,
  onEditBatch?: (batch: PublicationBatch) => void,
  onDeleteBatch?: (batch: PublicationBatch) => void,
  onApproveBatch?: (batch: PublicationBatch) => void,
) => {
  const batch = params.data;
  const isPublished = batch.published !== null;
  // Approvable = not yet decided: WorkInProgress (how imports land) or
  // Submitted. A published batch has none to act on. Counts come from the list
  // endpoint's per-status tally.
  const approvableCount =
    (batch.statusCounts?.[ContributionStatus.WorkInProgress] ?? 0) +
    (batch.statusCounts?.[ContributionStatus.Submitted] ?? 0);

  const handleEdit = () => {
    if (onEditBatch) {
      onEditBatch(batch);
    }
  };

  const handleDelete = () => {
    if (onDeleteBatch) {
      onDeleteBatch(batch);
    }
  };

  const handleApprove = () => {
    if (onApproveBatch) {
      onApproveBatch(batch);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
      {!isPublished && (
        <Tooltip
          title={
            approvableCount > 0
              ? `Approve ${approvableCount} contribution${approvableCount === 1 ? '' : 's'} in this batch`
              : 'No contributions to approve'
          }
        >
          {/* span so the tooltip still shows when the button is disabled */}
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={handleApprove}
              disabled={approvableCount === 0}
            >
              <ApproveBatchIcon size={17} />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Tooltip title="Edit batch">
        <IconButton size="small" onClick={handleEdit}>
          <EditOutlined style={{ fontSize: '16px' }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete batch">
        <IconButton size="small" color="error" onClick={handleDelete}>
          <DeleteOutlined style={{ fontSize: '16px' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const BatchTable: React.FC<BatchTableProps> = ({
  batches,
  loading,
  onEditBatch,
  onDeleteBatch,
  onApproveBatch,
}) => {
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'ID',
        field: 'id',
        cellRenderer: BatchIDCellRenderer,
        width: 80,
        minWidth: 80,
        sortable: true,
        headerTooltip: 'Unique batch ID',
        tooltipValueGetter: (params: any) => `Batch ID: ${params.data?.id}`,
      },
      {
        headerName: 'Title',
        field: 'title',
        cellRenderer: TitleCellRenderer,
        width: 200,
        minWidth: 120,
        flex: 1,
        sortable: true,
        headerTooltip: 'Title of the publication batch',
        tooltipValueGetter: (params: any) => params.data?.title,
      },
      {
        headerName: 'Status',
        field: 'published',
        cellRenderer: StatusCellRenderer,
        width: 120,
        sortable: true,
        headerTooltip: 'Pending = not yet published, Published = live',
        tooltipValueGetter: (params: any) =>
          params.data?.published !== null ? 'Published' : 'Pending',
        filterParams: {
          values: ['Published', 'Pending'],
          valueGetter: (params: any) => {
            return params.data.published !== null ? 'Published' : 'Pending';
          },
        },
      },
      {
        headerName: 'Published Date',
        field: 'published',
        cellRenderer: PublishedDateCellRenderer,
        width: 150,
        sortable: true,
        headerTooltip: 'Date the batch was published',
        tooltipValueGetter: (params: any) =>
          params.data?.published
            ? new Date(params.data.published).toLocaleDateString()
            : 'Not published yet',
        comparator: (valueA: any, valueB: any) => {
          const dateA = valueA ? new Date(valueA).getTime() : 0;
          const dateB = valueB ? new Date(valueB).getTime() : 0;
          return dateA - dateB;
        },
      },
      {
        headerName: 'Contributions',
        field: 'contributionCount',
        cellRenderer: ContributionsCellRenderer,
        width: 120,
        sortable: true,
        headerTooltip: 'Number of voyage contributions in this batch',
        tooltipValueGetter: (params: any) => {
          const count = params.data?.contributionCount ?? 0;
          return `${count} contribution${count !== 1 ? 's' : ''} in this batch`;
        },
      },
      {
        headerName: 'Comments',
        field: 'comments',
        cellRenderer: CommentsCellRenderer,
        width: 150,
        flex: 1,
        sortable: true,
        headerTooltip: 'Notes or comments added to this batch',
        tooltipValueGetter: (params: any) =>
          params.data?.comments || 'No comments',
      },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: (params: any) =>
          ActionsCellRenderer(
            params,
            onEditBatch,
            onDeleteBatch,
            onApproveBatch,
          ),
        width: 150,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: 'right',
        headerTooltip: 'Approve, edit or delete this batch',
        // No cell-level tooltip: with enableBrowserTooltips a cell tooltip
        // paints one native title over the whole cell, hiding the per-icon
        // tooltips. Each button carries its own antd Tooltip instead.
      },
    ],
    [onEditBatch, onDeleteBatch, onApproveBatch],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
      },
    }),
    [],
  );

  const gridOptions = useMemo(
    () => ({
      animateRows: true,
      headerHeight: 45,
      suppressMovableColumns: true,
      suppressFieldDotNotation: true,
      enableBrowserTooltips: true,
      tooltipShowDelay: 300,
    }),
    [],
  );

  const onGridReady = useCallback((params: any) => {
    params.api.sizeColumnsToFit();
  }, []);

  const onFirstDataRendered = useCallback((params: any) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <Box
      className="ag-theme-alpine"
      sx={{
        height: '400px',
        width: '100%',
        overflowY: 'auto',
        '& .ag-header-cell': {
          fontWeight: 600,
        },
        '& .ag-row': {
          cursor: 'default',
        },
        '& .ag-row:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <AgGridReact
        theme="legacy"
        key={`batch-table-${batches.length}`}
        // ref={gridRef}
        columnDefs={columnDefs as any}
        rowData={batches}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        loading={loading}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[5, 10, 20, 50]}
        suppressPaginationPanel={false}
        noRowsOverlayComponent={() => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <MuiTypography variant="h6" sx={{ mb: 1 }}>
              No batches found
            </MuiTypography>
            <MuiTypography variant="body2">
              Create your first batch to get started
            </MuiTypography>
          </Box>
        )}
      />
    </Box>
  );
};

export default BatchTable;
