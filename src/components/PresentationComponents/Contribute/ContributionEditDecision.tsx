/* eslint-disable prettier/prettier */
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { ContributionStatus, Review } from '@slavevoyages/voyages-contribute';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

import { statusConfig } from './commons/StatusCellRenderer';
import { ReviewMode } from './ContributionForm';
const { Text } = Typography;
export interface ContributionEditDecisionProps {
  handleEditorialDecisionSubmit: () => void;
  setSelectedDecision: React.Dispatch<
    React.SetStateAction<'accept' | 'reject' | null>
  >;
  selectedDecision: 'accept' | 'reject' | null;
  decisionComments: string;
  setDecisionComments: React.Dispatch<React.SetStateAction<string>>;
  currentStatus: ContributionStatus | undefined;
  mode?: ReviewMode;
  contributionId?: string;
  reviews?: Review[];
  /**
   * Send this back to Submitted. Absent when the screen has nowhere to send it
   * — the button is not offered rather than offered and then doing nothing.
   */
  onReopen?: () => void;
  /** Reopening is an editorial act; the server checks the role again. */
  canReopen?: boolean;
  uncommittedReviewChanges?: number;
  missingBeforeAccept?: string[];
  /** Other reasons the contribution cannot be accepted yet. */
  acceptBlockers?: string[];
}

const ContributionEditDecision = ({
  handleEditorialDecisionSubmit,
  setSelectedDecision,
  selectedDecision,
  mode,
  setDecisionComments,
  decisionComments,
  contributionId,
  currentStatus,
  reviews = [],
  onReopen,
  canReopen = false,
  uncommittedReviewChanges = 0,
  missingBeforeAccept = [],
  acceptBlockers = [],
}: ContributionEditDecisionProps) => {
  // Not gated on review mode: uncommitted review edits are exactly what an
  // editor most needs told back to them before they decide.
  const holdingUncommittedWork = uncommittedReviewChanges > 0;
  const blockedFromAccepting =
    selectedDecision === 'accept' &&
    (missingBeforeAccept.length > 0 || acceptBlockers.length > 0);
  const blockedReason = !blockedFromAccepting
    ? ''
    : missingBeforeAccept.length > 0
      ? `Start a review and fill in ${missingBeforeAccept.join(' and ')}, then accept — a new voyage cannot be published without ${missingBeforeAccept.length === 1 ? 'it' : 'them'}.`
      : acceptBlockers.join(' ');
  return (
    <Form
      layout="vertical"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        justifyContent: 'space-around',
      }}
    >
      {contributionId && currentStatus !== undefined && (
        <Card
          title={
            <div className="status-and-decistion">
              <div>
                <Text strong>Editorial Decision </Text>
              </div>
              <div>
                <Text strong>Current Status: </Text>
                <Tag
                  color={statusConfig[currentStatus]?.color || '#1890ff'}
                  style={{
                    fontWeight: 500,
                  }}
                >
                  {statusConfig[currentStatus]?.label ||
                    ContributionStatus[currentStatus]}
                </Tag>
              </div>
              {reviews.length > 0 && (
                <div>
                  <Text type="secondary">Reviews: {reviews.length}</Text>
                </div>
              )}
            </div>
          }
          style={{ flexShrink: 0, marginTop: '12px' }}
          className="card-contribute-decision"
        >
          {/*
            Shown while a review is open as well as before one is started.
            Deciding a new voyage means filling in the dataset first, which
            requires a review -- so hiding the decision behind "not reviewing"
            put the two halves of one job in two places the editor had to
            toggle between.
          */}
          {(mode === ReviewMode.ReadOnly || mode === ReviewMode.Review) &&
            currentStatus === ContributionStatus.Submitted && (
            <Row gutter={12}>
              <Col span={8}>
                <Text strong>Decision:</Text>
                <Select
                  placeholder="Select decision"
                  style={{ width: '100%', marginTop: 4 }}
                  value={selectedDecision}
                  onChange={setSelectedDecision}
                  options={[
                    { label: 'Accept', value: 'accept' },
                    { label: 'Reject', value: 'reject' },
                  ]}
                />
              </Col>
              <Col span={12}>
                <Text strong>Comments:</Text>
                <Input.TextArea
                  placeholder="Add decision comments..."
                  rows={3}
                  style={{ marginTop: 4 }}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                />
                {holdingUncommittedWork && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Your open review will be committed with this decision.
                  </Text>
                )}
              </Col>
              <Col span={4} style={{ display: 'flex', alignItems: 'end' }}>
                <Tooltip title={blockedReason}>
                  <Button
                    type="primary"
                    block
                    onClick={handleEditorialDecisionSubmit}
                    disabled={!selectedDecision || blockedFromAccepting}
                    style={
                      blockedFromAccepting
                        ? undefined
                        : {
                          background:
                              selectedDecision === 'accept'
                                ? '#0958d9'
                                : selectedDecision === 'reject'
                                  ? '#ff4d4f'
                                  : undefined,
                          borderColor:
                              selectedDecision === 'accept'
                                ? '#0958d9'
                                : selectedDecision === 'reject'
                                  ? '#ff4d4f'
                                  : undefined,
                        }
                    }
                  >
                    Submit Decision
                  </Button>
                </Tooltip>
              </Col>
            </Row>
          )}
          {currentStatus === ContributionStatus.Accepted && (
            <Alert
              message="Reviews Locked"
              description={
                <>
                  <LockOutlined style={{ marginRight: 8 }} />
                  This contribution has been accepted. All review changes have been merged into the original contribution. No further reviews can be added.
                  {reviews.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {reviews.length} review(s) were merged into the final version.
                      </Text>
                    </div>
                  )}
                  {/* Accepted is read-only, which is right until something in
                      here turns out to be missing a value publication requires:
                      then nothing can be fixed and the batch it sits in stays
                      blocked. Sending it back to Submitted is the way out. */}
                  {onReopen && canReopen && (
                    <div style={{ marginTop: 12 }}>
                      <Button
                        icon={<UnlockOutlined />}
                        onClick={onReopen}
                        size="small"
                      >
                        Reopen for editing
                      </Button>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Sends it back to Submitted so it can be reviewed and edited again — for a contribution that cannot publish as it stands.
                        </Text>
                      </div>
                    </div>
                  )}
                </>
              }
              type="success"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
          {currentStatus === ContributionStatus.Rejected && (
            <Alert
              message="Contribution Rejected"
              description={
                <>
                  <LockOutlined style={{ marginRight: 8 }} />
                  This contribution has been rejected. No further reviews can be added.
                </>
              }
              type="error"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Card>
      )}
    </Form>
  );
};
export default ContributionEditDecision;
