import { type CSSProperties } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface PageBackHeaderProps {
  title: string;
  onBack: () => void;
  backTooltip?: string;
  style?: CSSProperties;
}

const PageBackHeader = ({
  title,
  onBack,
  backTooltip = 'Go back',
  style,
}: PageBackHeaderProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
      ...style,
    }}
  >
    <Tooltip title={backTooltip}>
      <Button
        shape="circle"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{
          borderColor: 'rgb(55, 148, 141)',
          color: 'rgb(55, 148, 141)',
          flexShrink: 0,
        }}
      />
    </Tooltip>
    <h1 className="page-title-1" style={{ margin: 0 }}>
      {title}
    </h1>
  </div>
);

export default PageBackHeader;
