import { useCallback, useEffect, useRef, useState } from 'react';

import {
  VoyageSchema,
  MaterializedEntity,
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import { TransformedContribution } from '@/components/PresentationComponents/Contribute/utils/transformContributionData';
import {
  fetchContributionByIdForEditor,
  fetchContributionsDataByAuthor,
} from '@/fetch/contributeFetch/fetchContributionsData';
import { useContributionNav } from '@/hooks/contribute/useContributionNav';
import { usePageRouter } from '@/hooks/usePageRouter';
import { useVoyageContribution } from '@/hooks/useVoyageContribution';
import { RootState } from '@/redux/store';
import { ContributionNavList } from '@/utils/contribute/contributionNav';
import {
  loadContribution,
  prefetchContribution,
} from '@/utils/contribute/contributionPrefetch';
import { loadContributionRoot } from '@/utils/contribute/loadContributionRoot';
import { materializeContributionRoot } from '@/utils/contribute/materializeVoyage';

export interface NewVoyageProps {
  showForm?: boolean;
  formEntity?: MaterializedEntity;
  selectedContribution?: Contribution | TransformedContribution;
  formMode?: ReviewMode;
  contributionId?: string;
  onBack?: () => void;
  onChange?: (
    contribution: Contribution | TransformedContribution | undefined,
  ) => void;
}

/** State and actions of the new / edit voyage page (NewVoyage). */
export const useNewVoyage = ({
  showForm: externalShowForm,
  formEntity: externalFormEntity,
  selectedContribution: externalSelectedContribution,
  formMode: externalFormMode,
  contributionId: externalContributionId,
  onBack: externalOnBack,
  onChange: externalOnChange,
}: NewVoyageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { contributePath } = usePageRouter();

  const [internalShowForm, setInternalShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [internalFormMode, setInternalFormMode] = useState<ReviewMode>(
    ReviewMode.Create,
  );
  const [internalContributionId, setInternalContributionId] = useState<
    string | undefined
  >('');

  // Use shared hook for contribution state management
  const {
    selectedContribution: internalSelectedContribution,
    formEntity: internalFormEntity,
    setSelectedContribution,
    updateFormEntity,
    contributions,
  } = useVoyageContribution();

  // Determine which values to use (external props take precedence)
  const showForm = externalShowForm ?? internalShowForm;
  const formEntity = externalFormEntity ?? internalFormEntity;
  const selectedContribution =
    externalSelectedContribution ?? internalSelectedContribution;
  const formMode = externalFormMode ?? internalFormMode ?? ReviewMode.Create;
  const contributionId = externalContributionId ?? internalContributionId;

  // Load contribution by ID when id param exists
  useEffect(() => {
    const loadContribution = async () => {
      // Check if data was passed through navigation state (from ContributeHomeWelcome)
      const navState = location.state as {
        formEntity?: MaterializedEntity;
        selectedContribution?: Contribution;
        formMode?: ReviewMode;
      };

      if (id && navState?.formEntity && navState?.selectedContribution) {
        // Use the data passed through navigation
        updateFormEntity(navState.formEntity);
        setSelectedContribution(navState.selectedContribution);
        setInternalFormMode(navState.formMode || ReviewMode.Edit);
        setInternalContributionId(id);
        setInternalShowForm(true);
        // Clear the navigation state to prevent stale data
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      // If data is already loaded in the shared hook (from ContributeHomeWelcome), use it
      if (id && internalSelectedContribution && internalFormEntity) {
        // Data is already loaded, just set the form mode
        setInternalFormMode(ReviewMode.Edit);
        setInternalContributionId(id);
        setInternalShowForm(true);
        return;
      }

      // Load from contributions array if available, otherwise fetch directly by ID (page reload case)
      if (id && user?.email) {
        let contribution: Contribution | undefined = contributions.find(
          (c) => c.id === id,
        );

        // On page reload the contributions array is empty — fetch directly from API
        if (!contribution) {
          setIsLoading(true);
          try {
            contribution = await fetchContributionByIdForEditor(id);
          } catch (err) {
            console.error('Error fetching contribution by ID:', err);
            setIsLoading(false);
            return;
          }
        }

        if (contribution) {
          setInternalFormMode(ReviewMode.Edit);
          setInternalContributionId(id);

          const isExistingVoyage = contribution.root.type === 'existing';
          const { entity: entityToUse, warning } = await loadContributionRoot(
            contribution.root.schema,
            contribution.root.id,
            isExistingVoyage,
          );
          if (warning) message.warning(warning, 8);

          updateFormEntity(entityToUse);
          setSelectedContribution({
            ...contribution,
            root: {
              ...contribution.root,
              type: (isExistingVoyage ? 'existing' : 'new') as
                | 'existing'
                | 'new',
            },
          });
          setInternalShowForm(true);
          setIsLoading(false);
        }
      }
    };

    loadContribution();
  }, [
    id,
    user?.email,
    contributions,
    internalSelectedContribution,
    internalFormEntity,
    setSelectedContribution,
    updateFormEntity,
    location.state,
    location.pathname,
    navigate,
  ]);

  // The contribution as opened, to tell whether it has been edited since.
  const openedRef = useRef<typeof selectedContribution>(undefined);
  useEffect(() => {
    if (showForm && selectedContribution?.id !== openedRef.current?.id) {
      openedRef.current = selectedContribution;
    }
  }, [showForm, selectedContribution]);

  const fetchNavPage = useCallback(
    async (list: ContributionNavList, page: number) => {
      const query = new URLSearchParams(list.query.query ?? '');
      query.set('page', String(page));
      query.set('limit', String(list.pageSize));
      const response = await fetchContributionsDataByAuthor(query.toString());
      return ((response?.data ?? []) as Contribution[]).map((c) => c.id);
    },
    [],
  );

  const openFromNav = useCallback(
    async (nextId: string) => {
      setIsLoading(true);
      try {
        const { contribution: data, root } = await loadContribution(nextId);
        const isExisting = data.root.type === 'existing';
        const entity = root.entity;
        const contribution: Contribution = {
          ...data,
          root: { ...data.root, type: isExisting ? 'existing' : 'new' },
        };
        if (root.warning) message.warning(root.warning, 8);
        navigate(`/contribute/interim/new/${nextId}`, {
          state: {
            formEntity: entity,
            selectedContribution: contribution,
            formMode: ReviewMode.Edit,
          },
        });
      } catch {
        message.error('Could not open that contribution.');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const contributionNav = useContributionNav({
    source: 'welcome',
    currentId: id,
    fetchPage: fetchNavPage,
    onOpen: openFromNav,
    isDirty:
      showForm &&
      openedRef.current !== undefined &&
      selectedContribution !== openedRef.current,
    busy: isLoading,
    prefetch: prefetchContribution,
  });

  // Handle new voyage button click
  const handleNewVoyageClick = useCallback(() => {
    const newEntity = materializeContributionRoot(VoyageSchema, uuidv4());

    const newContribution: Contribution = {
      id: String(newEntity.entityRef.id),
      root: newEntity.entityRef,
      changeSet: {
        id: uuidv4(),
        author: user?.email || '',
        title: '',
        comments: '',
        timestamp: new Date().getTime(),
        changes: [],
      },
      status: ContributionStatus.WorkInProgress,
      reviews: [],
      media: [],
    };
    setInternalContributionId(String(newEntity.entityRef.id));
    updateFormEntity(newEntity);
    setSelectedContribution(newContribution);
    setInternalFormMode(ReviewMode.Create);
    setInternalShowForm(true);
  }, [user?.email, setSelectedContribution, updateFormEntity]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (externalOnBack) {
      externalOnBack();
    } else {
      setInternalShowForm(false);
      setSelectedContribution(undefined);
      updateFormEntity(undefined);
      navigate('/contribute', { replace: true });
    }
  }, [externalOnBack, navigate, setSelectedContribution, updateFormEntity]);

  // Handle contribution form change
  const handleContributionChange = useCallback(
    (contribution: Contribution | TransformedContribution | undefined) => {
      if (externalOnChange) {
        externalOnChange(contribution);
      } else {
        setSelectedContribution(contribution);
      }
    },
    [externalOnChange, setSelectedContribution],
  );

  // Handle location state reload
  useEffect(() => {
    const state = location.state as { reload?: boolean; timestamp?: number };
    if (state?.reload) {
      // Reset form state
      setInternalShowForm(false);
      setSelectedContribution(undefined);
      updateFormEntity(undefined);
      setInternalContributionId('');

      // Clear the state to prevent repeated reloads
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, updateFormEntity, setSelectedContribution]);

  // If no form is shown and user navigates directly to /contribute/interim/new/
  // Create a new voyage form automatically
  useEffect(() => {
    if (contributePath === 'interim' && !showForm && !id && user?.email) {
      handleNewVoyageClick();
    }
  }, [contributePath, showForm, id, user?.email, handleNewVoyageClick]);

  // An edit of an existing voyage is not titled as a new one.
  const title =
    selectedContribution?.root?.type === 'existing'
      ? `Edit voyage #${selectedContribution.root.id}`
      : 'New Voyage';

  const currentStatus =
    formMode === ReviewMode.Edit
      ? selectedContribution?.status
      : ContributionStatus.WorkInProgress;

  return {
    showForm,
    isLoading,
    title,
    formEntity,
    selectedContribution,
    formMode,
    contributionId,
    currentStatus,
    contributionNav,
    handleBackClick,
    handleContributionChange,
  };
};
