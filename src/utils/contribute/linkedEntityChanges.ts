import {
  EntityLinkEditMode,
  EntitySchema,
  isMaterializedEntity,
  MaterializedEntity,
  PropertyChange,
} from '@slavevoyages/voyages-contribute';

/**
 * The field changes of an entity created from a dropdown's "Add new", merged
 * by property: a later change to a field replaces the earlier one.
 *
 * They travel on the linked change as `linkedChanges`, which is the only place
 * publication reads a new linked entity's fields from -- the entity's `data`
 * is display only. Emitting the entity without them created a source, short
 * reference, enslaved person, ... with no fields at all, so a new source's
 * required Short reference always read as "not set" and blocked acceptance
 * (DD-0559), and every other field was dropped on publication.
 */
export const mergePropertyChanges = (
  base: PropertyChange[],
  next: PropertyChange[],
): PropertyChange[] => {
  const touched = new Set(next.map((c) => c.property));
  return [...base.filter((c) => !touched.has(c.property)), ...next];
};

/**
 * The change naming a new entity by `text`: its first text property, the one
 * its dropdown lists it by (see namePropertyLabel). Undefined for a schema with
 * no text property.
 */
export const nameChange = (
  schema: EntitySchema,
  text: string,
): PropertyChange | undefined => {
  const nameProp = schema.properties.find((p) => p.kind === 'text');
  return nameProp
    ? { kind: 'direct', property: nameProp.uid, changed: text }
    : undefined;
};

/**
 * The field changes a new entity's `data` stands for, for one emitted before
 * `linkedChanges` were sent: without them, editing a single field of such an
 * entity (say its Short reference) would publish that field alone and drop
 * the rest. Covers what the dialog edits as plain values -- text, number and
 * bool fields -- and links to other entities, recursing into a linked entity
 * that is itself new. Owned sub-entities (e.g. a source's Date) are left out,
 * as they were before.
 */
export const linkedChangesFromData = (
  schema: EntitySchema,
  entity: MaterializedEntity,
  getSchemaByName: (name: string) => EntitySchema,
): PropertyChange[] => {
  const changes: PropertyChange[] = [];
  for (const p of schema.properties) {
    const value = entity.data[p.label];
    if (value === null || value === undefined || value === '') continue;
    if (p.kind === 'text' || p.kind === 'number' || p.kind === 'bool') {
      if (typeof value === 'object') continue;
      changes.push({ kind: 'direct', property: p.uid, changed: value });
    } else if (
      p.kind === 'linkedEntity' &&
      isMaterializedEntity(value) &&
      p.mode !== EntityLinkEditMode.Own
    ) {
      const link: PropertyChange = {
        kind: 'linked',
        property: p.uid,
        changed: value,
      };
      if (value.entityRef.type === 'new') {
        link.linkedChanges = linkedChangesFromData(
          getSchemaByName(value.entityRef.schema),
          value,
          getSchemaByName,
        );
      }
      changes.push(link);
    }
  }
  return changes;
};
