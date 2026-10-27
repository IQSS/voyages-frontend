/**
 * The sex of an enslaved person.
 *
 * Stored on `past_enslaved.gender_int` as a bare integer (the schema field is
 * `Enslaved_gender_int`) and edited, until now, as a raw number with nothing on
 * screen saying what it means (DD-0550). So the field is presented as the
 * two-way choice it is, labelled "Sex"; the stored value is unchanged, only the
 * way it is picked and shown differs.
 *
 * The codes below (1 = Male, 2 = Female) are authoritative, from voyages-api's
 * `legacy_data_import` command, which populates the `past_gender` lookup with
 * exactly `[(1, "Male"), (2, "Female")]` and sets each enslaved person's gender
 * from the same legacy integer -- so `gender_int` and the `gender` FK
 * (`Gender.name`, which the API serializes) share this coding. Editing here
 * therefore records the same value the rest of the system reads.
 */

export interface SexOption {
  value: number;
  label: string;
}

export const SEX_OPTIONS: SexOption[] = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
];

/** The property a sex choice is recorded against (schema name + backing field). */
export const SEX_PROPERTY = 'Enslaved_gender_int';

/** How the field is labelled in the forms -- "Sex", not "Gender" (DD-0550). */
export const SEX_LABEL = 'Sex';

export const sexLabel = (value: number | null | undefined) =>
  SEX_OPTIONS.find((o) => o.value === value)?.label;
