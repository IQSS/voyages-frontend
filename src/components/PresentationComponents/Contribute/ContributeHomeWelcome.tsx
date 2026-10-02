import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';

import { Button } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Button as AntButton, DatePicker, Select } from 'antd';

import { useContributeNewVoyages } from '@/hooks/contribute/useContributeNewVoyages';

import { SearchInput } from './commons/SearchInput';
import { statusConfig } from './commons/StatusCellRenderer';
import { TransformedContribution } from './utils/transformContributionData';

// Default option (everything except Published, see useContributeNewVoyages)
// plus one option per ContributionStatus, in enum order.
const STATUS_OPTIONS = [
  { value: 'all', label: 'All except Published' },
  ...Object.entries(statusConfig).map(([value, cfg]) => ({
    value: Number(value),
    label: cfg.label,
  })),
];

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const ContributeHomeWelcome: React.FC = () => {
  const {
    gridRef,
    contributePath,
    buttons,
    translatedContribute,
    handleClickSideBar,
    columnDefs,
    defaultColDef,
    getRowStyle,
    totalContributions,
    onGridReady,
    handleRowClick,
    statusFilter,
    onStatusChange,
    searchInput,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    hasFilters,
    onClearFilters,
  } = useContributeNewVoyages();

  if (contributePath) return null;

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">
        {translatedContribute.contributeContributeHomeWelcome}
      </h1>

      <div style={{ margin: '10px 0 24px 0' }}>
        {buttons.map((btn) => (
          <Button
            onClick={() => handleClickSideBar(btn.path)}
            key={btn.nameBtn}
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: 'rgb(55, 148, 141)',
              color: '#fff',
              marginRight: '0.5rem',
              height: 32,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(6, 186, 171, 0.83)' },
            }}
          >
            {btn.nameBtn}
          </Button>
        ))}
      </div>

      <div
        style={{
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Select
            value={statusFilter ?? 'all'}
            onChange={(val) =>
              onStatusChange(
                val === 'all' ? undefined : (val as ContributionStatus),
              )
            }
            options={STATUS_OPTIONS}
            style={{ width: 180 }}
          />
          <SearchInput
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Search Voyage ID or comments"
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => onDateRangeChange(dates ?? null)}
            allowEmpty={[true, true]}
          />
          {hasFilters && <AntButton onClick={onClearFilters}>Clear</AntButton>}
        </div>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          {totalContributions > 0
            ? `${totalContributions.toLocaleString()} contribution${totalContributions !== 1 ? 's' : ''} — scroll to load more`
            : hasFilters
              ? 'No contributions match'
              : ''}
        </span>
      </div>
      <div
        className="ag-theme-alpine compact-table"
        style={{
          width: 'calc(100vw - 120px)',
          // A fixed height so the grid scrolls inside itself. With
          // `autoHeight` it grew to fit whatever had been fetched, which
          // meant ten rows and no indication there were more.
          height: 'calc(100vh - 320px)',
          minHeight: 320,
          border: '1px solid #d9d9d9',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}
      >
        <AgGridReact<TransformedContribution>
          theme="legacy"
          ref={gridRef}
          rowModelType="infinite"
          cacheBlockSize={50}
          onGridReady={onGridReady}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips={true}
          onRowClicked={handleRowClick}
          getRowClass={(params) =>
            params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
          }
          headerHeight={36}
          suppressHorizontalScroll={false}
        />
      </div>
    </div>
  );
};

export default ContributeHomeWelcome;
