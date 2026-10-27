import { Contribution } from '@slavevoyages/voyages-contribute';

/** The uid a voyage id is recorded under. */
const VOYAGE_ID_PROPERTY = 'Voyage_voyage_id';

/**
 * The voyage id a contribution will publish under.
 *
 * `root.id` is a new voyage's uuid handle, never its voyage id — publication
 * builds the row from the changes, so the id an editor assigned lives in one.
 * Reviews are read too, latest stackOrder winning, since the assignment lands
 * in a review. Falls back to `root.id` until one is assigned, so the row is
 * still identifiable.
 */
export const assignedVoyageId = (
  contribution: Contribution | undefined,
): string | number => {
  const fallback = contribution?.root?.id ?? '';
  if (!contribution) {
    return fallback;
  }
  const reviewChanges = [...(contribution.reviews ?? [])]
    .sort((a, b) => a.stackOrder - b.stackOrder)
    .flatMap((r) => r.changeSet?.changes ?? []);
  let assigned: string | number | undefined;
  for (const entityChange of [
    ...(contribution.changeSet?.changes ?? []),
    ...reviewChanges,
  ]) {
    if (entityChange.type !== 'update') continue;
    if (entityChange.entityRef.id !== contribution.root?.id) continue;
    for (const change of entityChange.changes) {
      if (
        change.kind === 'direct' &&
        change.property === VOYAGE_ID_PROPERTY &&
        change.changed !== null &&
        change.changed !== undefined &&
        change.changed !== ''
      ) {
        assigned = change.changed as string | number;
      }
    }
  }
  return assigned ?? fallback;
};
