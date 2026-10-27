/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import {
  ContributionStatus,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';
import {
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Space,
  Typography,
  Form,
  Divider,
} from 'antd';

import '@/style/table.scss';
import { ContributionFilters } from '@/hooks/useSearchEditRequestsFilters';
import '@/style/contributeContent.scss';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const FilterPanel = ({
  filters,
  form,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  hasActiveFilters,
  batches,
}: {
  batches: PublicationBatch[];
  filters: ContributionFilters;
  form: any;
  onFilterChange: (field: keyof ContributionFilters, value: any) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  hasActiveFilters: boolean;
}) => (
  <Card
    style={{
      marginBottom: '16px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
      background: 'white',
    }}
    styles={{ body: { padding: '16px' } }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}
    >
      <Title level={5} style={{ margin: 0, color: '#374151' }}>
        Filter Options
      </Title>

      <Space size="small">
        <Button
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          style={{
            borderRadius: '4px',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            background: '#fef2f2',
            height: '28px',
            fontSize: '12px',
          }}
          disabled={!hasActiveFilters}
          size="small"
        >
          Clear All
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={onApplyFilters}
          style={{
            borderRadius: '4px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)',
            height: '28px',
            fontSize: '12px',
          }}
          size="small"
        >
          Apply Filters
        </Button>
      </Space>
    </div>

    <Divider style={{ margin: '12px 0' }} />

    <Form form={form} layout="vertical">
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Form.Item
            label={
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
              >
                Status
              </span>
            }
            name="status"
            style={{ marginBottom: '12px' }}
          >
            <Select
              value={filters.status}
              onChange={(value) => onFilterChange('status', value)}
              placeholder="All except Published"
              allowClear
              style={{ borderRadius: '4px' }}
              size="small"
            >
              <Option value={ContributionStatus.WorkInProgress}>
                Work In Progress
              </Option>
              <Option value={ContributionStatus.Submitted}>Submitted</Option>
              <Option value={ContributionStatus.Accepted}>Accepted</Option>
              <Option value={ContributionStatus.Rejected}>Rejected</Option>
              <Option value={ContributionStatus.Published}>Published</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6} lg={3}>
          <Form.Item
            label={
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
              >
                Publication Batch
              </span>
            }
            name="publicationBatch"
            style={{ marginBottom: '12px' }}
          >
            <Select
              value={filters.publicationBatch}
              onChange={(value) => onFilterChange('publicationBatch', value)}
              placeholder="All Batches"
              allowClear
              // Let the dropdown grow to fit the batch titles instead of being
              // clipped to the (narrow) filter control width.
              popupMatchSelectWidth={false}
              styles={{ popup: { root: { maxWidth: 360 } } }}
              style={{ borderRadius: '4px' }}
              size="small"
            >
              {batches.map((batch) => (
                <Option key={batch.id} value={batch.id}>
                  {batch.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Form.Item
            label={
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}
              >
                Date Range
              </span>
            }
            name="dateRange"
            style={{ marginBottom: '12px' }}
          >
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => onFilterChange('dateRange', dates)}
              style={{ width: '100%', borderRadius: '4px' }}
              size="small"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Card>
);
