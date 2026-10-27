import { EntitySchema } from '@slavevoyages/voyages-contribute';

/**
 * The property that names an entity of `schema` -- the one its dropdown label
 * is read from -- so text typed into a search that found nothing can be put
 * where it belongs on a new entity.
 *
 * That is the schema's first text property for every entity an editor can
 * create from a dropdown today: a short reference's Name, a source's Title, an
 * enslaved person's Documented name, an enslaver's Principal alias, an alias's
 * Alias. Undefined for a schema with no text property, which then opens blank.
 */
export const namePropertyLabel = (schema: EntitySchema): string | undefined =>
  schema.properties.find((p) => p.kind === 'text')?.label;
