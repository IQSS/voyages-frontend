// /* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dropdown,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';

import { CustomLoadingOverlay } from '@/components/CommonComponts/CustomLoadingOverlay';
import { useEditorialPlatformTable } from '@/hooks/contribute/useEditorialPlatformTable';
import { isContributionSelectable } from '@/utils/contribute/batchPublishability';

import BulkDecisionReport from './BulkDecisionReport';
import PublicationBlockedReport from './PublicationBlockedReport';
import BatchManagement from '../BatchComponent/BatchManagement';
import BatchAssignmentModal from '../BatchComponent/Modal/BatchAssignmentModal';
import { ActiveFiltersTag } from '../commons/ActiveFiltersTag';
import { ColumnsControl } from '../commons/ColumnsControl';
import ContributionNavBar from '../commons/ContributionNavBar';
import { FilterPanel } from '../commons/FilterPanel';
import { FilterToggleButton } from '../commons/FilterToggleButton';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import PageBackHeader from '../commons/PageBackHeader';
import { SearchInput } from '../commons/SearchInput';
import { statusConfig } from '../commons/StatusCellRenderer';
import { ContributionForm } from '../ContributionForm';
import { TransformedContribution } from '../utils/transformContributionData';

import '@/style/table.scss';
import '@/style/contributeContent.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const { Text, Title } = Typography;

interface EditorialPlatformTableProps {
  openSideBar: boolean;
}

const EditorialPlatformTable: React.FC<EditorialPlatformTableProps> = ({
  openSideBar,
}) => {
  // Whether the open contribution's form is in review mode, reported by the
  // form itself. The header tag used to say "Read-only Mode" unconditionally,
  // even after "Start Review" made the form editable (DD-0556).
  const [inReview, setInReview] = useState(false);
  const {
    // Grid
    gridRef,
    onGridReady,
    columnDefs,
    defaultColDef,
    selectionColumnDef,
    getRowStyle,
    getRowClass,
    totalCount,

    // Contribution detail
    active,
    setActive,
    contributionId,
    currentStatus,
    mode,
    empty,
    entityLoadWarning,
    shouldShowDetail,
    accessLevel,
    isLoading,

    // UI state
    showFilters,
    setShowFilters,
    selectedRows,
    setSelectedRows,
    batchManagementVisible,
    setBatchManagementVisible,
    batchAssignmentVisible,
    setBatchAssignmentVisible,

    // Filters
    filters,
    form,
    hasActiveFilters,
    activeFilterCount,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,

    // Batches
    batches,

    // Handlers
    handleSearchChange,
    searchInput,
    onSelectionChanged,
    handleReviewSubmit,
    handleReviewCancel,
    handleStartReview,
    handleRowClick,
    handleBackClick,
    handleOnEditorialDecision,
    handleReopenContribution,
    handleGridRefresh,
    handleClearSelection,
    handleBulkDecision,
    handleBulkDelete,
    bulkDeciding,
    bulkVerb,
    bulkResult,
    setBulkResult,
    decisionBlocked,
    dismissDecisionBlocked,
    contributionNav,
    isMoving,
  } = useEditorialPlatformTable();

  const bulkActionsMenuItems = [
    {
      key: 'assign-batch',
      icon: <TeamOutlined />,
      label: 'Assign to batch',
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to assign');
          return;
        }
        setBatchAssignmentVisible(true);
      },
    },
    {
      key: 'approve',
      icon: <CheckCircleOutlined />,
      label: 'Bulk approve',
      disabled: bulkDeciding,
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to approve');
          return;
        }
        // Asked for by name and by number. Accepting makes a contribution
        // read-only, so this is not a step the editor should be able to take
        // by a stray click on a menu with a thousand rows ticked behind it.
        Modal.confirm({
          title: `Accept ${selectedRows.length} contribution${selectedRows.length === 1 ? '' : 's'}?`,
          content:
            'Each one is decided on its own and recorded against you. Accepted contributions become read-only, and any that cannot be accepted are listed afterwards.',
          okText: 'Accept them',
          cancelText: 'Cancel',
          onOk: () =>
            handleBulkDecision(ContributionStatus.Accepted, 'accepted'),
        });
      },
    },
    {
      key: 'reject',
      icon: <CloseCircleOutlined />,
      label: 'Bulk reject',
      disabled: bulkDeciding,
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to reject');
          return;
        }
        Modal.confirm({
          title: `Reject ${selectedRows.length} contribution${selectedRows.length === 1 ? '' : 's'}?`,
          content:
            'Each one is decided on its own and recorded against you. Any that cannot be rejected are listed afterwards.',
          okText: 'Reject them',
          cancelText: 'Cancel',
          onOk: () =>
            handleBulkDecision(ContributionStatus.Rejected, 'rejected'),
        });
      },
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Bulk delete',
      danger: true,
      disabled: bulkDeciding,
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to delete');
          return;
        }
        // Deleting is irreversible, so it is guarded behind a confirm.
        // Published contributions are refused by the server and reported back.
        Modal.confirm({
          title: `Delete ${selectedRows.length} contribution${selectedRows.length === 1 ? '' : 's'}?`,
          content:
            'This permanently removes the selected contributions and cannot be undone. Published contributions cannot be deleted and are listed afterwards.',
          okText: 'Delete them',
          okButtonProps: { danger: true },
          cancelText: 'Cancel',
          onOk: () => handleBulkDelete(),
        });
      },
    },
  ];

  // ── Loading overlay (deep link / page refresh) ───────────────────────────
  // Previous / Next keeps the current contribution shown instead.
  if (isLoading && !shouldShowDetail) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)' }}>
        <CustomLoadingOverlay />
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (shouldShowDetail) {
    return (
      <div style={{ width: '100%' }}>
        <ContributionNavBar {...contributionNav} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <PageBackHeader
            title={`Contribution from ${active?.changeSet.author ?? 'Unknown'}`}
            onBack={handleBackClick}
            backTooltip="Back to Table"
            style={{ marginBottom: 0 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {contributionId && currentStatus !== undefined && (
              <span>
                <Text strong>Status: </Text>
                <Tag
                  color={statusConfig[currentStatus]?.color || '#1890ff'}
                  style={{ fontWeight: 500 }}
                >
                  {statusConfig[currentStatus]?.label}
                </Tag>
              </span>
            )}
            <Tag
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: inReview ? '#fff7e6' : '#f0f9ff',
                border: `1px solid ${inReview ? '#ffd591' : '#bae7ff'}`,
                fontWeight: 500,
              }}
            >
              {inReview ? (
                <EditOutlined style={{ color: '#fa8c16' }} />
              ) : (
                <EyeOutlined style={{ color: '#1890ff' }} />
              )}
              <Text type="secondary" strong>
                {inReview ? 'Review Mode' : 'Read-only Mode'}
              </Text>
            </Tag>
          </div>
        </div>

        {entityLoadWarning && (
          <Alert
            type="warning"
            showIcon
            message={entityLoadWarning}
            style={{ marginBottom: 16 }}
          />
        )}

        {decisionBlocked && (
          <PublicationBlockedReport
            targetLabel="This contribution"
            conflicts={decisionBlocked.conflicts}
            validation={decisionBlocked.validation}
            reason={decisionBlocked.reason}
            headline="Nothing was decided"
            assurance="The contribution is unchanged and still open for review."
            onDismiss={dismissDecisionBlocked}
          />
        )}

        <div
          className="contribute-content"
          // Dimmed while Previous / Next loads the next contribution.
          style={{
            opacity: isMoving ? 0.5 : 1,
            pointerEvents: isMoving ? 'none' : undefined,
            transition: 'opacity 0.15s',
          }}
        >
          {empty && active?.changeSet && (
            <ContributionForm
              key={active.id}
              entity={empty}
              contribution={active}
              onChange={(contribution) => {
                const updated = contribution as TransformedContribution;
                setActive((prev) => ({
                  ...updated,
                  voyageId: prev?.changeSet.id || updated.voyage_id,
                  author: prev?.changeSet.author || updated.changeSet.author,
                  status: prev?.status || updated.status,
                }));
              }}
              onSubmitted={() => {
                handleBackClick();
                handleGridRefresh();
              }}
              accessLevel={accessLevel}
              contributionId={contributionId}
              currentStatus={currentStatus}
              mode={mode}
              onStartReview={handleStartReview}
              onCommitReview={handleReviewSubmit}
              onAbandonReview={handleReviewCancel}
              onReviewModeChange={setInReview}
              onEditorialDecision={handleOnEditorialDecision}
              onReopen={handleReopenContribution}
            />
          )}
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      {/* Sticky header: tab bar + toolbar */}
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

        {/* Toolbar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px 12px 4px 4px',
            padding: '12px',
            marginBottom: '0',
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
                Edit Requests
              </Title>
              <div style={{ marginTop: '4px', color: '#6b7280' }}>
                Manage and review Edit Requests
              </div>
            </div>
            <Space size="middle">
              <SearchInput value={searchInput} onChange={handleSearchChange} />
              {hasActiveFilters && (
                <ActiveFiltersTag
                  count={activeFilterCount}
                  onClose={handleClearFilters}
                />
              )}
              <FilterToggleButton
                showFilters={showFilters}
                onClick={() => setShowFilters(!showFilters)}
              />
              <ColumnsControl gridRef={gridRef} columnDefs={columnDefs} />
              <Button
                icon={<SettingOutlined />}
                onClick={() => setBatchManagementVisible(true)}
                style={{
                  borderRadius: '6px',
                  height: '30px',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                }}
              >
                Batch Management
              </Button>
            </Space>
          </div>
        </div>
      </Box>
      {/* end sticky header */}

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <Card
          style={{
            marginBottom: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: '#f8fafc',
          }}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Badge
                count={selectedRows.length}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span style={{ marginLeft: '8px', fontWeight: 500 }}>
                {selectedRows.length} contribution(s) selected
              </span>
            </div>
            <Space>
              <Dropdown
                menu={{ items: bulkActionsMenuItems }}
                trigger={['click']}
              >
                <Button
                  type="primary"
                  style={{
                    background:
                      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                  }}
                >
                  Bulk actions <DownOutlined />
                </Button>
              </Dropdown>
              <Button size="small" onClick={handleClearSelection}>
                Clear Selection
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <FilterPanel
          batches={batches}
          filters={filters}
          form={form}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Row count */}
      {totalCount > 0 && (
        <div
          style={{
            textAlign: 'right',
            marginBottom: '6px',
            color: '#6b7280',
            fontSize: '13px',
          }}
        >
          {totalCount.toLocaleString()} contribution
          {totalCount !== 1 ? 's' : ''} — scroll to load more
        </div>
      )}

      {/* Grid */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(90vh - 220px)',
          width: openSideBar ? 'calc(100vw - 340px)' : 'calc(100vw - 120px)',
          border: '1px solid #d9d9d9',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
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
          selectionColumnDef={selectionColumnDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips={true}
          onRowClicked={handleRowClick}
          getRowClass={getRowClass}
          headerHeight={36}
          suppressHorizontalScroll={false}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            enableClickSelection: false,
            headerCheckbox: false,
            /**
             * Published and rejected contributions take part in neither bulk
             * action: neither can ever publish, and moving a published one
             * between batches destroys the record of what its batch published.
             * The server refuses both, so this only spares the round trip —
             * the checkbox stops offering the choice.
             */
            isRowSelectable: isContributionSelectable,
          }}
          onSelectionChanged={onSelectionChanged}
        />
      </div>

      {/* Modals */}
      <BatchManagement
        visible={batchManagementVisible}
        onClose={() => setBatchManagementVisible(false)}
        onBatchAssigned={() => {
          handleGridRefresh();
          message.success('Batch updated successfully');
        }}
      />
      <BatchAssignmentModal
        visible={batchAssignmentVisible}
        onClose={() => setBatchAssignmentVisible(false)}
        contributionIds={selectedRows}
        onSuccess={() => {
          setBatchAssignmentVisible(false);
          setSelectedRows([]);
          gridRef.current?.api.deselectAll();
          handleGridRefresh();
        }}
      />
      <BulkDecisionReport
        result={bulkResult}
        verb={bulkVerb}
        onClose={() => setBulkResult(null)}
      />
    </Box>
  );
};

export default EditorialPlatformTable;
