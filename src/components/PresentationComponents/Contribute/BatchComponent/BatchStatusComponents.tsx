// components/BatchStatusComponents.tsx
import React from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip, Button, Space } from 'antd';

// Helper function to determine batch status from your backend interface
const getBatchStatus = (published: number | null): 'pending' | 'published' => {
  return published !== null ? 'published' : 'pending';
};

// Batch Status Tag Component
export const BatchStatusTag: React.FC<{
  published: number | null;
}> = ({ published }) => {
  const status = getBatchStatus(published);

  if (status === null) {
    return <Tag color="default">No Batch</Tag>;
  }

  const config = {
    pending: {
      icon: <ClockCircleOutlined />,
      color: 'orange',
      text: 'Pending',
    },
    published: {
      icon: <CheckCircleOutlined />,
      color: 'green',
      text: 'Published',
    },
  };

  const { icon, color, text } = config[status];

  return (
    <Tag icon={icon} color={color}>
      {text}
    </Tag>
  );
};

// Batch Info Component for table cells
export const BatchInfoCell: React.FC<{
  batchTitle?: string;
  batchPublished?: 'number | null | undefined';
  onAssignClick?: () => void;
}> = ({ batchTitle, batchPublished, onAssignClick }) => {
  if (!batchTitle) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#999', fontSize: '12px' }}>Not assigned</span>
        {onAssignClick && (
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={onAssignClick}
            style={{ padding: 0, height: 'auto' }}
          >
            Assign
          </Button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Tooltip title={`Batch: ${batchTitle}`}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {batchTitle}
        </span>
      </Tooltip>
      <BatchStatusTag published={batchPublished} />
    </div>
  );
};

// Batch Assignment Button Component
export const BatchAssignmentButton: React.FC<{
  contributionId: string;
  currentBatchId?: number;
  currentBatchTitle?: string;
  onAssign: (contributionId: string) => void;
  size?: 'small' | 'middle' | 'large' | undefined;
  type?: 'primary' | 'default' | 'text';
}> = ({
  contributionId,
  currentBatchTitle,
  onAssign,
  size = 'small',
  type = 'text',
}) => {
  return (
    <Button
      type={type}
      size={size}
      icon={<TeamOutlined />}
      onClick={() => onAssign(contributionId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: type === 'text' ? '0 4px' : undefined,
        height: size === 'small' ? '24px' : undefined,
      }}
    >
      {currentBatchTitle ? 'Reassign' : 'Assign'}
    </Button>
  );
};

// Batch Summary Component
export const BatchSummary: React.FC<{
  totalBatches: number;
  pendingBatches: number;
  publishedBatches: number;
  totalContributions?: number;
  assignedContributions?: number;
}> = ({
  totalBatches,
  pendingBatches,
  publishedBatches,
  totalContributions = 0,
  assignedContributions = 0,
}) => {
  const unassignedContributions = totalContributions - assignedContributions;

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileTextOutlined style={{ color: '#64748b' }} />
        <span style={{ fontSize: '14px', color: '#475569' }}>
          <strong>{totalBatches}</strong> Total Batches
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ClockCircleOutlined style={{ color: '#f59e0b' }} />
        <span style={{ fontSize: '14px', color: '#475569' }}>
          <strong>{pendingBatches}</strong> Pending
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircleOutlined style={{ color: '#10b981' }} />
        <span style={{ fontSize: '14px', color: '#475569' }}>
          <strong>{publishedBatches}</strong> Published
        </span>
      </div>

      {totalContributions > 0 && (
        <>
          <div
            style={{
              borderLeft: '1px solid #e2e8f0',
              height: '20px',
              alignSelf: 'center',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{assignedContributions}</strong> Assigned
            </span>
          </div>

          {unassignedContributions > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#ef4444' }}>
                <strong>{unassignedContributions}</strong> Unassigned
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Quick Actions Component
export const BatchQuickActions: React.FC<{
  onCreateBatch: () => void;
  onManageBatches: () => void;
  onBulkAssign: () => void;
  selectedCount?: number;
}> = ({ onCreateBatch, onManageBatches, onBulkAssign, selectedCount = 0 }) => {
  return (
    <Space size="small">
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={onCreateBatch}
        size="small"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
        }}
      >
        New Batch
      </Button>

      <Button
        icon={<TeamOutlined />}
        onClick={onBulkAssign}
        size="small"
        disabled={selectedCount === 0}
        style={{
          opacity: selectedCount === 0 ? 0.5 : 1,
        }}
      >
        Assign Selected {selectedCount > 0 && `(${selectedCount})`}
      </Button>

      <Button
        icon={<FileTextOutlined />}
        onClick={onManageBatches}
        size="small"
      >
        Manage Batches
      </Button>
    </Space>
  );
};

// Batch Filter Component
export const BatchFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  batches: Array<{ id: number; title: string; published: number | null }>;
  loading?: boolean;
}> = ({ value, onChange, batches, loading = false }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        fontSize: '12px',
        background: 'white',
        minWidth: '120px',
      }}
    >
      <option value="">All Batches</option>
      <option value="unassigned">Unassigned</option>
      {batches.map((batch) => (
        <option key={batch.id} value={batch.id}>
          {batch.title} ({getBatchStatus(batch.published)})
        </option>
      ))}
    </select>
  );
};

export default {
  BatchStatusTag,
  BatchInfoCell,
  BatchAssignmentButton,
  BatchSummary,
  BatchQuickActions,
  BatchFilter,
};
