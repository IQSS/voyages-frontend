import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search contributions...',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) => (
  <Input
    placeholder={placeholder}
    prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
    value={value}
    onChange={onChange}
    style={{
      width: '300px',
      borderRadius: '8px',
      height: '32px',
    }}
    allowClear
  />
);
