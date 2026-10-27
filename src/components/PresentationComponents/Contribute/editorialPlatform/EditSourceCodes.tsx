/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';
import {
  AllCommunityModule,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Button, Input, message, Select, Space, Typography } from 'antd';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/style/table.scss';

import { fetchSourcesData } from '@/fetch/contributeFetch/fetchSourcesData';
import { BASEURL } from '@/share/AUTH_BASEURL';

import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

// Infinite row model lives in the community module; registration is global and
// idempotent (the editorial tables register it too).
ModuleRegistry.registerModules([AllCommunityModule]);

const { Title } = Typography;
const { Search } = Input;

const BLOCK_SIZE = 50;

// "By source type" options — the list the legacy Voyage Admin uses. Values
// match SourceType.name for server-side filtering.
const SOURCE_TYPE_NAMES = [
  'Documentary source',
  'Newspaper',
  'Published source',
  'Unpublished secondary source',
  'Private note or collection',
];

const SOURCE_TYPE_OPTIONS = [
  { value: 'all', label: 'All source types' },
  ...SOURCE_TYPE_NAMES.map((name) => ({ value: name, label: name })),
];

const stripHtml = (v?: string | null): string =>
  (v ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const EditSourceCodes: React.FC = () => {
  const gridRef = useRef<any>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Uncommitted box value vs. the committed term that drives the fetch. The
  // committed values live in refs so the datasource closure (built once) reads
  // them live; a change purges the grid's cache to refetch from the top.
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef('');
  const [sourceType, setSourceType] = useState('all');
  const sourceTypeRef = useRef('all');

  const refresh = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const page = Math.floor(params.startRow / BLOCK_SIZE) + 1;
        try {
          const res = await fetchSourcesData(page, BLOCK_SIZE, {
            search: searchRef.current,
            sourceType:
              sourceTypeRef.current === 'all'
                ? undefined
                : sourceTypeRef.current,
          });
          const rows = res?.results ?? [];
          const total = res?.count ?? -1;
          setTotalCount(total > 0 ? total : rows.length);
          params.successCallback(rows, total);
        } catch (error) {
          message.error('Failed to load sources');
          console.error('Sources load error:', error);
          params.failCallback();
        }
      },
    }),
    [],
  );

  const onGridReady = useCallback(
    (event: { api: any }) => {
      event.api.setGridOption('datasource', datasource);
    },
    [datasource],
  );

  // Debounced search commit; a new term purges the cache so the grid refetches.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitSearch = useCallback(
    (value: string, immediate = false) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const apply = () => {
        searchRef.current = value.trim();
        refresh();
      };
      if (immediate) apply();
      else debounceRef.current = setTimeout(apply, 500);
    },
    [refresh],
  );

  const onSourceTypeChange = useCallback(
    (val: string) => {
      setSourceType(val);
      sourceTypeRef.current = val;
      refresh();
    },
    [refresh],
  );

  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: 'Short reference',
          field: 'short_ref',
          colId: 'short_ref',
          width: 240,
          sortable: false,
          tooltipValueGetter: (p: any) => p.data?.short_ref?.name ?? '',
          valueGetter: (p: any) => p.data?.short_ref?.name ?? '',
          cellRenderer: (p: any) =>
            p.data ? (p.data.short_ref?.name ?? '—') : null,
        },
        {
          headerName: 'Source type',
          field: 'source_type',
          colId: 'source_type',
          width: 220,
          sortable: false,
          valueGetter: (p: any) => p.data?.source_type?.name ?? '',
          cellRenderer: (p: any) =>
            p.data ? (p.data.source_type?.name ?? '—') : null,
        },
        {
          headerName: 'Full reference',
          field: 'bib',
          colId: 'bib',
          flex: 1,
          minWidth: 320,
          sortable: false,
          tooltipValueGetter: (p: any) => stripHtml(p.data?.bib),
          valueGetter: (p: any) => stripHtml(p.data?.bib),
          cellRenderer: (p: any) => {
            if (!p.data) return null;
            const text = stripHtml(p.data.bib);
            return text || '—';
          },
        },
      ] as any[],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: false,
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
    }),
    [],
  );

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
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0, color: '#333' }}>
                Source Codes
              </Title>
              <div style={{ marginTop: '4px', color: '#6b7280' }}>
                {totalCount} source{totalCount !== 1 ? 's' : ''}
              </div>
            </div>
            <Space size={8} wrap>
              <Select
                value={sourceType}
                onChange={onSourceTypeChange}
                options={SOURCE_TYPE_OPTIONS}
                style={{ width: 240 }}
              />
              <Search
                placeholder="Search by short reference..."
                value={searchInput}
                onChange={(e) => commitSearch(e.target.value)}
                onSearch={(v) => commitSearch(v, true)}
                style={{ width: 320 }}
                allowClear
              />
              {/* Sources are added/edited in the Django admin (no create API);
                  this opens the admin add form in a new tab. */}
              <Button
                type="primary"
                href={`${BASEURL}/admin/document/source/add/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Add Source
              </Button>
            </Space>
          </div>
        </div>
      </Box>

      {/* Table — infinite scroll (same model as the editorial tables) */}
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
          cacheBlockSize={BLOCK_SIZE}
          onGridReady={onGridReady}
          onGridSizeChanged={(p: any) => p.api.sizeColumnsToFit()}
          onFirstDataRendered={(p: any) => p.api.sizeColumnsToFit()}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips
          getRowClass={(params: any) =>
            (params.rowIndex ?? 0) % 2 === 0 ? 'even-row' : 'odd-row'
          }
          headerHeight={36}
          rowHeight={42}
          overlayNoRowsTemplate="No sources found."
        />
      </div>
    </Box>
  );
};

export default EditSourceCodes;
