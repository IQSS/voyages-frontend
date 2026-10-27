import {
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';

import { useContributionNav } from '@/hooks/contribute/useContributionNav';

type ContributionNavBarProps = ReturnType<typeof useContributionNav>;

/** "‹ 12 of 926 ›" at the top right of a contribution. */
const ContributionNavBar = ({
  visible,
  position,
  total,
  moving,
  canPrev,
  canNext,
  goPrev,
  goNext,
}: ContributionNavBarProps) => {
  if (!visible) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
      }}
    >
      <Tooltip title="Previous">
        <Button
          size="small"
          aria-label="Previous"
          icon={<LeftOutlined />}
          disabled={!canPrev}
          onClick={goPrev}
        />
      </Tooltip>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 12, minWidth: 64, textAlign: 'center' }}
      >
        {moving ? <LoadingOutlined /> : `${position} of ${total}`}
      </Typography.Text>
      <Tooltip title="Next">
        <Button
          size="small"
          aria-label="Next"
          icon={<RightOutlined />}
          disabled={!canNext}
          onClick={goNext}
        />
      </Tooltip>
    </div>
  );
};

export default ContributionNavBar;
