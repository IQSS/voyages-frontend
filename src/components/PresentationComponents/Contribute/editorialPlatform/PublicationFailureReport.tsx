/**
 * What to send a developer when a publication run breaks.
 *
 * Data problems are caught before this stage — conflicts and validation errors
 * refuse the batch without ever reaching Django — so a failure here is a bug
 * rather than bad records. That makes the surrounding facts (which run, which
 * batch, when, how far it got) part of the report, not decoration: without them
 * the error text alone is rarely enough to find anything.
 */

import { useState } from 'react';

import { Box, Typography } from '@mui/material';
import { Button } from 'antd';

import type { PublicationStatus } from '@/fetch/contributeFetch/publishApi';
import type { PublicationTarget } from '@/hooks/contribute/usePublication';

interface PublicationFailureReportProps {
  target: PublicationTarget | null;
  status: PublicationStatus | null;
  error: string | null;
  startedAt: number | null;
}

const line = (label: string, value: string | number | undefined | null) =>
  value === undefined || value === null || value === ''
    ? null
    : `${label}: ${value}`;

const buildReport = ({
  target,
  status,
  error,
  startedAt,
}: PublicationFailureReportProps): string =>
  [
    'Publication failure report',
    line('Batch', target?.label),
    line('Target', target ? `${target.id} (${target.mode})` : null),
    line('Publication key', status?.publication_key),
    line('Started', startedAt ? new Date(startedAt).toISOString() : null),
    line('Created', status?.created_at),
    line('Completed', status?.completed_at),
    line('Duration (s)', status?.duration_seconds),
    line('Operations processed', status?.processed_operations),
    line('Contributions', status?.contribution_ids?.join(', ')),
    line('Server status', status?.status),
    '',
    'Error:',
    error ?? '(none reported)',
  ]
    .filter((part) => part !== null)
    .join('\n');

const PublicationFailureReport: React.FC<PublicationFailureReportProps> = (
  props,
) => {
  const { target, status, error, startedAt } = props;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport(props));
      setCopied(true);
      // Reverts on its own: a button stuck reading "Copied" tells the editor
      // nothing about whether a second press worked.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The details are on screen and
      // selectable, so this costs convenience rather than the report.
      setCopied(false);
    }
  };

  const facts = [
    ['Batch', target?.label ?? (target ? String(target.id) : '—')],
    ['Publication key', status?.publication_key ?? '—'],
    ['Started', startedAt ? new Date(startedAt).toLocaleString() : '—'],
    [
      'Operations processed',
      status?.processed_operations != null
        ? status.processed_operations.toLocaleString()
        : '—',
    ],
  ] as const;

  return (
    <Box>
      <div>
        The voyage records are unchanged. Data problems are caught before this
        stage, so this is likely a bug — send the details below to a developer.
      </div>

      <Box
        sx={{
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          columnGap: 2,
          rowGap: '2px',
          fontSize: 13,
        }}
      >
        {facts.map(([label, value]) => (
          <Box key={label} sx={{ display: 'contents' }}>
            <Typography sx={{ fontSize: 13, color: '#888' }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 13, fontFamily: 'monospace' }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {error && (
        <Box
          sx={{
            marginTop: '12px',
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            maxHeight: 160,
            overflow: 'auto',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 1,
            p: 1,
          }}
        >
          {error}
        </Box>
      )}

      <Button
        size="small"
        style={{ marginTop: 12 }}
        onClick={() => void copy()}
      >
        {copied ? 'Copied' : 'Copy details'}
      </Button>
    </Box>
  );
};

export default PublicationFailureReport;
