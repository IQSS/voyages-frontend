import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Button, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import VoyageComparisonTable from './VoyageComparisonTable';
import StatusCellRenderer from '../../commons/StatusCellRenderer';
import {
  getMockVoyageSections,
  PendingContribution,
} from '../../mockData/pendingContributions';

const { Text } = Typography;

interface DrawerVoyageByIdProps {
  selected: PendingContribution | null;
  open: boolean;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const DrawerVoyageById: React.FC<DrawerVoyageByIdProps> = ({
  selected,
  open,
  onClose,
  onAccept,
  onReject,
}) => {
  const comparisonSections = selected ? getMockVoyageSections(selected) : [];

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontWeight: 600 }}>
            {selected?.changeSet?.title ||
              `Contribution #${selected?.voyage_id}`}
          </span>
          <Tag color={selected?.type === 'new' ? 'blue' : 'default'}>
            {selected?.type === 'new' ? 'New Voyage' : 'Edit Existing'}
          </Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={750}
      styles={{ body: { padding: '12px 16px' } }}
      extra={
        selected?.status === ContributionStatus.Submitted ? (
          <Space>
            <Button
              type="primary"
              style={{ background: '#52c41a', border: 'none' }}
              onClick={() => {
                onAccept(selected.id);
                onClose();
              }}
            >
              Accept
            </Button>
            <Button
              danger
              onClick={() => {
                onReject(selected.id);
                onClose();
              }}
            >
              Reject
            </Button>
          </Space>
        ) : undefined
      }
    >
      {selected && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Meta info */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              background: '#f9fafb',
              borderRadius: 8,
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              fontSize: 13,
            }}
          >
            <div>
              <Text type="secondary">Contributor</Text>
              <div style={{ fontWeight: 500 }}>
                {selected.changeSet?.author || '—'}
              </div>
            </div>
            <div>
              <Text type="secondary">Submitted</Text>
              <div style={{ fontWeight: 500 }}>
                {selected.changeSet?.timestamp
                  ? dayjs(selected.changeSet.timestamp).format('YYYY-MM-DD')
                  : '—'}
              </div>
            </div>
            <div>
              <Text type="secondary">Status</Text>
              <div style={{ marginTop: 2 }}>
                <StatusCellRenderer value={selected.status} />
              </div>
            </div>
            {selected.batch && (
              <div>
                <Text type="secondary">Batch</Text>
                <div style={{ fontWeight: 500 }}>{selected.batch.title}</div>
              </div>
            )}
          </div>

          {/* Researcher comments */}
          {selected.changeSet?.comments && (
            <div
              style={{
                background: '#fffbe6',
                borderRadius: 8,
                padding: '10px 16px',
                border: '1px solid #ffe58f',
                fontSize: 13,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Researcher Notes
              </Text>
              <div style={{ marginTop: 4, lineHeight: 1.6 }}>
                {selected.changeSet.comments}
              </div>
            </div>
          )}

          {/* Comparison table */}
          <VoyageComparisonTable
            contrib={selected}
            sections={comparisonSections}
          />
        </Space>
      )}
    </Drawer>
  );
};

export default DrawerVoyageById;
