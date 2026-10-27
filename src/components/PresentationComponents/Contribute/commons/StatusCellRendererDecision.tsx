import React from 'react';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Button, Space, Tag, Popconfirm, message } from 'antd';

const statusConfig: Record<
  ContributionStatus,
  { label: string; color: string }
> = {
  [ContributionStatus.WorkInProgress]: {
    label: 'Work In Progress',
    color: 'orange',
  },
  [ContributionStatus.Submitted]: {
    label: 'Submitted',
    color: 'blue',
  },
  [ContributionStatus.Accepted]: {
    label: 'Accepted',
    color: 'green',
  },
  [ContributionStatus.Rejected]: {
    label: 'Rejected',
    color: 'red',
  },
  [ContributionStatus.Published]: {
    label: 'Published',
    color: 'purple',
  },
};

interface StatusCellRendererProps {
  value?: ContributionStatus;
  data?: any;
  onStatusChange?: (
    contributionId: string,
    newStatus: ContributionStatus,
  ) => void;
}

// Enhanced Status Cell Renderer for AG-Grid with editorial actions
const StatusCellRenderer: React.FC<StatusCellRendererProps> = ({
  value,
  data,
  onStatusChange,
}) => {
  const statusKey =
    value! in statusConfig
      ? (value as ContributionStatus)
      : ContributionStatus.Submitted;
  const config = statusConfig[statusKey];

  const handleAccept = () => {
    if (onStatusChange && data?.id) {
      onStatusChange(data.id, ContributionStatus.Accepted);
      message.success('Contribution accepted successfully');
    }
  };

  const handleReject = () => {
    if (onStatusChange && data?.id) {
      onStatusChange(data.id, ContributionStatus.Rejected);
      message.success('Contribution rejected');
    }
  };

  // Only show action buttons for submitted contributions
  const canMakeDecision =
    statusKey === ContributionStatus.Submitted && onStatusChange;

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Tag color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>

      {canMakeDecision && (
        <Space size="small">
          <Popconfirm
            title="Accept this contribution?"
            description="This action will mark the contribution as accepted."
            onConfirm={handleAccept}
            okText="Accept"
            cancelText="Cancel"
            okButtonProps={{
              style: { background: '#52c41a', borderColor: '#52c41a' },
            }}
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                height: '24px',
                fontSize: '11px',
              }}
            >
              Accept
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Reject this contribution?"
            description="This action will mark the contribution as rejected."
            onConfirm={handleReject}
            okText="Reject"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
            }}
          >
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              style={{
                height: '24px',
                fontSize: '11px',
              }}
            >
              Reject
            </Button>
          </Popconfirm>
        </Space>
      )}
    </Space>
  );
};

export default StatusCellRenderer;
