/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react';

import { EditOutlined, FileAddOutlined } from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Input, Select, Tooltip, Typography, message } from 'antd';
import dayjs from 'dayjs';

const MIN_VALID_TIMESTAMP = new Date('2000-01-01').getTime();

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { useEditorialContributions } from '@/hooks/contribute/useEditorialContributions';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import StatusCellRenderer, {
  statusConfig,
} from '../commons/StatusCellRenderer';
import type { PendingContribution } from '../mockData/pendingContributions';
import { mapVoyageRow } from '../utils/editorialRowMappers';
import DrawerVoyageById from './editVoyages/DrawerVoyageById';

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

// ── Main component ───────────────────────────────────────────────────────────
const EditVoyages: React.FC = () => {
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
    refresh,
    blockSize,
  } = useEditorialContributions('Voyage', mapVoyageRow);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<PendingContribution | null>(null);

  // ── Actions ─────────────────────────────────────────────────────────────
  const decide = useCallback(
    async (id: string, status: ContributionStatus) => {
      try {
        await updateContributionStatus(id, status);
        message.success(
          status === ContributionStatus.Accepted
            ? 'Contribution accepted.'
            : 'Contribution rejected.',
        );
        setDrawerOpen(false);
        refresh();
      } catch (error) {
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [refresh],
  );

  const handleAccept = useCallback(
    (id: string) => decide(id, ContributionStatus.Accepted),
    [decide],
  );

  const handleReject = useCallback(
    (id: string) => decide(id, ContributionStatus.Rejected),
    [decide],
  );

  // ── Column definitions ───────────────────────────────────────────────────
  const columnDefs = useMemo(
    () =>
      [
        // 1. Voyage ID — valueGetter keeps it text, so a new voyage's uuid
        // fallback renders as-is instead of AG Grid's "Invalid Number".
        {
          headerName: 'Voyage ID',
          field: 'voyage_id',
          width: 110,
          sortable: true,
          valueGetter: (p: any) => p.data?.voyage_id ?? '',
        },
        // 2. Type — clicks here should NOT open the drawer
        {
          headerName: 'Type',
          field: 'type',
          colId: 'type',
          width: 70,
          sortable: true,
          cellRenderer: (params: any) => {
            if (!params.data) return null;
            const isNew = params.value === 'new';
            return (
              <Tooltip title={isNew ? 'New Voyage' : 'Edit Existing Voyage'}>
                <span
                  style={{
                    fontSize: 16,
                    color: '#37948d',
                    display: 'inline-block',
                    marginTop: 6,
                    cursor: 'default',
                  }}
                >
                  {isNew ? <FileAddOutlined /> : <EditOutlined />}
                </span>
              </Tooltip>
            );
          },
        },
        // 3. Ship
        {
          headerName: 'Ship',
          field: 'shipName',
          colId: 'shipName',
          width: 180,
          sortable: true,
          tooltipField: 'shipName',
        },
        // 4. Year
        {
          headerName: 'Year',
          field: 'year',
          width: 75,
          sortable: false,
        },
        // 5. Nation
        {
          headerName: 'Nation',
          field: 'nationality',
          width: 120,
          sortable: false,
          tooltipField: 'nationality',
        },
        // 6. Exported
        {
          headerName: 'Exported',
          field: 'exported',
          width: 100,
          sortable: false,
          cellStyle: { textAlign: 'right' },
          valueFormatter: ({ value }: { value: number | string }) =>
            value != null ? Number(value).toLocaleString() : '—',
        },
        // 7. Imported
        {
          headerName: 'Imported',
          field: 'imported',
          width: 100,
          sortable: false,
          cellStyle: { textAlign: 'right' },
          valueFormatter: ({ value }: { value: number | string }) =>
            value != null ? Number(value).toLocaleString() : '—',
        },
        // 8. Major place of purchase
        {
          headerName: 'Major place of purchase',
          field: 'majorPlaceOfPurchase',
          flex: 1,
          minWidth: 160,
          sortable: false,
          tooltipField: 'majorPlaceOfPurchase',
        },
        // 9. Major place of landing
        {
          headerName: 'Major place of landing',
          field: 'majorPlaceOfLanding',
          flex: 1,
          minWidth: 160,
          sortable: false,
          tooltipField: 'majorPlaceOfLanding',
        },
        // 10. Contributor
        {
          headerName: 'Contributor',
          field: 'contributor',
          colId: 'contributor',
          valueGetter: (p: any) => p.data?.changeSet?.author || '—',
          tooltipValueGetter: (p: any) => p.data?.changeSet?.author || '',
          width: 180,
          sortable: true,
        },
        // 11. Status
        {
          headerName: 'Status',
          field: 'status',
          colId: 'status',
          width: 140,
          sortable: true,
          cellRenderer: (p: any) =>
            p.data ? <StatusCellRenderer value={p.data.status} /> : null,
        },
        // 12. Date
        {
          headerName: 'Date',
          field: 'timestamp',
          colId: 'timestamp',
          valueGetter: (p: any) => {
            const ts = p.data?.changeSet?.timestamp;
            return ts && ts >= MIN_VALID_TIMESTAMP ? ts : 0;
          },
          valueFormatter: ({ value }: { value: number }) =>
            value ? dayjs(value).format('YYYY-MM-DD') : '—',
          width: 115,
          sortable: true,
          sort: 'desc' as const,
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

  // ── Row click → skip Type column, open detail drawer ────────────────────
  const handleRowClick = useCallback(({ data, event }: any) => {
    if (!data || !event) return;
    const target = event.target as HTMLElement;
    const colId = target.closest('.ag-cell')?.getAttribute('col-id') ?? '';

    // Skip the Type icon column — all other columns open the drawer
    if (colId !== 'type') return;

    setSelected(data);
    setDrawerOpen(true);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
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
              Edit Voyages
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
              placeholder="Search voyage, ship, place, contributor..."
              value={searchInput}
              onChange={onSearchChange}
              onSearch={onSearch}
              style={{ width: 340 }}
              allowClear
            />
          </div>
        </div>
      </div>

      {/* Table — infinite scroll (same model as Edit Requests) */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(100vh - 240px)',
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
          overlayNoRowsTemplate="No contributions to review."
        />
      </div>

      <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
        {totalCount} contribution{totalCount !== 1 ? 's' : ''} total
      </div>

      {/* Detail drawer — voyage comparison */}
      <DrawerVoyageById
        selected={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </Box>
  );
};

export default EditVoyages;
