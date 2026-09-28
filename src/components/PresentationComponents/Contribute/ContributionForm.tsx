import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DownOutlined,
  EditOutlined,
  ThunderboltOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Contribution,
  ContributionStatus,
  EntityChange,
  getSchema,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
} from '@slavevoyages/voyages-contribute';
import {
  Button,
  Card,
  Alert,
  Col,
  ConfigProvider,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Segmented,
  Splitter,
  Tooltip,
  Typography,
} from 'antd';

import { useContributionForm } from '@/hooks/contribute/useContributionForm';
import { imputeContribution } from '@/utils/impute/imputeContribution';
import { isImputeAvailable } from '@/utils/impute/runImpute';

import ChangesSummary from './ChangesSummary';
import ContributionEditDecision from './ContributionEditDecision';
import PublicationBlockedReport from './editorialPlatform/PublicationBlockedReport';
import { EntityForm } from './EntityForm';
import PreviewChangeDialog from './PreviewChange/PreviewChangeDialog';
import { TransformedContribution } from './utils/transformContributionData';

const { Text } = Typography;

// ── Exported types & constants (used by other components) ───────────────────

export enum ReviewMode {
  Create = 'create',
  Edit = 'edit',
  ReadOnly = 'read-only',
  Review = 'review',
}

export const ContributionSectionStyle: CSSProperties = {
  height: 'calc(100vh - 275px)',
  scrollSnapAlign: 'start',
};

export const ContributionSectionStyleCreate: CSSProperties = {
  height: 'calc(100vh - 500px)',
  scrollSnapAlign: 'start',
};

export interface ContributionFormProps {
  entity: MaterializedEntity;
  contribution?: Contribution;
  onChange?: (contribuition: Contribution | TransformedContribution) => void;
  /**
   * Fired once the store has accepted a submission.
   *
   * A host that shows this form as a panel over its own list -- rather than on
   * a route of its own -- cannot learn that from `onChange`, which also fires
   * throughout an editorial review. It needs to know to put the list back.
   */
  onSubmitted?: () => void;
  changeSet?: {
    id: string;
    changes: EntityChange[];
    comments?: string;
    title?: string;
    author?: string;
  };
  accessLevel?: PropertyAccessLevel;
  contributionId?: string;
  currentStatus?: ContributionStatus;
  mode?: ReviewMode;
  onStartReview?: () => void;
  onCommitReview?: (review: Review) => void | Promise<void>;
  onAbandonReview?: () => void;
  /**
   * Told whenever the form enters or leaves review mode, so a host that shows
   * its own mode indicator (the "Read-only Mode" tag) can follow it (DD-0556).
   */
  onReviewModeChange?: (inReview: boolean) => void;
  handleSaveChanges?: () => Promise<void>;
  onEditorialDecision?: (
    decision: 'accept' | 'reject',
    comments?: string,
  ) => void;
  /** Move an accepted contribution back to Submitted so it can be edited. */
  onReopen?: () => void;
  title?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export const ContributionForm = (props: ContributionFormProps) => {
  const { title, currentStatus, contribution, mode } = props;

  const {
    contributeForm,
    schema,
    translatedcontribute,
    accessLevel,
    setAccessLevel,
    globalExpand,
    expandedMenu,
    setExpandedMenu,
    setSections,
    isSaveChange,
    isSaving,
    isSubmitting,
    hasSubmitted,
    previewEntity,
    setPreviewEntity,
    decisionComments,
    setDecisionComments,
    selectedDecision,
    setSelectedDecision,
    isReviewMode,
    reviewChanges,
    originalChanges,
    reviews,
    isReadOnlyMode,
    isEditor,
    stackedEntity,
    accessLevelOptions,
    displayedChanges,
    isShowStartReview,
    isShowStartReviewDisable,
    initAccessLevel,
    submitBlocked,
    dismissSubmitBlocked,
    handleStartReview,
    handleCommitReview,
    handleCancelReview,
    handleEditorialDecisionSubmit,
    handleReopenForEditing,
    onChangesUpdate,
    handlePreviewChanges,
    handleSaveChanges,
    handleSubmitChanges,
    resetAllChanges,
    toggleExpandAll,
    handleDeletePropertyChange,
  } = useContributionForm(props);

  const { onReviewModeChange } = props;
  useEffect(() => {
    onReviewModeChange?.(isReviewMode);
  }, [isReviewMode, onReviewModeChange]);

  const [splitterMode, setSplitterMode] = useState<
    'split' | 'form' | 'changes'
  >('split');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isImputing, setIsImputing] = useState(false);

  /**
   * The editor-only values a new voyage cannot be accepted without.
   * Only for a new voyage: an edit to an existing one already has its id.
   */
  const missingAcceptProps = useMemo(() => {
    if (stackedEntity?.entityRef.type !== 'new') {
      return [] as { uid: string; label: string }[];
    }
    const assigned = new Set<string>();
    const everyChange = [
      ...(contribution?.changeSet?.changes ?? []),
      ...(reviews ?? []).flatMap((r) => r.changeSet?.changes ?? []),
      ...reviewChanges,
    ];
    for (const entityChange of everyChange) {
      if (entityChange.type !== 'update') continue;
      if (entityChange.entityRef.id !== stackedEntity.entityRef.id) continue;
      for (const c of entityChange.changes) {
        // A field typed into and then cleared records a change with an empty
        // string, not null -- `!== null` alone would count that as filled in,
        // the same gap `assignedVoyageId` guards against for this property.
        if (
          c.kind === 'direct' &&
          c.changed !== null &&
          c.changed !== undefined &&
          c.changed !== ''
        ) {
          assigned.add(c.property);
        }
      }
    }
    return getSchema(stackedEntity.entityRef.schema)
      .properties.filter(
        (p) =>
          (p as { notNull?: boolean }).notNull &&
          p.accessLevel === PropertyAccessLevel.Editor,
      )
      .filter((p) => !assigned.has(p.uid))
      .map((p) => ({ uid: p.uid, label: p.label }));
  }, [stackedEntity, contribution, reviews, reviewChanges]);

  const missingBeforeAccept = useMemo(
    () => missingAcceptProps.map((p) => p.label),
    [missingAcceptProps],
  );
  const missingAcceptUids = useMemo(
    () => missingAcceptProps.map((p) => p.uid),
    [missingAcceptProps],
  );

  // The required editor values are locked until a review is started, so on the
  // read-only screen the editor is pointed at Start Review, not told to fill
  // in a field they cannot touch.
  const missingList = missingBeforeAccept.join(' and ');
  const requiredFieldHint = isReadOnlyMode
    ? 'Required — click Start Review to fill this in.'
    : 'Required before accepting.';

  // Committing a review that leaves them empty is allowed -- an editor may
  // commit other fixes first -- but not silently: acceptance stays blocked
  // until they are filled, so say so and offer the way back.
  const handleCommitReviewChecked = useCallback(() => {
    if (missingBeforeAccept.length === 0) {
      handleCommitReview();
      return;
    }
    Modal.confirm({
      title: `${missingList} ${missingBeforeAccept.length === 1 ? 'is' : 'are'} still empty`,
      content: `This new voyage cannot be accepted until ${missingList} ${missingBeforeAccept.length === 1 ? 'is' : 'are'} filled in.`,
      okText: 'Commit anyway',
      cancelText: 'Go back and fill in',
      onOk: handleCommitReview,
    });
  }, [missingBeforeAccept, missingList, handleCommitReview]);

  const handleImpute = async () => {
    if (!props.contributionId) return;
    setIsImputing(true);
    try {
      const result = await imputeContribution({
        entity: stackedEntity,
        reviews,
      });
      if (!result.changed || !result.review) {
        // A no-op run is a legitimate outcome, not a success to celebrate.
        message.info('Nothing to impute — the computed values already match.');
      } else if (props.onCommitReview) {
        // Hand the bot's review to the same path a human review takes, so it is
        // both persisted and appended to the on-screen stack. Submitting it
        // here instead would save it but leave the diff looking unchanged.
        props.onCommitReview(result.review);
        if (result.skipped.length > 0) {
          message.info(
            `Left ${result.skipped.length} ` +
              `${result.skipped.length === 1 ? 'value' : 'values'} you had already set.`,
          );
        }
      } else {
        message.warning(
          'Imputation ran but this screen cannot stack the review — reopen the contribution from the Editorial Platform.',
        );
      }
      if (result.unresolvedCodes.length > 0) {
        message.warning(
          `${result.unresolvedCodes.length} imputed code${
            result.unresolvedCodes.length === 1 ? '' : 's'
          } matched no record and were skipped.`,
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Imputation failed — try again';
      message.error(msg);
    } finally {
      setIsImputing(false);
    }
  };

  // Editor-only action; the server re-checks the role on the review regardless.
  //
  // Restricted to the review flow as well as the role. Imputation writes a bot
  // review onto a contribution, which only makes sense once there is something
  // submitted to review -- on the contributor's own New Voyage and Edit forms
  // there is nothing to impute from yet, and an editor filling those in is
  // acting as a contributor. The role alone let the button through there,
  // because whoever opened the form happened to hold it.
  const isContributorForm =
    mode === ReviewMode.Create || mode === ReviewMode.Edit;
  const showImputeButton =
    isEditor && !!props.contributionId && !isContributorForm;

  return (
    <>
      {title && <h1 className="page-title-1">{title}</h1>}

      {/* Contribution details card */}
      <Form
        form={contributeForm}
        layout="vertical"
        onFinish={isSaveChange ? handleSaveChanges : handleSubmitChanges}
        style={{ marginBottom: 10 }}
      >
        <Card
          className="card-contribute"
          styles={{ body: { padding: detailsOpen ? '10px' : 0 } }}
          title={
            <div className="contribute-edit-header">
              <span>
                {isReviewMode ? 'Review Details' : 'Contribution Details'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {showImputeButton && (
                  <Tooltip
                    title={
                      isImputeAvailable
                        ? 'Compute imputed values and stack them as a review'
                        : 'The imputation calculation is not published yet — everything around it is ready.'
                    }
                  >
                    {/*
                      A disabled antd Button emits no pointer events, so a
                      Tooltip wrapped straight around it never fires — and the
                      one explanation of why the button is dead would never be
                      seen. The span is what the tooltip actually listens on.
                    */}
                    <span
                      style={{
                        display: 'inline-block',
                        cursor: isImputeAvailable ? undefined : 'not-allowed',
                      }}
                    >
                      <Button
                        icon={<ThunderboltOutlined />}
                        loading={isImputing}
                        onClick={handleImpute}
                        disabled={!isImputeAvailable}
                        size="small"
                        style={{
                          background: isImputeAvailable ? '#fa8c16' : undefined,
                          color: isImputeAvailable ? '#fff' : undefined,
                          border: 'none',
                          fontWeight: 600,
                          borderRadius: 6,
                          pointerEvents: isImputeAvailable ? undefined : 'none',
                        }}
                      >
                        Impute
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {isShowStartReview && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={handleStartReview}
                    disabled={isShowStartReviewDisable}
                    size="small"
                    style={{
                      background: '#fff',
                      color: 'rgb(55, 148, 141)',
                      border: 'none',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    Start Review
                  </Button>
                )}
                {isReviewMode && (
                  <div className="action-review-btn">
                    <Button onClick={handleCancelReview} danger>
                      <div className="abandon-review">Cancel Review</div>
                    </Button>
                    <Button
                      onClick={handleCommitReviewChecked}
                      type="primary"
                      disabled={reviewChanges.length === 0}
                    >
                      <div className="commit-review">
                        Commit Review ({reviewChanges.length} changes)
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          }
          extra={
            <Button
              size="small"
              icon={detailsOpen ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setDetailsOpen((v) => !v)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 6,
              }}
            >
              {detailsOpen ? 'Collapse' : 'Expand'}
            </Button>
          }
        >
          {detailsOpen && (
            <Row gutter={12}>
              <Col span={12}>
                {initAccessLevel === undefined && (
                  <Form.Item label="Contributor Mode" name="accessLevel">
                    <Radio.Group
                      value={accessLevel}
                      onChange={(e) => setAccessLevel(e.target.value)}
                      disabled={isReadOnlyMode}
                    >
                      {accessLevelOptions.map((opt) => (
                        <Radio key={opt.value} value={opt.value}>
                          {opt.label}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                )}
              </Col>
              <Col span={24}>
                <Form.Item
                  label={
                    isReviewMode ? 'Review Comments' : 'Contribution Comments'
                  }
                  name="comments"
                >
                  <Input.TextArea
                    rows={3}
                    disabled={isReadOnlyMode}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>
      </Form>

      {/* Entity form + changes summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
          padding: '8px 12px',
          background: '#f0f6f6',
          borderRadius: 8,
          border: '1px solid #b2d8d8',
        }}
      >
        <Text strong style={{ fontSize: 13, color: '#37948d' }}>
          View:
        </Text>
        <ConfigProvider
          theme={{
            components: {
              Segmented: {
                itemSelectedBg: 'rgb(55, 148, 141)',
                itemSelectedColor: '#ffffff',
                trackBg: '#ffffff',
              },
            },
          }}
        >
          <Segmented
            value={splitterMode}
            onChange={(v) => setSplitterMode(v as typeof splitterMode)}
            options={[
              { label: 'Form Top', value: 'form' },
              { label: 'Split', value: 'split' },
              { label: 'Changes Top', value: 'changes' },
            ]}
            style={{ fontWeight: 500 }}
          />
        </ConfigProvider>
        <Text
          type="secondary"
          style={{ fontSize: 12, marginLeft: 4, fontStyle: 'italic' }}
        >
          {splitterMode === 'split'
            ? 'Tip: Drag the bar between panels to adjust their size'
            : 'Tip: Drag the bar to adjust panel heights'}
        </Text>
      </div>

      {(() => {
        const panelStyle: CSSProperties = {
          flex: 1,
          overflow: 'hidden',
          ...(mode === ReviewMode.Edit ? ContributionSectionStyle : null),
        };

        const entityFormCard = (
          <Card
            style={{
              height: '100%',
              overflow: 'auto',
              flexDirection: 'column',
              display: 'flex',
            }}
            styles={{ body: { padding: 8 } }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: '#fff',
                padding: 10,
                borderBottom: '1px solid #f0f0f0',
                zIndex: 99,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text strong>{translatedcontribute.titleCollaps}</Text>
                <Button onClick={toggleExpandAll}>
                  {globalExpand
                    ? translatedcontribute.collapse
                    : translatedcontribute.expand}
                </Button>
              </div>
            </div>
            <div style={{ overflow: 'hidden', padding: 4, flex: 1 }}>
              {isEditor && isReadOnlyMode && missingBeforeAccept.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={
                    <>
                      This new voyage needs {missingList} before it can be
                      accepted. Click <strong>Start Review</strong> to fill{' '}
                      {missingBeforeAccept.length === 1 ? 'it' : 'them'} in.
                    </>
                  }
                />
              )}
              <Form>
                <EntityForm
                  key={props.entity.entityRef.id}
                  schema={schema}
                  entity={stackedEntity}
                  changes={displayedChanges}
                  onChange={onChangesUpdate}
                  expandedMenu={expandedMenu}
                  setExpandedMenu={setExpandedMenu}
                  accessLevel={accessLevel}
                  onSectionsChange={setSections}
                  readOnly={isReadOnlyMode}
                  errorPropertyUids={missingAcceptUids}
                  errorHint={requiredFieldHint}
                  // A voyage loaded from the server is 'original'; only the
                  // stand-in for one that failed to load is 'lazy'.
                  commentsLocked={
                    props.entity.entityRef.type === 'existing' &&
                    props.entity.state === 'lazy'
                  }
                />
              </Form>
            </div>
          </Card>
        );

        const changesSummaryCard = (
          <Card
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            styles={{
              body: {
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              },
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: '1px solid #eee',
                background: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Text strong>
                {isReviewMode ? 'Review Changes' : 'Changes Summary'}
              </Text>
              <Text type="secondary">
                {displayedChanges.length} change
                {displayedChanges.length !== 1 && 's'}
              </Text>
            </div>
            {isSaveChange && !isReviewMode && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#52c41a',
                }}
              >
                ✓ Changes saved. Keep editing, or submit whenever you are ready.
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ChangesSummary
                accessLevel={accessLevel}
                changes={displayedChanges}
                resetAllChanges={resetAllChanges}
                submitChanges={handleSubmitChanges}
                handleSaveChanges={handleSaveChanges}
                handlePreview={handlePreviewChanges}
                entity={stackedEntity}
                handleDeleteChange={handleDeletePropertyChange}
                isReviewMode={isReviewMode}
                onCommitReview={handleCommitReviewChecked}
                readOnly={isReadOnlyMode}
                currentStatus={currentStatus}
                isSaveChange={isSaveChange}
                isSaving={isSaving}
                isSubmitting={isSubmitting}
                hasSubmitted={hasSubmitted}
                mode={mode}
                contribution={contribution}
                currentReviewChanges={reviewChanges}
                originalChanges={originalChanges}
              />
            </div>
          </Card>
        );

        if (splitterMode === 'form') {
          return (
            <Splitter layout="vertical" style={panelStyle}>
              <Splitter.Panel defaultSize="65%" min="40%">
                {entityFormCard}
              </Splitter.Panel>
              <Splitter.Panel min="20%">{changesSummaryCard}</Splitter.Panel>
            </Splitter>
          );
        }
        if (splitterMode === 'changes') {
          return (
            <Splitter layout="vertical" style={panelStyle}>
              <Splitter.Panel defaultSize="65%" min="40%">
                {changesSummaryCard}
              </Splitter.Panel>
              <Splitter.Panel min="20%">{entityFormCard}</Splitter.Panel>
            </Splitter>
          );
        }
        return (
          <Splitter style={panelStyle}>
            <Splitter.Panel defaultSize="50%" min="30%" max="70%">
              {entityFormCard}
            </Splitter.Panel>
            <Splitter.Panel>{changesSummaryCard}</Splitter.Panel>
          </Splitter>
        );
      })()}

      {/* Editorial decision panel */}
      {(currentStatus === ContributionStatus.Submitted ||
        currentStatus === ContributionStatus.Accepted ||
        currentStatus === ContributionStatus.Rejected) && (
        <ContributionEditDecision
          missingBeforeAccept={missingBeforeAccept}
          handleEditorialDecisionSubmit={handleEditorialDecisionSubmit}
          setSelectedDecision={setSelectedDecision}
          selectedDecision={selectedDecision}
          mode={mode}
          setDecisionComments={setDecisionComments}
          decisionComments={decisionComments}
          contributionId={props.contributionId}
          currentStatus={currentStatus}
          reviews={reviews}
          uncommittedReviewChanges={reviewChanges.length}
          onReopen={props.onReopen ? handleReopenForEditing : undefined}
          canReopen={isEditor}
        />
      )}

      {/* A refused submission. Shown over the form rather than beside it: the
          contributor has to read the list before the form means anything, and
          the form is what they return to, so it stays behind the dialog. */}
      <Modal
        open={submitBlocked !== null}
        onCancel={dismissSubmitBlocked}
        footer={null}
        title={null}
        width={720}
        destroyOnHidden
      >
        {submitBlocked && (
          <PublicationBlockedReport
            targetLabel="This contribution"
            conflicts={submitBlocked.conflicts}
            validation={submitBlocked.validation}
            reason={submitBlocked.reason}
            headline="Nothing was submitted"
            assurance="Your contribution is still a draft, and still yours to edit."
            onDismiss={dismissSubmitBlocked}
          />
        )}
      </Modal>

      <PreviewChangeDialog
        previewEntity={previewEntity}
        open={previewEntity !== undefined}
        onClose={() => setPreviewEntity(undefined)}
      />
    </>
  );
};
