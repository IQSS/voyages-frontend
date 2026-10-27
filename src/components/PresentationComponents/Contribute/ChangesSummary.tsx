import { useMemo, useState } from 'react';

import {
  ReloadOutlined,
  SaveOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Preview } from '@mui/icons-material';
import {
  Contribution,
  ContributionStatus,
  EntityChange,
  MaterializedEntity,
  PropertyAccessLevel,
} from '@slavevoyages/voyages-contribute';
import { Button, Typography, Timeline, Space, Tabs, Tooltip } from 'antd';
import type { TabsProps } from 'antd';

import '@/style/contributeContent.scss';

import { ReviewMode } from './ContributionForm';
import PropertyChangesList from './PropertyChangesList';

const { Text } = Typography;

const iconMap = {
  update: <EditOutlined style={{ color: '#1890ff' }} />,
  undelete: <PlusOutlined style={{ color: '#52c41a' }} />,
  delete: <DeleteOutlined style={{ color: '#f5222d' }} />,
};

// Reusable inner component for displaying changes timeline
interface ChangesTimelineProps {
  changes: EntityChange[];
  handleDeleteChange?: (propertyToDelete: string) => void;
  readOnly?: boolean;
  emptyMessage?: string;
  accessLevel?: PropertyAccessLevel;
}

const ChangesTimeline = ({
  changes,
  handleDeleteChange,
  readOnly = false,
  emptyMessage = 'No changes in this version',
  accessLevel,
}: ChangesTimelineProps) => {
  // No-op function for read-only mode
  const noOpDelete = () => {};

  if (changes.length === 0) {
    return (
      <Text type="secondary" italic>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Timeline
      mode="left"
      items={changes.map((change, index) => ({
        key: index,
        color: 'blue',
        dot: iconMap[change.type],
        children: (
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: 'rgb(55, 148, 141)' }}>
                {change.type.toUpperCase()} @{' '}
                <Text type="secondary">
                  {change.entityRef.schema}#{change.entityRef.id}
                </Text>
              </Text>
            </div>
            {change.type === 'update' ? (
              <PropertyChangesList
                changes={change.changes}
                handleDeleteChange={
                  readOnly ? noOpDelete : (handleDeleteChange ?? noOpDelete)
                }
                accessLevel={accessLevel}
              />
            ) : change.type === 'delete' ? (
              <div>Delete</div>
            ) : (
              <div>Un Delete</div>
            )}
          </div>
        ),
      }))}
    />
  );
};

interface ChangesSummaryProps {
  changes: EntityChange[];
  entity: MaterializedEntity;
  resetAllChanges: () => void;
  submitChanges?: () => void;
  handlePreview: () => void;
  handleSaveChanges: () => void;
  handleDeleteChange: (propertyToDelete: string) => void;
  isReviewMode?: boolean;
  onCommitReview?: () => void;
  readOnly?: boolean;
  currentStatus?: number;
  isSaveChange?: boolean;
  isSaving?: boolean;
  isSubmitting?: boolean;
  /** Latches once the server has accepted this contribution. */
  hasSubmitted?: boolean;
  mode?: ReviewMode;
  // New props for stacked review system
  contribution?: Contribution;
  currentReviewChanges?: EntityChange[];
  originalChanges?: EntityChange[];
  accessLevel?: PropertyAccessLevel;
}

const ChangesSummary = ({
  changes,
  mode,
  resetAllChanges,
  handlePreview,
  submitChanges,
  handleSaveChanges,
  handleDeleteChange,
  isReviewMode = false,
  onCommitReview,
  readOnly = false,
  isSaving = false,
  isSubmitting = false,
  hasSubmitted = false,
  contribution,
  currentReviewChanges = [],
  originalChanges = [],
  currentStatus,
  accessLevel,
}: ChangesSummaryProps) => {
  const isSettled =
    hasSubmitted ||
    (currentStatus !== undefined &&
      currentStatus !== ContributionStatus.WorkInProgress);

  /**
   * Why the button will not send this contribution; `null` means it will.
   *
   * It used to require a manual Save Changes first -- unsignposted, and cleared
   * by every subsequent edit, so a filled-in form just showed a grey button.
   * `handleSubmitChanges` saves before the status move anyway, so the gate only
   * hid the button from the person it was waiting on. What is left are the two
   * states that genuinely cannot work, and they now say so on hover.
   */
  const submitDisabledReason = isSettled
    ? 'This contribution has already been submitted, so it can no longer be edited or sent again.'
    : changes.length === 0
      ? 'Make at least one change to the form before submitting.'
      : null;

  // Build tab items for stacked review view
  const tabItems: TabsProps['items'] = useMemo(() => {
    // Show stacked tabs when:
    // 1. In Review mode (editor reviewing)
    // 2. In ReadOnly or Edit mode (viewing existing contributions)
    // 3. In Create mode AFTER save (when contribution has changes or reviews)
    const hasChangesOrReviews =
      (contribution?.changeSet?.changes?.length ?? 0) > 0 ||
      (contribution?.reviews?.length ?? 0) > 0;

    const shouldShowStackedTabs =
      contribution &&
      (isReviewMode ||
        mode === ReviewMode.ReadOnly ||
        mode === ReviewMode.Edit ||
        mode === ReviewMode.Review ||
        (mode === ReviewMode.Create && hasChangesOrReviews));

    if (!shouldShowStackedTabs) {
      return [
        {
          key: 'changes',
          label: `Changes (${changes.length})`,
          children: (
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
              <ChangesTimeline
                accessLevel={accessLevel}
                changes={changes}
                handleDeleteChange={handleDeleteChange}
                readOnly={readOnly}
                emptyMessage="No changes have been made yet"
              />
            </div>
          ),
        },
      ];
    }

    const items: TabsProps['items'] = [];

    // Tab 1: Contribution changes (Read-Only)
    // Use the originalChanges prop which preserves the initial state
    items.push({
      key: 'original',
      label: `Contribution`,
      children: (
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
          <ChangesTimeline
            accessLevel={accessLevel}
            changes={originalChanges}
            readOnly={true}
            emptyMessage="No changes in contribution"
          />
        </div>
      ),
    });

    // Review Tabs: Map through contribution.reviews (Read-Only)
    if (contribution.reviews && contribution.reviews.length > 0) {
      contribution.reviews.forEach((review, index) => {
        const reviewChanges = review.changeSet?.changes || [];
        items.push({
          key: `review-${index}`,
          label: `Review V${index + 1}`,
          children: (
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
              <ChangesTimeline
                accessLevel={accessLevel}
                changes={reviewChanges}
                readOnly={true}
                emptyMessage={`No changes in Review V${index + 1}`}
              />
            </div>
          ),
        });
      });
    }

    // Active Tab: Current Review (Editable) - Only show if in review mode
    if (isReviewMode) {
      items.push({
        key: 'current-review',
        label: <span>Review ({currentReviewChanges.length})</span>,
        children: (
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 50px)' }}>
            <ChangesTimeline
              accessLevel={accessLevel}
              changes={currentReviewChanges}
              handleDeleteChange={handleDeleteChange}
              readOnly={false}
              emptyMessage="No changes in current review yet"
            />
          </div>
        ),
      });
    }

    return items;
  }, [
    contribution,
    changes,
    currentReviewChanges,
    originalChanges,
    isReviewMode,
    mode,
    readOnly,
    handleDeleteChange,
    accessLevel,
  ]);

  const reviewsLength = contribution?.reviews?.length ?? 0;

  const [activeTabKey, setActiveTabKey] = useState<string>(() => {
    if (!contribution) return 'changes';
    if (isReviewMode) return 'current-review';
    if (mode === ReviewMode.Create) return 'changes';
    return 'original';
  });

  const validKeys = useMemo(
    () => (tabItems ?? []).map((t) => t?.key as string),
    [tabItems],
  );

  // Synchronous derived-state pattern: storing previous prop values in state so
  // that when they change we update activeTabKey in the *same* render frame
  // (calling setState during render causes React to restart immediately — no flash).
  const [prevIsReviewMode, setPrevIsReviewMode] = useState(isReviewMode);
  const [prevReviewsLength, setPrevReviewsLength] = useState(reviewsLength);
  const [prevValidKeys, setPrevValidKeys] = useState(validKeys);

  if (prevIsReviewMode !== isReviewMode) {
    setPrevIsReviewMode(isReviewMode);
    setPrevReviewsLength(reviewsLength);
    if (isReviewMode) {
      setActiveTabKey('current-review');
    } else {
      const lastIndex = reviewsLength - 1;
      setActiveTabKey(lastIndex >= 0 ? `review-${lastIndex}` : 'original');
    }
  } else if (prevReviewsLength !== reviewsLength) {
    setPrevReviewsLength(reviewsLength);
    if (!isReviewMode && reviewsLength > prevReviewsLength) {
      setActiveTabKey(`review-${reviewsLength - 1}`);
    }
  } else if (prevValidKeys !== validKeys) {
    setPrevValidKeys(validKeys);
    // tabItems changed and current key is no longer valid — snap to best tab
    if (!validKeys.includes(activeTabKey)) {
      if (isReviewMode && validKeys.includes('current-review')) {
        setActiveTabKey('current-review');
      } else if (validKeys.includes('original')) {
        setActiveTabKey('original');
      } else if (validKeys.length > 0) {
        setActiveTabKey(validKeys[0]);
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={tabItems}
          size="small"
          type="card"
          style={{ height: '100%' }}
          tabBarStyle={{ marginBottom: 8 }}
        />
      </div>
      <Space.Compact style={{ flexShrink: 0, paddingTop: 8 }}>
        <Button
          color="cyan"
          icon={<Preview />}
          variant="outlined"
          onClick={handlePreview}
        >
          Preview
        </Button>
        {!readOnly && (
          <>
            <Button
              color="primary"
              variant="outlined"
              icon={<SaveOutlined />}
              onClick={
                isReviewMode && onCommitReview
                  ? onCommitReview
                  : handleSaveChanges
              }
              disabled={
                isReviewMode
                  ? currentReviewChanges.length === 0
                  : changes.length === 0 || isSettled
              }
            >
              {isSaving
                ? 'Saving...'
                : isReviewMode
                  ? 'Commit Review'
                  : 'Save Changes'}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              danger
              onClick={resetAllChanges}
              disabled={
                (isReviewMode
                  ? currentReviewChanges.length === 0
                  : changes.length === 0) ||
                isSaving ||
                isSubmitting
              }
            >
              {isReviewMode ? 'Abandon Review' : 'Reset All'}
            </Button>
            {!isReviewMode && (
              // `title` on a disabled antd Button never fires: the button is
              // pointer-events:none, so the hover that would raise the tooltip
              // never reaches it. The wrapper is what the pointer actually
              // hits, which is the only way the reason gets read.
              <Tooltip title={submitDisabledReason ?? ''}>
                <span style={{ display: 'inline-flex', width: 150 }}>
                  <Button
                    style={{ width: 150 }}
                    type="primary"
                    onClick={submitChanges}
                    block
                    disabled={submitDisabledReason !== null}
                    loading={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : isSettled
                        ? 'Submitted'
                        : 'Submit Changes'}
                  </Button>
                </span>
              </Tooltip>
            )}
          </>
        )}
      </Space.Compact>
    </div>
  );
};

export default ChangesSummary;
