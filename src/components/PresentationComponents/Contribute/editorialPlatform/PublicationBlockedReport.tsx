import { Box, Typography } from '@mui/material';
import { Alert, Button, Tag } from 'antd';

import {
  PublicationConflict,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';
import {
  countIssues,
  groupIssuesByContribution,
} from '@/utils/contribute/publicationReport';

interface PublicationBlockedReportProps {
  /** What the editor tried to publish, for the summary line. */
  targetLabel: string;
  conflicts: PublicationConflict[];
  validation: PublicationValidation[];
  /**
   * The server's own reason. Used on its own when the refusal carries no
   * conflicts — an empty batch, for instance, is refused without any.
   */
  reason?: string | null;
  /**
   * What did not happen. Submission is refused from the same fold as
   * publication and reports the same shape, so it borrows this report — but it
   * has to say what it actually refused, not that nothing was published.
   */
  headline?: string;
  /** What is therefore still intact. Follows the reason, in the same sentence. */
  assurance?: string;
  onOpenContribution?: (contributionId: string) => void;
  onDismiss?: () => void;
}

const TEAL = 'rgb(55, 148, 141)';

/**
 * Shown when the server refuses to publish.
 *
 * Deliberately not worded as a failure: the request never reached the voyage
 * database, so nothing was written. What the editor has is a list of
 * contributions to fix, and the wording has to say so — "publication failed"
 * would send them looking in the wrong place.
 */
const PublicationBlockedReport: React.FC<PublicationBlockedReportProps> = ({
  targetLabel,
  conflicts,
  validation,
  reason,
  headline = 'Nothing was published',
  assurance = 'The voyage records are untouched.',
  onOpenContribution,
  onDismiss,
}) => {
  const groups = groupIssuesByContribution(conflicts, validation);
  const counts = countIssues(conflicts, validation);

  const summary = [
    counts.conflicts > 0 &&
      `${counts.conflicts} conflicting ${counts.conflicts === 1 ? 'value' : 'values'}`,
    counts.errors > 0 &&
      `${counts.errors} missing required ${counts.errors === 1 ? 'value' : 'values'}`,
  ]
    .filter(Boolean)
    .join(' and ');

  // Some refusals have no per-contribution detail — an empty batch, or one
  // still holding submitted work. The server's own sentence is all there is.
  const hasDetail = groups.length > 0;

  return (
    <Box>
      <Alert
        type="error"
        showIcon
        style={{ marginBottom: 20 }}
        message={<strong>{headline}</strong>}
        description={
          <span>
            {hasDetail
              ? `${targetLabel} needs ${summary} resolved first.`
              : (reason ?? `${targetLabel} cannot go ahead yet.`)}{' '}
            {assurance}
          </span>
        }
        action={
          onDismiss ? (
            <Button size="small" onClick={onDismiss}>
              Back
            </Button>
          ) : undefined
        }
      />

      {groups.map((group, index) => (
        <Box
          key={group.contributionId ?? `ungrouped-${index}`}
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
            {group.conflicts.length > 0 && (
              <Tag color="error" style={{ marginInlineEnd: 0 }}>
                {group.conflicts.length}{' '}
                {group.conflicts.length === 1 ? 'conflict' : 'conflicts'}
              </Tag>
            )}
            {group.validationErrors.length > 0 && (
              <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                {group.validationErrors.length} missing
              </Tag>
            )}
            <Typography
              sx={{ fontSize: 13, fontFamily: 'monospace', color: '#555' }}
            >
              {group.contributionId ?? 'Not attributed to one contribution'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            {group.contributionId && onOpenContribution && (
              <Button
                size="small"
                type="link"
                style={{ color: TEAL, paddingInline: 0 }}
                onClick={() => onOpenContribution(group.contributionId!)}
              >
                Open contribution
              </Button>
            )}
          </Box>

          <Box sx={{ px: 2, py: 0.5 }}>
            {group.conflicts.map((issue, i) => (
              <Box
                key={`c-${i}`}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  py: 1.25,
                  borderBottom: '1px solid #f0f0f0',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box
                  sx={{
                    width: 3,
                    borderRadius: 1,
                    backgroundColor: '#cf1322',
                    flex: 'none',
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    Two contributions set “{issue.label}” differently
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#888',
                    }}
                  >
                    {issue.schema} #{String(issue.entityId)} · {issue.field}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}
                  >
                    {issue.values.map((v, vi) => (
                      <Box
                        key={vi}
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: 12.5,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          border: '1px solid #e8e8e8',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {v === null ? 'empty' : String(v)}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}

            {group.validationErrors.map((issue, i) => (
              <Box
                key={`v-${i}`}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  py: 1.25,
                  borderBottom: '1px solid #f0f0f0',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Box
                  sx={{
                    width: 3,
                    borderRadius: 1,
                    backgroundColor: '#d48806',
                    flex: 'none',
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {issue.message}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#888',
                    }}
                  >
                    {issue.schema} #{String(issue.entityId)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default PublicationBlockedReport;
