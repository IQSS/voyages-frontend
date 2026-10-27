import { Tag, Badge } from 'antd';

export const ActiveFiltersTag = ({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) => (
  <Badge count={count} offset={[-8, 8]}>
    <Tag
      closable
      onClose={onClose}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '12px',
      }}
    >
      {count} filter{count > 1 ? 's' : ''} active
    </Tag>
  </Badge>
);
