/**
 * Which database a voyage belongs to.
 *
 * `Voyage.dataset` is mandatory and Editor-only: the decision belongs to
 * editors, not contributors. Nothing in the schema, the Django model or the
 * database records what its numbers mean — the column is a bare `int` whose
 * help_text names two of them by way of example.
 *
 * The four below are confirmed by Daniel Domingues (19 August 2026). Three of
 * them also match the filters the public browse routes send, in
 * `utils/functions/filtersDataSend.ts`:
 *
 *   trans-atlantic  -> 0
 *   intra-american  -> 1
 *   indian-ocean    -> 3
 *
 * **2 is the one that could not be worked out from the code.** No browse route
 * filters on it and nothing names it anywhere; that it means Intra-African is
 * Daniel's answer, and this comment is the only place it is written down.
 */

export interface DatasetOption {
  value: number;
  label: string;
}

export const DATASET_OPTIONS: DatasetOption[] = [
  { value: 0, label: 'Trans-Atlantic' },
  { value: 1, label: 'Intra-American' },
  { value: 2, label: 'Intra-African' },
  { value: 3, label: 'Indian Ocean' },
];

/** The property a dataset decision is recorded against. */
export const DATASET_PROPERTY = 'Voyage_dataset';

export const datasetLabel = (value: number | null | undefined) =>
  DATASET_OPTIONS.find((o) => o.value === value)?.label;
