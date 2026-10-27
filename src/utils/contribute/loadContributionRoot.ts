import {
  Contribution,
  getSchema,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';

import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';

import {
  materializeContributionRoot,
  unloadedExistingRoot,
  voyageLoadWarning,
} from './materializeVoyage';

/**
 * The entity a contribution's form opens on: the stored voyage for an edit of
 * an existing one, a blank for a new one.
 *
 * An existing voyage that will not load stays an existing entity and comes
 * back with a `warning` to show. It used to fall back to a new-voyage blank,
 * which made the form demand a voyage id and dataset the voyage already has
 * and blocked acceptance (DD-0559).
 */
export const loadContributionRoot = async (
  schemaName: string,
  id: string | number,
  isExisting: boolean,
): Promise<{ entity: MaterializedEntity; warning?: string }> => {
  const schema = getSchema(schemaName);
  if (!isExisting) {
    return { entity: materializeContributionRoot(schema, id) };
  }
  try {
    const res = await fetchSubmitEditVoaygesForm(String(id));
    if (res.status === 200 && res.data) {
      return { entity: res.data };
    }
  } catch {
    // Reported below, the same as an empty answer.
  }
  return {
    entity: unloadedExistingRoot(schema, id),
    warning: voyageLoadWarning(id),
  };
};

/** A contributor's contribution with the entity its form opens on. */
export const contributionForEdit = async <T extends Contribution>(
  data: T,
): Promise<{
  formEntity: MaterializedEntity;
  selectedContribution: T;
  warning?: string;
}> => {
  const isExisting = data.root.type === 'existing';
  const { entity, warning } = await loadContributionRoot(
    data.root.schema,
    data.root.id,
    isExisting,
  );
  return {
    formEntity: entity,
    selectedContribution: {
      ...data,
      root: { ...data.root, type: isExisting ? 'existing' : 'new' },
    },
    warning,
  };
};
