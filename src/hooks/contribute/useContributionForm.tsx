import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addToChangeSet,
  applyChanges,
  cloneEntity,
  combineChanges,
  Contribution,
  ContributionStatus,
  dropOrphans,
  EntityChange,
  expandMaterialized,
  getSchema,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
} from '@slavevoyages/voyages-contribute';
import { CollapseProps, Form, Modal, message } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ReviewMode,
  ContributionFormProps,
} from '@/components/PresentationComponents/Contribute/ContributionForm';
import { createSaveChangeContribution } from '@/fetch/contributeFetch/createSaveChangeContribution';
import {
  createSubmitChangeContribution,
  SubmissionRejectedError,
} from '@/fetch/contributeFetch/createSubmitChangeContribution';
import {
  PublicationConflict,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { hasEditorRole } from '@/utils/auth/hasEditorRole';
import {
  addedRows,
  combineEntityChanges,
  dropLayerOrphans,
  withoutListRemovals,
} from '@/utils/contribute/contributionChanges';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

/** Where a contributor lands once a submission has been accepted. */
const SUBMITTED_LIST_PATH = '/contribute/editor_main/requests';

export const useContributionForm = ({
  entity,
  contribution,
  onChange,
  onSubmitted,
  changeSet: directChangeSet,
  accessLevel: initAccessLevel,
  contributionId,
  currentStatus,
  mode,
  onStartReview,
  onCommitReview,
  onAbandonReview,
  onEditorialDecision,
  onReopen,
}: ContributionFormProps) => {
  const navigate = useNavigate();
  const { id: ID } = useParams<{ id: string }>();
  const { contributePath } = usePageRouter();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const isEditor = hasEditorRole(user);
  const translatedcontribute = translationLanguagesContribute(languageValue);

  const [contributeForm] = Form.useForm();

  const reviews = useMemo(
    () => contribution?.reviews ?? [],
    [contribution?.reviews],
  );

  const changeSet = useMemo(
    () =>
      contribution?.changeSet ??
      directChangeSet ?? {
        id: -1,
        changes: [],
        author: '',
        title: '',
        comments: '',
        timestamp: Date.now(),
      },
    [contribution?.changeSet, directChangeSet],
  );

  const schema = getSchema(entity.entityRef.schema);
  const isNewVoyages = contributePath === 'interim';

  // ── State ──────────────────────────────────────────────────────────────────
  const [accessLevel, setAccessLevel] = useState<PropertyAccessLevel>(
    initAccessLevel ?? PropertyAccessLevel.BeginnerContributor,
  );
  const [globalExpand, setGlobalExpand] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string[]>([]);
  const [sections, setSections] = useState<CollapseProps['items']>([]);
  const [isSaveChange, setIsSaveChange] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Latches once the server has accepted a submission, and never goes back.
  //
  // `isSubmitting` cannot carry this: it is cleared in the `finally` below, so
  // the button became clickable again the moment the request returned. Leaving
  // this screen is what normally puts it out of reach, but that is a redirect
  // -- something that can be slow, or interrupted, or simply not happen -- and
  // a second click in that window submits a contribution the store has already
  // moved to Submitted, which comes back as an error the contributor cannot
  // act on. The button has to refuse on its own rather than trusting the
  // navigation to remove it.
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [previewEntity, setPreviewEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);
  const [decisionComments, setDecisionComments] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<
    'accept' | 'reject' | null
  >(null);
  const [isReviewMode, setIsReviewMode] = useState(mode === ReviewMode.Review);
  const [reviewChanges, setReviewChanges] = useState<EntityChange[]>([]);
  const [localChanges, setLocalChanges] = useState<EntityChange[]>(
    () => changeSet.changes,
  );
  const [preReviewState, setPreReviewState] = useState<Contribution | null>(
    null,
  );
  const [changeSetId, setChangeSetId] = useState<string>('');
  // The id the server last gave this contribution.
  //
  // The edit-a-voyage screen passes no `contributionId` and its route carries
  // no `:id`, so there is nothing here that names the contribution until the
  // server has been asked to store it once. Saving with no id makes a new one,
  // so without remembering the answer a second save would file a second
  // contribution against the same voyage rather than updating the first.
  const [savedContributionId, setSavedContributionId] = useState<string>('');
  // A refused submission, held so the contributor can read the list of fields
  // and then go straight back to filling them in. Cleared by dismissing it,
  // not by the next keystroke — the list is what they are working from.
  const [submitBlocked, setSubmitBlocked] = useState<{
    conflicts: PublicationConflict[];
    validation: PublicationValidation[];
    reason: string;
  } | null>(null);
  const [originalChanges, setOriginalChanges] = useState<EntityChange[]>(
    () => contribution?.changeSet?.changes || [],
  );

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReviewMode && contribution?.changeSet?.changes) {
      setOriginalChanges(contribution.changeSet.changes);
    }
  }, [contribution?.changeSet?.changes, isReviewMode]);

  // Sync localChanges when a new contribution is loaded (changeSet.id changes)
  useEffect(() => {
    if (!isReviewMode) setLocalChanges(changeSet.changes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeSet.id]);

  useEffect(() => {
    setIsReviewMode(mode === ReviewMode.Review);
  }, [mode]);

  // Keep the latest sections available without making every accessLevel
  // effect re-fire whenever a panel is opened/closed elsewhere.
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  // Selecting a contributor mode changes which fields are visible; expand
  // the first section so the change is actually noticeable instead of
  // silently happening behind a collapsed panel.
  useEffect(() => {
    const firstKey = sectionsRef.current?.[0]?.key as string | undefined;
    if (!firstKey) return;
    setExpandedMenu((prev) =>
      prev.includes(firstKey) ? prev : [...prev, firstKey],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLevel]);

  useEffect(() => {
    contributeForm.setFieldsValue({
      comments: changeSet?.comments,
      accessLevel: PropertyAccessLevel.BeginnerContributor,
    });
  }, [changeSet?.comments, contributeForm]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isReadOnlyMode = mode === ReviewMode.ReadOnly && !isReviewMode;

  /**
   * The contribution as it currently stands: its own changes with every review
   * folded on top.
   *
   * Read-only viewing used to skip the fold and show the bare entity, so
   * anything an editor decided in a review was invisible the moment the review
   * was committed -- the form said the value had never been set, while the
   * review tab beside it said otherwise. `Voyage.dataset` made that plain,
   * since its field carries a warning while nothing is chosen.
   */
  const stackedEntity = useMemo(() => {
    if (!contributionId) return entity;
    try {
      const stackedEntityClone = cloneEntity(entity);
      const expandedEntity = expandMaterialized(stackedEntityClone);

      // The layer being edited -- the open review, or the contributor's own
      // change set -- is applied without its list removals, so a removed row
      // stays visible and can be restored.
      let allChanges: EntityChange[] = isReviewMode
        ? [...originalChanges]
        : withoutListRemovals(changeSet?.changes || []);

      reviews.forEach((review) => {
        if (review.changeSet.changes?.length > 0) {
          allChanges = [...allChanges, ...review.changeSet.changes];
        }
      });

      if (isReviewMode && reviewChanges.length > 0) {
        allChanges = [...allChanges, ...withoutListRemovals(reviewChanges)];
      }

      const filteredChanges = combineEntityChanges(allChanges)
        .map((change) => {
          if (change.type !== 'update') return change;
          const updatedChanges = change.changes.filter(
            (propChange) =>
              !('ownedEntity' in propChange) ||
              (propChange as any).ownedEntity?.state !== 'original',
          );
          return updatedChanges.length === 0
            ? null
            : { ...change, changes: updatedChanges };
        })
        .filter(Boolean) as EntityChange[];

      if (filteredChanges.length > 0) {
        try {
          applyChanges(expandedEntity, filteredChanges);
        } catch {
          return entity;
        }
      }
      return stackedEntityClone;
    } catch {
      return entity;
    }
  }, [
    originalChanges,
    changeSet?.changes,
    contributionId,
    entity,
    reviews,
    isReviewMode,
    reviewChanges,
    isReadOnlyMode,
  ]);

  const accessLevelOptions = Object.entries(PropertyAccessLevel)
    .filter(
      ([key]) =>
        isNaN(Number(key)) &&
        key !== 'Hidden' &&
        key !== 'IntermediateContributor' &&
        key !== 'Editor',
    )
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(),
      value,
    }));

  const displayedChanges = isReviewMode ? reviewChanges : localChanges;
  const isShowStartReview = mode === ReviewMode.ReadOnly && !isReviewMode;
  const isShowStartReviewDisable =
    currentStatus !== ContributionStatus.Submitted &&
    currentStatus !== ContributionStatus.WorkInProgress;
  const contributionSection = mode === ReviewMode.Create ? 'create' : 'default';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStartReview = useCallback(() => {
    setPreReviewState(contribution!);
    setIsReviewMode(true);
    setReviewChanges([]);
    onStartReview?.();
  }, [contribution, onStartReview]);

  /**
   * Store the open review. Returns once it is stored, so a caller that needs
   * the review to count -- a decision, which reads what is saved -- can wait
   * for it rather than racing it.
   */
  const commitOpenReview = useCallback(async () => {
    if (reviewChanges.length === 0) return;
    const comments = contributeForm.getFieldValue('comments') || '';
    const existingReviews = contribution?.reviews || [];
    const review: Review = {
      changeSet: {
        id: '-1',
        author: user?.email || 'current-user',
        title: '',
        comments,
        timestamp: new Date().getTime(),
        changes: reviewChanges,
      },
      stackOrder: existingReviews.length + 1,
    };

    if (onCommitReview) {
      await onCommitReview(review);
    } else if (contribution) {
      onChange?.({ ...contribution, reviews: [...existingReviews, review] });
    }

    setIsReviewMode(false);
    setReviewChanges([]);
    setPreReviewState(null);
  }, [
    reviewChanges,
    contributeForm,
    onCommitReview,
    contribution,
    onChange,
    user?.email,
  ]);

  const handleCommitReview = useCallback(() => {
    if (reviewChanges.length === 0) {
      message.warning('No changes to commit');
      return;
    }
    void commitOpenReview().then(() =>
      message.success('Review committed successfully'),
    );
  }, [reviewChanges, commitOpenReview]);

  const handleCancelReview = useCallback(() => {
    Modal.confirm({
      title: 'Cancel Review',
      content:
        'Are you sure you want to cancel? All review changes will be lost.',
      onOk: () => {
        if (preReviewState) onChange?.(preReviewState);
        setIsReviewMode(false);
        setReviewChanges([]);
        setPreReviewState(null);
        onAbandonReview?.();
      },
    });
  }, [preReviewState, onChange, onAbandonReview]);

  const handleEditorialDecisionSubmit = useCallback(() => {
    if (!selectedDecision || !onEditorialDecision) return;
    // Anything still open in the review is stored first. A decision reads what
    // is saved, so an editor who fills in a value and then decides -- which is
    // the whole shape of the job for a new voyage, where the dataset is theirs
    // to supply -- would otherwise be refused for the field in front of them.
    const openWork = reviewChanges.length > 0;
    Modal.confirm({
      title: `${selectedDecision === 'accept' ? 'Accept' : 'Reject'} this contribution?`,
      content: openWork
        ? `Your open review will be committed first, then the contribution ${selectedDecision === 'accept' ? 'accepted' : 'rejected'}. This action cannot be undone.`
        : `Are you sure you want to ${selectedDecision} this contribution? This action cannot be undone.`,
      okText: selectedDecision === 'accept' ? 'Accept' : 'Reject',
      okButtonProps: {
        danger: selectedDecision === 'reject',
        style:
          selectedDecision === 'accept'
            ? { background: '#52c41a', borderColor: '#52c41a' }
            : undefined,
      },
      onOk: async () => {
        if (openWork) await commitOpenReview();
        onEditorialDecision(selectedDecision, decisionComments);
        setSelectedDecision(null);
        setDecisionComments('');
      },
    });
  }, [
    selectedDecision,
    decisionComments,
    onEditorialDecision,
    reviewChanges,
    commitOpenReview,
  ]);

  /**
   * Send an accepted contribution back to Submitted so it can be worked on.
   *
   * An accepted contribution is read-only, which is right until it turns out to
   * be missing something publication requires — at that point nobody can fix it
   * and the whole batch it sits in is stuck. This is the way back.
   *
   * The confirm says what it costs. `changeContributionStatus` writes the
   * decider with every status change, so reopening records whoever reopened it
   * and the original acceptance — who made it and any comment on it — is gone.
   */
  const handleReopenForEditing = useCallback(() => {
    Modal.confirm({
      title: 'Reopen this contribution for editing?',
      content:
        'It goes back to Submitted, where it can be reviewed and edited again. ' +
        'The record of who accepted it, and any comment they left, is replaced ' +
        'by this reopening.',
      okText: 'Reopen',
      cancelText: 'Cancel',
      onOk: () => onReopen?.(),
    });
  }, [onReopen]);

  const onChangesUpdate = useCallback(
    /**
     * `asReview` records the change against the review stack even when no
     * review has been opened. An editor's edit to a submitted contribution is
     * a review whether or not they pressed a button first, and it must not be
     * filed as the contributor's own work.
     */
    (newChange: EntityChange, asReview = false) => {
      setIsSaveChange(false);
      if (isReviewMode || asReview) {
        const next = dropLayerOrphans(
          addToChangeSet(reviewChanges, newChange),
          addedRows([
            ...originalChanges,
            ...reviews.flatMap((r) => r.changeSet.changes ?? []),
          ]),
        );
        const combined = combineEntityChanges(next);
        setReviewChanges(combined);
        onChange?.({
          ...contribution,
          changeSet: {
            ...(contribution?.changeSet || changeSet),
            changes: combined,
          },
        } as Contribution);
      } else {
        const next = addToChangeSet(localChanges, newChange);
        dropOrphans(next);
        const combined = combineEntityChanges(next);
        setLocalChanges(combined);
        onChange?.({
          ...contribution,
          changeSet: { ...changeSet, changes: combined },
        } as Contribution);
      }
    },
    [
      contribution,
      isReviewMode,
      reviewChanges,
      originalChanges,
      reviews,
      changeSet,
      localChanges,
      onChange,
    ],
  );

  const handlePreviewChanges = useCallback(() => {
    const changesToApply = isReviewMode ? reviewChanges : changeSet?.changes;
    combineChanges(changesToApply);
    const updated = cloneEntity(isReviewMode ? stackedEntity : entity);
    applyChanges(expandMaterialized(updated), changesToApply);
    setPreviewEntity(updated);
  }, [changeSet, isReviewMode, reviewChanges, stackedEntity, entity]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setIsSaveChange(false);
    try {
      const formValues = await contributeForm.validateFields();
      const changesToSubmit = isReviewMode ? reviewChanges : changeSet?.changes;
      const payload: Contribution = {
        id: contributionId ?? ID!,
        root: entity.entityRef,
        changeSet: {
          title: '',
          comments: formValues.comments || changeSet.comments || '',
          timestamp: new Date().getTime(),
          changes: changesToSubmit,
          author: changeSet.author!,
          id: changeSetId,
        },
        status: ContributionStatus.WorkInProgress,
        reviews: contribution?.reviews || [],
        media: contribution?.media || [],
      };

      const response = await createSaveChangeContribution(payload);
      message.success('Changes saved successfully!');
      setIsSaveChange(true);
      setChangeSetId(String(response?.changeSet?.id ?? ''));

      if (isReviewMode) {
        setReviewChanges([]);
        setIsReviewMode(false);
      } else {
        onChange?.({
          ...response,
          reviews:
            response.reviews?.length > 0
              ? response.reviews
              : contribution?.reviews || [],
        });
      }

      navigate('/contribute', {
        replace: true,
        state: { reload: true, timestamp: Date.now() },
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to save changes.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitChanges = async () => {
    // Refuse before the confirmation appears, so a second click cannot even
    // reach the dialog once this contribution has been submitted.
    if (hasSubmitted || isSubmitting) {
      return;
    }
    Modal.confirm({
      title: 'Submit Contribution',
      content:
        'Once you submit your contribution you will not be able to edit it further. Submit your contribution?',
      okText: 'Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsSubmitting(true);
        setSubmitBlocked(null);
        try {
          const formValues = contributeForm.getFieldsValue();
          const changesToSubmit = isReviewMode
            ? reviewChanges
            : changeSet.changes;
          let payload: Contribution = {
            id: savedContributionId || contributionId || ID!,
            root: entity.entityRef,
            changeSet: {
              title: '',
              comments: formValues.comments || changeSet.comments || '',
              timestamp: new Date().getTime(),
              changes: changesToSubmit,
              author: changeSet.author || user?.email || '',
              id: changeSetId,
            },
            status: ContributionStatus.Submitted,
            reviews: contribution?.reviews || [],
            media: contribution?.media || [],
          };

          // Store the work before asking for it to be submitted.
          //
          // `change_status` moves the status and reads nothing else off the
          // body, so submitting straight from the form submitted whatever the
          // server already held. For a draft that had never been saved that was
          // nothing at all, and the contributor was told their contribution was
          // not found; for one saved earlier it was the older content, and the
          // edits on screen went unmentioned. Neither is something the button
          // said it would do, and Edit mode offers it before any save has
          // happened. Saving here makes the thing submitted the thing being
          // looked at -- which is also what makes submit-time validation
          // meaningful, since it is the stored contribution that gets checked.
          if (!isReviewMode) {
            const saved = await createSaveChangeContribution({
              ...payload,
              status: ContributionStatus.WorkInProgress,
            });
            setChangeSetId(String(saved?.changeSet?.id ?? ''));
            // Hold on to what the store called it, so a second attempt from
            // this same screen edits this contribution rather than filing
            // another one beside it.
            setSavedContributionId(String(saved?.id ?? ''));
            payload = {
              ...payload,
              ...saved,
              status: ContributionStatus.Submitted,
            };
          }

          const response = await createSubmitChangeContribution(payload);
          // Before anything else that could throw: past this line the store has
          // it, and the button must not offer to send it again.
          setHasSubmitted(true);
          message.success('Contribution submitted successfully!');
          setIsSaveChange(false);

          // Settle this screen's own state before leaving it, and leave last.
          //
          // The navigation used to sit above these, which gave it two ways to
          // be lost. Reading `response.id` inline as the route state is
          // evaluated *before* the call, so a submit that answered without a
          // body threw a TypeError on the way into `navigate` -- landing in the
          // catch below, which reports "failed to submit" for a contribution
          // the server had in fact accepted. And `onChange` ran afterwards,
          // pushing this contribution back into the parent's state once the
          // route had already changed.
          if (isReviewMode) {
            setReviewChanges([]);
            setIsReviewMode(false);
          } else {
            onChange?.({
              ...response,
              reviews:
                response?.reviews?.length > 0
                  ? response.reviews
                  : contribution?.reviews || [],
            });
          }

          // Tell the host before navigating. Where this form is a panel over a
          // list on the same route -- the editorial platform opens it that way
          // -- the navigation below is a move to the route already showing, so
          // nothing re-renders and the form stays up over a contribution that
          // has already been sent. Only the host can take the panel down.
          onSubmitted?.();

          // A full page load, deliberately.
          //
          // Every contribute route renders the same `<ContributePage />`
          // element, so React reconciles it in place and the tree below never
          // remounts. `ContributeContent` picks the view from
          // `location.pathname` and would return the list -- but it is not
          // re-rendered at all, so the form the contributor just submitted from
          // stays on screen at the list's own address. Keying that subtree does
          // not help: the render that would read the new key never happens.
          //
          // Reloading is what actually puts the list up, and it gets the list a
          // fresh fetch, so the row just submitted is on it. The id rides in the
          // query string because a hard navigation cannot carry router state.
          const submittedId = String(response?.id ?? payload.id);
          window.location.replace(
            `${SUBMITTED_LIST_PATH}?submitted=${encodeURIComponent(submittedId)}`,
          );
        } catch (error) {
          // A refusal is not a failure: the contribution was never submitted,
          // so it is still an editable draft and the fields it names can still
          // be filled in. Reporting it as "failed to submit" would send the
          // contributor looking for a fault instead of at the list.
          if (error instanceof SubmissionRejectedError) {
            setSubmitBlocked({
              conflicts: error.conflicts,
              validation: error.validation,
              reason: error.message,
            });
            // The save above landed even though the submission did not, so the
            // edits are stored rather than riding on this page staying open.
            setIsSaveChange(true);
          } else {
            message.error(
              error instanceof Error
                ? error.message
                : 'Failed to submit contribution.',
            );
          }
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const resetAllChanges = useCallback(() => {
    Modal.confirm({
      title: isReviewMode ? 'Cancel review?' : 'Reset all changes?',
      content: isReviewMode
        ? 'This will cancel the current review and discard all changes. Are you sure?'
        : 'This will clear all unsaved edits. Are you sure?',
      okText: isReviewMode ? 'Cancel Review' : 'Reset Changes',
      okButtonProps: { danger: true },
      onOk: () => {
        if (isReviewMode) {
          handleCancelReview();
        } else {
          setLocalChanges([]);
          onChange?.({
            ...contribution,
            changeSet: { ...changeSet, id: String(changeSet.id), changes: [] },
          } as Contribution);
          contributeForm.resetFields();
        }
      },
    });
  }, [
    contribution,
    changeSet,
    isReviewMode,
    handleCancelReview,
    onChange,
    contributeForm,
  ]);

  const toggleExpandAll = useCallback(() => {
    const allKeys = sections?.map((s) => s.key as string) ?? [];
    setExpandedMenu(globalExpand ? [] : allKeys);
    setGlobalExpand((prev) => !prev);
  }, [sections, globalExpand]);

  const handleDeletePropertyChange = useCallback(
    (propertyToDelete: string) => {
      const changesToUpdate = isReviewMode ? reviewChanges : changeSet.changes;
      const updatedChanges = changesToUpdate
        .map((entityChange) => {
          if (
            !('changes' in entityChange) ||
            !Array.isArray(entityChange.changes)
          )
            return entityChange;
          const updatedEntityChanges = entityChange.changes
            .map((propChange) => {
              if (
                !('changes' in propChange) ||
                !Array.isArray(propChange.changes)
              )
                return propChange;
              const filtered = propChange.changes.filter(
                (f) => f?.property !== propertyToDelete,
              );
              return filtered.length === 0
                ? null
                : { ...propChange, changes: filtered };
            })
            .filter(Boolean);
          return updatedEntityChanges.length === 0
            ? null
            : { ...entityChange, changes: updatedEntityChanges };
        })
        .filter(Boolean) as EntityChange[];

      if (isReviewMode) {
        setReviewChanges(updatedChanges);
        onChange?.({
          ...contribution,
          changeSet: {
            ...(contribution?.changeSet || changeSet),
            changes: updatedChanges,
          },
        } as Contribution);
      } else {
        onChange?.({
          ...contribution,
          changeSet: { ...changeSet, changes: updatedChanges },
        } as Contribution);
      }
    },
    [contribution, isReviewMode, reviewChanges, changeSet, onChange],
  );

  return {
    // Form
    contributeForm,
    schema,
    translatedcontribute,

    // State
    accessLevel,
    setAccessLevel,
    globalExpand,
    expandedMenu,
    setExpandedMenu,
    sections,
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
    isEditor,
    submitBlocked,
    dismissSubmitBlocked: () => setSubmitBlocked(null),

    // Derived
    reviews,
    changeSet,
    isNewVoyages,
    isReadOnlyMode,
    stackedEntity,
    accessLevelOptions,
    displayedChanges,
    isShowStartReview,
    isShowStartReviewDisable,
    contributionSection,
    initAccessLevel,

    // Handlers
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
  };
};
