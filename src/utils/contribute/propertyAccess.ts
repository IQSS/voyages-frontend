import {
  AllProperties,
  Property,
  PropertyAccessLevel,
} from '@slavevoyages/voyages-contribute';

/** The property a change refers to, or undefined if nothing declares that uid. */
export const propertyForUid = (uid: string): Property | undefined =>
  AllProperties[uid];

/**
 * How a change reads to a person: the property's own label, so "Voyage ID"
 * rather than the uid it is stored under.
 */
export const propertyLabelForUid = (uid: string): string | undefined =>
  AllProperties[uid]?.label;

/**
 * Whether someone at `accessLevel` is allowed to see this property at all.
 *
 * The same comparison `EntityForm` makes when deciding which fields to render,
 * applied to the changes list — otherwise a contributor is shown an editor's
 * edit to a field the form never offered them, with no way to act on it. A uid
 * nothing declares is left visible: it is not evidence of a restriction.
 */
export const isPropertyVisibleAt = (
  uid: string,
  accessLevel: PropertyAccessLevel,
): boolean => {
  const property = AllProperties[uid];
  return (
    property?.accessLevel === undefined || property.accessLevel <= accessLevel
  );
};
