import React from 'react';

import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Space, Tag } from 'antd';

export const statusConfig: Record<
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
  data?: any; // Full row data
  onStatusChange?: (
    contributionId: string,
    newStatus: ContributionStatus,
  ) => void;
}

const StatusCellRenderer: React.FC<StatusCellRendererProps> = ({ value }) => {
  const statusKey =
    value !== undefined && value in statusConfig
      ? (value as ContributionStatus)
      : ContributionStatus.WorkInProgress;
  const config = statusConfig[statusKey];

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Tag color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>
    </Space>
  );
};
export default StatusCellRenderer;
