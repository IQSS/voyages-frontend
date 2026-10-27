/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from 'react';

import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Input, Select, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import { useEditorialContributions } from '@/hooks/contribute/useEditorialContributions';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import StatusCellRenderer, {
  statusConfig,
} from '../commons/StatusCellRenderer';
import { EnslaverRow, mapEnslaverRow } from '../utils/editorialRowMappers';

const { Title } = Typography;
const { Search } = Input;

// Default option (everything except Published, see useEditorialContributions)
// plus one option per ContributionStatus, in enum order.
const STATUS_OPTIONS = [
  { value: 'all', label: 'All except Published' },
  ...Object.entries(statusConfig).map(([value, cfg]) => ({
    value: Number(value),
    label: cfg.label,
  })),
];

// ── Type icon ────────────────────────────────────────────────────────────────
// `type` is optional: with the infinite row model, AG Grid renders cells for
// rows that have not loaded yet, where the value is undefined.
const TypeIcon: React.FC<{ type?: EnslaverRow['type'] }> = ({ type }) => {
  const map = {
    edit: { icon: <EditOutlined />, title: 'Edit Enslaver' },
    merge: { icon: <MergeCellsOutlined />, title: 'Merge Enslavers' },
    new: { icon: <FileAddOutlined />, title: 'New Enslaver' },
    delete: { icon: <DeleteOutlined />, title: 'Recommend Deletion' },
  };
  const entry = type ? map[type] : undefined;
  if (!entry) return null;
  const { icon, title } = entry;
  return (
    <Tooltip title={title}>
      <span
        style={{
          fontSize: 16,
          color: '#37948d',
          display: 'inline-block',
          marginTop: 6,
          cursor: 'default',
        }}
      >
        {icon}
      </span>
    </Tooltip>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const EditEnslavers: React.FC = () => {
  const navigate = useNavigate();

  const {
    gridRef,
    onGridReady,
    totalCount,
    pendingCount,
    searchInput,
    onSearchChange,
    onSearch,
    status,
    onStatusChange,
    blockSize,
  } = useEditorialContributions('Enslaver', mapEnslaverRow);

  // ── Column definitions ────────────────────────────────────────────────────
  const columnDefs = useMemo(
    () =>
      [
        // 1. Type icon — clicks here do NOT open the drawer
        {
          headerName: 'Type',
          field: 'type',
          colId: 'type',
          width: 70,
          sortable: false,
          cellRenderer: ({ value, data }: any) =>
            data ? <TypeIcon type={value} /> : null,
        },
        // 2. Enslaver name
        {
          headerName: 'Enslaver',
          field: 'enslaver',
          flex: 1,
          minWidth: 200,
          sortable: false,
          tooltipField: 'enslaver',
          valueGetter: (p: any) => {
            const c: EnslaverRow = p.data;
            if (!c) return '';
            return c.type === 'merge' && c.enslaverMergeTarget
              ? `${c.enslaver}  ···  ${c.enslaverMergeTarget}`
              : c.enslaver;
          },
          cellRenderer: (p: any) => {
            const c: EnslaverRow = p.data;
            if (!c) return null;
            if (c.type === 'merge' && c.enslaverMergeTarget) {
              return (
                <span>
                  {c.enslaver}
                  <span style={{ color: '#9ca3af', margin: '0 6px' }}>···</span>
                  <span style={{ color: '#6b7280' }}>
                    {c.enslaverMergeTarget}
                  </span>
                </span>
              );
            }
            return <span>{c.enslaver}</span>;
          },
        },
        // 3. Contributor
        {
          headerName: 'Contributor',
          field: 'contributor',
          colId: 'contributor',
          flex: 1,
          minWidth: 180,
          sortable: true,
          tooltipField: 'contributor',
        },
        // 4. Status
        {
          headerName: 'Status',
          field: 'status',
          colId: 'status',
          width: 140,
          sortable: true,
          cellRenderer: (p: any) =>
            p.data ? <StatusCellRenderer value={p.data.status} /> : null,
        },
        // 5. Date
        {
          headerName: 'Date',
          field: 'timestamp',
          colId: 'timestamp',
          width: 190,
          sortable: true,
          sort: 'desc' as const,
          valueFormatter: ({ value }: { value: number }) =>
            value ? dayjs(value).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : '—',
        },
      ] as any[],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: { paddingTop: '10px', fontSize: '13px' },
    }),
    [],
  );

  const getRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
      cursor: 'pointer',
    }),
    [],
  );

  // ── Row click → navigate to review page ──────────────────────────────────
  const handleRowClick = useCallback(
    ({ data, event }: any) => {
      if (!data || !event) return;
      const target = event.target as HTMLElement;
      const colId = target.closest('.ag-cell')?.getAttribute('col-id') ?? '';
      if (colId !== 'type') return;
      navigate(`/contribute/enslaver_contribution_review/${data.id}`);
    },
    [navigate],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <Box
        sx={{
          position: 'sticky',
          top: '7rem',
          zIndex: 40,
          background: '#fff',
          pb: 1,
        }}
      >
        <ListEditorialPlatForm />

        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px 12px 4px 4px',
            padding: '12px',
            marginBottom: '12px',
            border: '1px solid #e8f0fe',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0, color: '#333' }}>
                Edit Enslavers
              </Title>
              <div style={{ marginTop: '4px', color: '#6b7280' }}>
                {pendingCount} contribution{pendingCount !== 1 ? 's' : ''}{' '}
                awaiting review
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select
                value={status ?? 'all'}
                onChange={(val) =>
                  onStatusChange(
                    val === 'all' ? undefined : (val as ContributionStatus),
                  )
                }
                options={STATUS_OPTIONS}
                style={{ width: 180 }}
              />
              <Search
                placeholder="Search enslaver, contributor, type..."
                value={searchInput}
                onChange={onSearchChange}
                onSearch={onSearch}
                style={{ width: 340 }}
                allowClear
              />
            </div>
          </div>
        </div>
      </Box>

      {/* Table — infinite scroll (same model as Edit Requests) */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(100vh - 280px)',
          width: '100%',
          border: '1px solid #d9d9d9',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}
      >
        <AgGridReact<any>
          theme="legacy"
          ref={gridRef}
          rowModelType="infinite"
          cacheBlockSize={blockSize}
          onGridReady={onGridReady}
          onGridSizeChanged={(p: any) => p.api.sizeColumnsToFit()}
          onFirstDataRendered={(p: any) => p.api.sizeColumnsToFit()}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips
          onRowClicked={handleRowClick}
          getRowClass={(params: any) =>
            (params.rowIndex ?? 0) % 2 === 0 ? 'even-row' : 'odd-row'
          }
          headerHeight={36}
          rowHeight={42}
          overlayNoRowsTemplate="No enslaver contributions to review yet."
        />
      </div>

      <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
        {totalCount} contribution{totalCount !== 1 ? 's' : ''} total
      </div>
    </Box>
  );
};

export default EditEnslavers;
