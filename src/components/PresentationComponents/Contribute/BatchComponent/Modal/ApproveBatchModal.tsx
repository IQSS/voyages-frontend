import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ContributionStatus,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';
import { Alert, Button, Modal, Progress, Tag, Typography } from 'antd';

import {
  ApproveJob,
  BatchWithContributions,
  batchApi,
} from '@/fetch/contributeFetch/batchApi';
import { groupRefusals } from '@/utils/contribute/bulkDecision';

const { Text, Paragraph } = Typography;
const POLL_INTERVAL_MS = 800;

interface ApproveBatchModalProps {
  visible: boolean;
  onClose: () => void;
  /** Refresh the batch list + counts once the job settles. */
  onSuccess: () => void;
  batch: PublicationBatch | null;
}

type Phase = 'confirm' | 'running' | 'done' | 'error';

/**
 * Approve every not-yet-decided contribution in a batch (WorkInProgress or
 * Submitted) without ticking rows.
 *
 * The work happens server-side as a job (a batch can hold thousands), so this
 * confirms first, then starts the job and polls it, showing a live bar and a
 * final tally. Accepting is decided per contribution, so the summary reports
 * how many were accepted, how many were already accepted, and how many were
 * refused (e.g. not ready) — mirroring the per-row bulk-decision report.
 */
const ApproveBatchModal: React.FC<ApproveBatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
  batch,
}) => {
  const [phase, setPhase] = useState<Phase>('confirm');
  const [job, setJob] = useState<ApproveJob | null>(null);
  const [startTotal, setStartTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Approvable = anything not yet decided: WorkInProgress (how imports land) or
  // Submitted. The list endpoint ships these per-status counts.
  const statusCounts =
    (batch as BatchWithContributions | null)?.statusCounts ?? {};
  const approvableCount =
    (statusCounts[ContributionStatus.WorkInProgress] ?? 0) +
    (statusCounts[ContributionStatus.Submitted] ?? 0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Reset to the confirm step whenever the modal (re)opens.
  useEffect(() => {
    if (visible) {
      setPhase('confirm');
      setJob(null);
      setStartTotal(0);
      setErrorMessage(null);
    } else {
      stopPolling();
    }
  }, [visible, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback(
    (jobId: string) => {
      const tick = async () => {
        try {
          const state = await batchApi.getApproveJob(jobId);
          setJob(state);
          if (state.status === 'completed') {
            setPhase('done');
            onSuccess();
            return;
          }
          if (state.status === 'failed') {
            setErrorMessage(state.failureReason ?? 'The approval job failed.');
            setPhase('error');
            onSuccess();
            return;
          }
          pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Lost track of the job.',
          );
          setPhase('error');
        }
      };
      pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [onSuccess],
  );

  const handleApprove = useCallback(async () => {
    if (!batch) return;
    setPhase('running');
    setErrorMessage(null);
    try {
      const started = await batchApi.approveBatch(batch.id);
      setStartTotal(started.total);
      setJob({
        jobId: started.jobId,
        status: 'running',
        batchId: started.batchId,
        batchTitle: started.batchTitle,
        progress: { processed: 0, total: started.total },
      });
      poll(started.jobId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to start batch approval.',
      );
      setPhase('error');
    }
  }, [batch, poll]);

  const handleClose = useCallback(() => {
    stopPolling();
    onClose();
  }, [onClose, stopPolling]);

  if (!batch) return null;

  const total = job?.progress.total ?? startTotal;
  const processed = job?.progress.processed ?? 0;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 100;
  const result = job?.result ?? null;

  let footer: React.ReactNode;
  if (phase === 'confirm') {
    footer = [
      <Button key="cancel" onClick={handleClose}>
        Cancel
      </Button>,
      <Button
        key="approve"
        type="primary"
        disabled={approvableCount === 0}
        onClick={handleApprove}
      >
        Approve {approvableCount} contribution{approvableCount === 1 ? '' : 's'}
      </Button>,
    ];
  } else if (phase === 'running') {
    footer = null;
  } else {
    footer = [
      <Button key="close" type="primary" onClick={handleClose}>
        Close
      </Button>,
    ];
  }

  return (
    <Modal
      open={visible}
      onCancel={phase === 'running' ? undefined : handleClose}
      closable={phase !== 'running'}
      maskClosable={false}
      footer={footer}
      width={640}
      // Opened from the Batch Management dialog (MUI, z-index 1300); antd
      // Modal defaults to 1000, which renders it behind. Lift it above.
      zIndex={2000}
      title={`Approve batch: ${batch.title}`}
    >
      {phase === 'confirm' && (
        <>
          {approvableCount === 0 ? (
            <Alert
              type="info"
              showIcon
              message="Nothing to approve"
              description="This batch has no contributions waiting on a decision — they are all already accepted, rejected, or published."
            />
          ) : (
            <>
              <Paragraph>
                This will accept the <Text strong>{approvableCount}</Text>{' '}
                contribution
                {approvableCount === 1 ? '' : 's'} in this batch not yet
                decided. Each is decided on its own and recorded against you.
              </Paragraph>
              <Alert
                type="warning"
                showIcon
                message="Accepted contributions become read-only"
                description="Any that are not ready to accept are left as they are and listed afterwards."
              />
            </>
          )}
        </>
      )}

      {phase === 'running' && (
        <>
          <Paragraph>
            Approving {total} contribution{total === 1 ? '' : 's'}…
          </Paragraph>
          <Progress percent={percent} status="active" />
          <Text type="secondary">
            {processed} of {total} decided
          </Text>
        </>
      )}

      {phase === 'error' && (
        <Alert
          type="error"
          showIcon
          message="Batch approval did not finish"
          description={errorMessage ?? 'Something went wrong.'}
        />
      )}

      {phase === 'done' && result && (
        <>
          <Alert
            type={result.refused.length > 0 ? 'warning' : 'success'}
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <strong>
                {result.changed.length} accepted
                {result.unchanged.length > 0
                  ? `, ${result.unchanged.length} already accepted`
                  : ''}
                {result.refused.length > 0
                  ? `, ${result.refused.length} refused`
                  : ''}
              </strong>
            }
            description={
              result.refused.length > 0
                ? 'The accepted contributions have moved. The ones below were left exactly as they were.'
                : 'Every eligible contribution in this batch was accepted.'
            }
          />
          {result.refused.length > 0 && (
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {groupRefusals(result.refused).map((group) => (
                <div
                  key={`${group.error} ${group.details ?? ''}`}
                  style={{ marginBottom: 12 }}
                >
                  <Text strong>{group.error}</Text>{' '}
                  <Tag>{group.ids.length}</Tag>
                  {group.details && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {group.details}
                      </Text>
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {group.ids.slice(0, 20).join(', ')}
                      {group.ids.length > 20
                        ? ` +${group.ids.length - 20} more`
                        : ''}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default ApproveBatchModal;
