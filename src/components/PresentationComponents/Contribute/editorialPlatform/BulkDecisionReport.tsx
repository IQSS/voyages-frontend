import { Box, Typography } from '@mui/material';
import { Alert, Modal, Tag } from 'antd';

import { BulkStatusResult } from '@/fetch/contributeFetch/bulkUpdateContributionStatus';
import { groupRefusals } from '@/utils/contribute/bulkDecision';

interface BulkDecisionReportProps {
  result: BulkStatusResult | null;
  /** What the editor was doing, as a past participle: "accepted", "rejected". */
  verb: string;
  onClose: () => void;
}

/**
 * What a bulk decision could not do.
 *
 * Shown only when something was refused, and worded so that the part which
 * worked is not in doubt: the contributions that moved have moved, and the
 * ones listed here are the remainder. A bulk action reported as a plain
 * failure would send an editor looking for damage that is not there.
 *
 * Refusals are grouped by reason rather than listed one per contribution. A
 * thousand drafts stopped by one rule is a single thing to understand, and the
 * ids matter only for finding those rows again.
 */
const BulkDecisionReport: React.FC<BulkDecisionReportProps> = ({
  result,
  verb,
  onClose,
}) => {
  if (!result || result.refused.length === 0) {
    return null;
  }

  const groups = groupRefusals(result.refused);

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={onClose}
      cancelButtonProps={{ style: { display: 'none' } }}
      okText="Close"
      width={720}
      title={`${result.refused.length} of ${result.requested} could not be ${verb}`}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message={
          <strong>
            {result.changed.length} {verb}
            {result.unchanged.length > 0
              ? `, ${result.unchanged.length} already ${verb}`
              : ''}
          </strong>
        }
        description="Those decisions stand. The contributions below were left exactly as they were."
      />

      {groups.map((group, index) => (
        <Box
          key={index}
          sx={{
            border: '1px solid #e8e8e8',
            borderRadius: 2,
            mb: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              px: 2,
              py: 1.25,
              backgroundColor: '#fafafa',
              borderBottom: '1px solid #e8e8e8',
            }}
          >
            <Tag color="warning" style={{ marginInlineEnd: 0 }}>
              {group.ids.length}
            </Tag>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {group.error}
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1.25 }}>
            {group.details && (
              <Typography sx={{ fontSize: 13, color: '#555', mb: 1 }}>
                {group.details}
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#888',
                wordBreak: 'break-all',
              }}
            >
              {group.ids.slice(0, 20).join(', ')}
              {group.ids.length > 20
                ? ` and ${group.ids.length - 20} more`
                : ''}
            </Typography>
          </Box>
        </Box>
      ))}
    </Modal>
  );
};

export default BulkDecisionReport;
