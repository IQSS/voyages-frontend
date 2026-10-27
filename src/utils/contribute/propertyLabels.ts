import { SEX_LABEL, SEX_PROPERTY } from './sex';

/**
 * Property labels that differ from what the voyages-contribute package ships,
 * keyed by property uid.
 *
 * - The Enslaved "Gender" field is shown (and picked) as "Sex" (DD-0550).
 * - The two slave-characteristics tables are shown under their section's name,
 *   "Age and sex". Unlabelled, they rendered as two identical "Show table"
 *   buttons with nothing saying which opened the imputed one.
 */
const PROPERTY_LABEL_OVERRIDES: Record<string, string> = {
  [SEX_PROPERTY]: SEX_LABEL,
  sn_characteristics: 'Age and sex',
  sn_characteristics_imputed: 'Age and sex (imputed)',
};

/** The label a property is shown under. */
export const displayPropertyLabel = (property: {
  uid: string;
  label: string;
}): string => PROPERTY_LABEL_OVERRIDES[property.uid] ?? property.label;
