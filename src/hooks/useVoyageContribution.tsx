import { useState, useCallback } from 'react';

import {
  Contribution,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';

import { TransformedContribution } from '@/components/PresentationComponents/Contribute/utils/transformContributionData';

/**
 * Custom hook for managing voyage contribution state
 * Shared between NewVoyage and EditExistingVoyage components
 */
export const useVoyageContribution = () => {
  const [selectedContribution, setSelectedContribution] = useState<
    Contribution | TransformedContribution | undefined
  >(undefined);
  const [contributions, setContributions] = useState<TransformedContribution[]>(
    [],
  );

  const [formEntity, setFormEntity] = useState<MaterializedEntity | undefined>(
    undefined,
  );

  /**
   * Update the selected contribution
   */
  const updateContribution = useCallback(
    (contribution: Contribution | TransformedContribution | undefined) => {
      setSelectedContribution(contribution);
    },
    [],
  );

  /**
   * Update the form entity
   */
  const updateFormEntity = useCallback(
    (entity: MaterializedEntity | undefined) => {
      setFormEntity(entity);
    },
    [],
  );

  /**
   * Reset both contribution and entity to undefined
   */
  const resetContribution = useCallback(() => {
    setSelectedContribution(undefined);
    setFormEntity(undefined);
  }, []);

  /**
   * Set both contribution and entity at once
   */
  const setContributionWithEntity = useCallback(
    (
      contribution: Contribution | TransformedContribution | undefined,
      entity: MaterializedEntity | undefined,
    ) => {
      setSelectedContribution(contribution);
      setFormEntity(entity);
    },
    [],
  );
  return {
    selectedContribution,
    formEntity,
    updateContribution,
    updateFormEntity,
    resetContribution,
    setFormEntity,
    setContributionWithEntity,
    setSelectedContribution,
    setContributions,
    contributions,
  };
};
