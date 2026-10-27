// //* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import '@/style/table.scss';
import '@/style/contributeContent.scss';

export const FilterToggleButton = ({
  showFilters,
  onClick,
}: {
  showFilters: boolean;
  onClick: () => void;
}) => (
  <Button
    type={showFilters ? 'primary' : 'default'}
    icon={showFilters ? <UpOutlined /> : <DownOutlined />}
    onClick={onClick}
    style={{
      borderRadius: '6px',
      height: '30px',
      paddingLeft: '10px',
      paddingRight: '10px',
      background: showFilters
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'white',
      border: showFilters ? 'none' : '1px solid #d1d5db',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}
  >
    {showFilters ? 'Hide Filters' : 'Show Filters'}
  </Button>
);
