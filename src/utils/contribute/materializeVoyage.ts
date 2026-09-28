import {
  EntitySchema,
  MaterializedEntity,
  materializeNew,
} from '@slavevoyages/voyages-contribute';

/**
 * A root entity for a contribution, without a placeholder id sitting in the
 * field an editor has to assign.
 *
 * `materializeNew` seeds whatever id it is given into the primary key's own
 * slot. A new voyage's id is a uuid — the contribution's handle, not a voyage
 * id — so the form opened with `Voyage ID: 8bbe7f55-…` in a numeric field that
 * validates 1..99999999999.
 *
 * That is not cosmetic. Publication builds a new row out of the changes alone
 * (`_process_new_entity` sets `obj.id = obj.voyage_id` from them, and the uuid
 * is only a temporary handle for remapping foreign keys), so the uuid either
 * reached the database as a voyage id or nothing did. Voyage ids come from
 * blocks an editor controls, so the field starts empty and the editor fills it
 * in before accepting — which the schema now requires of them.
 *
 * Only a non-numeric id is cleared: editing an existing voyage materializes it
 * under its real id, and that one belongs in the field.
 */
export const materializeContributionRoot = (
  schema: EntitySchema,
  id: string | number,
): MaterializedEntity => {
  const entity = materializeNew(schema, id);
  if (/^\d+$/.test(String(id))) {
    return entity;
  }
  const pk = schema.properties.find(
    (p) => (p as { backingField?: string }).backingField === schema.pkField,
  );
  if (pk) {
    entity.data[pk.label] = null;
  }
  return entity;
};

/**
 * Stands in for an existing voyage that could not be loaded.
 *
 * Built from `materializeNew` for its shape, but kept an *existing* entity: it
 * describes a row that is already there. Falling back to a new-entity blank
 * made the form treat an edit of an existing voyage as a new voyage -- demanding
 * a voyage id and dataset the voyage already has, and blocking acceptance
 * (DD-0559). The seeded defaults are cleared too, so a 0 or "" never reads as a
 * stored value nobody could see.
 */
export const unloadedExistingRoot = (
  schema: EntitySchema,
  id: string | number,
): MaterializedEntity => {
  const entity = materializeNew(schema, id);
  for (const [key, v] of Object.entries(entity.data)) {
    if (typeof v !== 'object') {
      entity.data[key] = null;
    }
  }
  return {
    ...entity,
    entityRef: { ...entity.entityRef, type: 'existing' },
    state: 'lazy',
  };
};

/** What an editor is told when the voyage behind a contribution won't load. */
export const voyageLoadWarning = (id: string | number) =>
  `Voyage #${id} could not be loaded from the database, so its current values are not shown. The form lists this contribution's changes only, and fields without a change take no comments.`;
