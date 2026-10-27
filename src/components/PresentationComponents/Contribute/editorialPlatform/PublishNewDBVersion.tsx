import { useCallback, useEffect, useState } from 'react';

import { Box, Chip, Link, Typography } from '@mui/material';
import {
  Alert,
  Button,
  message,
  Modal,
  Progress,
  Radio,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  batchApi,
  formatBatchDate,
  type BatchWithContributions,
} from '@/fetch/contributeFetch/batchApi';
import { usePublication } from '@/hooks/contribute/usePublication';
import {
  getBatchPublishability,
  summariseBlockers,
} from '@/utils/contribute/batchPublishability';
import { warningsOf } from '@/utils/contribute/publicationReport';

import PublicationBlockedReport from './PublicationBlockedReport';
import PublicationFailureReport from './PublicationFailureReport';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';

const TEAL = 'rgb(55, 148, 141)';

const PublishNewDBVersion: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchWithContributions[]>([]);
  const [loading, setLoading] = useState(true);
  // Remove-batch dialog: which batch, which mode, and whether the delete is
  // in flight. `unassign` keeps the contributions; `delete` removes them too.
  const [removeTarget, setRemoveTarget] =
    useState<BatchWithContributions | null>(null);
  const [removeMode, setRemoveMode] = useState<'unassign' | 'delete'>(
    'unassign',
  );
  const [removing, setRemoving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    phase,
    target,
    status,
    conflicts,
    validation,
    error,
    startedAt,
    publish,
    retry,
    reset,
  } = usePublication();

  // Ticks only while a run is on screen, so the elapsed time is live without
  // the component re-rendering when nothing is happening.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== 'starting' && phase !== 'publishing') {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const elapsed = startedAt
    ? Math.max(0, Math.floor((now - startedAt) / 1000))
    : 0;
  const elapsedLabel = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  // Pending is the working view — this screen exists to publish things — but a
  // published batch used to vanish with no way to confirm it had gone out.
  const [filter, setFilter] = useState<'pending' | 'published'>('pending');

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await batchApi.getBatches(filter);
      setBatches(response.batches);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Could not load batches.',
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  // A published batch moves between the two lists, so refresh once it lands.
  useEffect(() => {
    if (phase === 'completed') {
      void loadBatches();
    }
  }, [phase, loadBatches]);

  const confirmPublish = (batch: BatchWithContributions) => {
    Modal.confirm({
      title: `Publish “${batch.title}”?`,
      content:
        'Every accepted contribution in this batch will be written to the voyage records. This cannot be undone from here.',
      okText: 'Publish',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: TEAL } },
      onOk: () => publish({ id: batch.id, mode: 'batch', label: batch.title }),
    });
  };

  // Open the remove-batch dialog. The editor chooses whether to keep the
  // contributions (unassign) or delete them too before confirming.
  const openRemove = (batch: BatchWithContributions) => {
    setRemoveTarget(batch);
    setRemoveMode('unassign');
  };

  const closeRemove = () => {
    if (removing) return;
    setRemoveTarget(null);
  };

  const doRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await batchApi.deleteBatch(removeTarget.id, removeMode === 'delete');
      message.success(
        removeMode === 'delete'
          ? `Deleted “${removeTarget.title}” and its contributions`
          : `Removed “${removeTarget.title}” from the queue`,
      );
      setRemoveTarget(null);
      await loadBatches();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Failed to remove batch',
      );
    } finally {
      setRemoving(false);
    }
  };

  const isRunning = phase === 'starting' || phase === 'publishing';

  const columns = [
    {
      title: 'Batch',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, batch: BatchWithContributions) => {
        // Blockers answer "why can't I publish this", which is not a question
        // being asked about a batch that already went out.
        const blockers =
          batch.published === null
            ? summariseBlockers(getBatchPublishability(batch))
            : [];
        return (
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              {title}
            </Typography>
            {batch.comments && (
              <Typography sx={{ fontSize: 12.5, color: '#888' }}>
                {batch.comments}
              </Typography>
            )}
            {/* Amber rather than red: this is work still to do, not a fault.
                Margin in explicit px because this project's theme defines
                `spacing` as an array, which rejects fractional shorthands. */}
            {blockers.length > 0 && (
              <Typography
                sx={{ fontSize: 12.5, color: '#d48806', marginTop: '2px' }}
              >
                {blockers.map((blocker, i) => (
                  <span key={blocker.status}>
                    {i > 0 && ' · '}
                    {/* A count answers "how many"; on a batch of 1,401 the
                        only useful question is "which". Each group links to
                        the requests table filtered to exactly those rows. */}
                    {/* A real link rather than a button with an onClick: it
                        carries an href, so it can be middle-clicked or opened
                        in a new tab like anything else that navigates. */}
                    <Link
                      component={RouterLink}
                      to="/contribute/editor_main/requests"
                      state={{
                        filters: {
                          publicationBatch: batch.id,
                          status: blocker.status,
                        },
                      }}
                      underline="hover"
                      sx={{ fontSize: 12.5, color: 'inherit' }}
                    >
                      {blocker.text}
                    </Link>
                  </span>
                ))}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      title: 'Contributions',
      key: 'contributions',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, batch: BatchWithContributions) => {
        const count = batch.contributionCount ?? 0;
        return (
          <Chip
            label={count}
            color={count > 0 ? 'primary' : 'default'}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        );
      },
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      width: 160,
      render: (published: number | null) =>
        published === null ? (
          <Tag>Not published</Tag>
        ) : (
          <span>{formatBatchDate(published)}</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 210,
      render: (_: unknown, batch: BatchWithContributions) => {
        // An already-published batch has nothing to offer here. Suppressed
        // rather than disabled: a greyed Publish invites the question of what
        // would un-grey it, and nothing would.
        if (batch.published !== null) {
          return null;
        }
        const { publishable, reason } = getBatchPublishability(batch);
        // Only the batch actually being published says so; the rest stay
        // enabled, since a second run would just join the first.
        const isThisOne = isRunning && target?.id === batch.id;
        const disabled = !publishable || isRunning;

        const button = (
          <Button
            size="small"
            type="primary"
            style={{ backgroundColor: disabled ? undefined : TEAL }}
            disabled={disabled}
            loading={isThisOne}
            onClick={() => confirmPublish(batch)}
          >
            {isThisOne ? 'Publishing' : 'Publish'}
          </Button>
        );

        // A disabled antd Button emits no pointer events, so the Tooltip needs
        // a live element to listen on or the reason is never seen.
        const publishControl = reason ? (
          <Tooltip title={reason}>
            <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
              {button}
            </span>
          </Tooltip>
        ) : (
          button
        );

        return (
          <Space size={8}>
            {publishControl}
            {/* Remove from the queue. Disabled during a run so the queue is not
                changed out from under a publication in progress. */}
            <Button
              size="small"
              danger
              disabled={isRunning}
              onClick={() => openRemove(batch)}
            >
              Remove
            </Button>
          </Space>
        );
      },
    },
  ];

  const warnings = warningsOf(validation);

  return (
    <Box sx={{ pr: 4, pl: 2, pb: 4, width: '100%' }}>
      <ListEditorialPlatForm />
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: '24px', fontWeight: 600 }}>
          Publish New DB Version
        </Typography>
        <Radio.Group
          size="small"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Published', value: 'published' },
          ]}
        />
      </Box>

      {phase === 'blocked' && target && (
        <PublicationBlockedReport
          targetLabel={target.label ?? `Batch ${target.id}`}
          conflicts={conflicts}
          validation={validation}
          reason={error}
          onDismiss={reset}
          onOpenContribution={(id) =>
            navigate(`/contribute/editor_main/requests/${id}`)
          }
        />
      )}

      {(phase === 'starting' || phase === 'publishing') && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid #e8e8e8',
            borderRadius: 1,
            background: '#fafafa',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              Publishing {target?.label ?? ''}
            </Typography>
            <Typography
              sx={{ fontSize: 14, fontFamily: 'monospace', color: '#666' }}
            >
              {elapsedLabel}
            </Typography>
          </Box>
          {/* Indeterminate on purpose. The run is one transaction, so there is
              no proportion of records "done" to show — a filling bar would
              claim progress that cannot be rolled back. */}
          <Progress
            percent={100}
            status="active"
            showInfo={false}
            strokeColor={TEAL}
          />
          <Typography sx={{ fontSize: 13.5, mt: 1 }}>
            {status?.status === 'processing' ? 'Writing changes' : 'Preparing'}
            {/* Django reports the count every hundred operations, so a small
                batch finishes still reporting zero. Saying "0 operations"
                would read as though nothing had happened. */}
            {status?.processed_operations
              ? ` · ${status.processed_operations.toLocaleString()} operations`
              : ''}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#888', marginTop: '4px' }}>
            Nothing is written until this finishes. You can leave this page —
            publishing continues on the server.
          </Typography>
        </Box>
      )}

      {phase === 'stalled' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message={<strong>Lost contact with the publication</strong>}
          description={
            <Box>
              {/* Deliberately not "nothing was published": the run may be
                  committing right now, and claiming otherwise at exactly that
                  moment is the worst thing this screen could say. */}
              <div>
                This page stopped hearing back from the server. The publication
                may still be running — its outcome is unknown from here.
              </div>
              {error && (
                <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: 12 }}>
                  {error}
                </Box>
              )}
            </Box>
          }
          action={
            <Button size="small" onClick={retry}>
              Check again
            </Button>
          }
        />
      )}

      {phase === 'completed' && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
          message={<strong>Published</strong>}
          description={
            <Box>
              <div>
                {/* The server only reports the operation count every hundred
                    operations, so a small batch finishes reporting zero. Saying
                    "0 operations" would read as though nothing happened. */}
                {status?.processed_operations
                  ? `${status.processed_operations.toLocaleString()} operations`
                  : `${target?.label ?? 'The batch'} is now in the voyage records`}
                {status?.duration_seconds
                  ? ` in ${Math.round(status.duration_seconds)}s`
                  : ''}
                .
              </div>
              {warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <strong>
                    {warnings.length}{' '}
                    {warnings.length === 1 ? 'warning' : 'warnings'}, published
                    anyway:
                  </strong>
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i} style={{ fontSize: 13 }}>
                      {w.message}
                    </div>
                  ))}
                </Box>
              )}
            </Box>
          }
          action={
            <Button size="small" onClick={reset}>
              Done
            </Button>
          }
        />
      )}

      {phase === 'failed' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          message={<strong>Publication failed — nothing was published</strong>}
          description={
            /* The whole run is one transaction, so a failure rolls it back
               entirely. Getting here means a bug rather than bad records,
               which is why the report is worth passing on intact. */
            <PublicationFailureReport
              target={target}
              status={status}
              error={error}
              startedAt={startedAt}
            />
          }
          action={
            <Button size="small" onClick={reset}>
              Back
            </Button>
          }
        />
      )}

      {loadError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={loadError}
          action={
            <Button size="small" onClick={() => void loadBatches()}>
              Retry
            </Button>
          }
        />
      )}

      {phase !== 'blocked' && (
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={batches}
          pagination={false}
          locale={{
            emptyText:
              filter === 'pending'
                ? 'No batches waiting to be published.'
                : 'Nothing has been published yet.',
          }}
        />
      )}

      <Modal
        title={`Remove “${removeTarget?.title ?? ''}” from the queue`}
        open={removeTarget !== null}
        onCancel={closeRemove}
        onOk={doRemove}
        confirmLoading={removing}
        okText={
          removeMode === 'delete'
            ? 'Delete batch and contributions'
            : 'Unassign and delete batch'
        }
        okButtonProps={{ danger: removeMode === 'delete' }}
        cancelText="Cancel"
      >
        <Typography sx={{ mb: 1.5, fontSize: 13.5 }}>
          {(removeTarget?.contributionCount ?? 0) > 0
            ? `This batch has ${removeTarget?.contributionCount} contribution(s). Choose what happens to them:`
            : 'This batch has no contributions. It will simply be deleted.'}
        </Typography>
        <Radio.Group
          value={removeMode}
          onChange={(e) => setRemoveMode(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Radio value="unassign">
            <strong>Unassign contributions and delete batch</strong>
            <div style={{ fontSize: 12.5, color: '#888' }}>
              The contributions are kept — unassigned from the batch and back in
              the pool (All Request). Only the batch is deleted.
            </div>
          </Radio>
          <Radio value="delete">
            <strong>Delete batch and assigned contributions</strong>
            <div style={{ fontSize: 12.5, color: '#888' }}>
              The batch and every contribution assigned to it are permanently
              deleted. This cannot be undone.
            </div>
          </Radio>
        </Radio.Group>
      </Modal>
    </Box>
  );
};

export default PublishNewDBVersion;
