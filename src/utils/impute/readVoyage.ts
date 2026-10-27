/**
 * Read side: a materialized Voyage snapshot -> the flat, SPSS-named ImputeInput.
 *
 * The snapshot keys owned and linked entities by property *label* and table
 * cells by *backing field*; the calculation wants the codebook names the legacy
 * InterimVoyage used. This module is the whole of that mismatch, and
 * deliberately holds no logic beyond the mapping.
 */

import {
  isMaterializedEntity,
  MaterializedEntity,
} from '@slavevoyages/voyages-contribute';

import {
  CodedValue,
  CsvDate,
  ImputeInput,
  PyNum,
  SLAVE_NUMBER_VARS,
  SlaveNumberVar,
} from './types';

/**
 * Code-bearing schemas do not agree on what to call their code. Spelled out per
 * schema rather than probed as `Code ?? Value`: a silent `undefined` here reads
 * as "missing" and shifts every branch downstream of it.
 */
const CODE_LABEL: Record<string, string> = {
  Location: 'Code',
  Nationality: 'Code',
  RigOfVessel: 'Code',
  TonType: 'Code',
  VoyageGrouping: 'Code',
  ParticularOutcome: 'Value',
  SlavesOutcome: 'Value',
  VesselOutcomeSchema: 'Value',
  OwnerOutcome: 'Value',
};

/** Raised when the snapshot is not complete enough to impute from. */
export class UnhydratedSnapshotError extends Error {
  constructor(public readonly refs: string[]) {
    super(
      `Cannot impute: ${refs.length} linked ${
        refs.length === 1 ? 'entity is' : 'entities are'
      } not materialized (${refs.join(', ')}). Reading a code off a lazy ` +
        'entity yields undefined, which is indistinguishable from a genuinely ' +
        'absent value.',
    );
    this.name = 'UnhydratedSnapshotError';
  }
}

const entityAt = (
  parent: MaterializedEntity | null,
  label: string,
): MaterializedEntity | null => {
  if (parent === null) {
    return null;
  }
  const value = parent.data[label];
  return isMaterializedEntity(value) ? value : null;
};

const numberAt = (parent: MaterializedEntity | null, label: string): PyNum => {
  if (parent === null) {
    return null;
  }
  const value = parent.data[label];
  return typeof value === 'number' ? value : null;
};

/**
 * A linked code value. Lazy entities are collected rather than read: their
 * `data` is `{}`, so the code would come back `undefined` and be silently
 * treated as absent.
 */
const codedAt = (
  parent: MaterializedEntity | null,
  label: string,
  unhydrated: string[],
): CodedValue | null => {
  const linked = entityAt(parent, label);
  if (linked === null) {
    return null;
  }
  const codeLabel = CODE_LABEL[linked.entityRef.schema];
  if (codeLabel === undefined) {
    throw new Error(
      `No code label registered for schema ${linked.entityRef.schema} (property "${label}")`,
    );
  }
  const raw = linked.data[codeLabel];
  if (raw === undefined) {
    unhydrated.push(
      `${label} -> ${linked.entityRef.schema}#${linked.entityRef.id}`,
    );
    return null;
  }
  return { value: typeof raw === 'number' ? raw : null };
};

/**
 * A sparse date as the `"MM,DD,YYYY"` string the calculation parses.
 *
 * A missing year yields no usable date at all; a year without month or day
 * still answers `extractYear` while `dateDiff` correctly declines it.
 */
const sparseDateAt = (
  parent: MaterializedEntity | null,
  label: string,
): CsvDate => {
  const date = entityAt(parent, label);
  if (date === null) {
    return null;
  }
  const year = date.data.Year;
  if (typeof year !== 'number') {
    return null;
  }
  const part = (v: unknown) =>
    typeof v === 'number' ? v.toString().padStart(2, '0') : '';
  return `${part(date.data.Month)},${part(date.data.Day)},${year
    .toString()
    .padStart(4, '0')}`;
};

/** Non-table slave numbers, which are ordinary properties keyed by label. */
const SLAVE_NUMBER_SCALARS: Partial<Record<SlaveNumberVar, string>> = {
  NCAR13: 'Captives carried from first port of embarkation',
  NCAR15: 'Captives carried from second port of embarkation',
  NCAR17: 'Captives carried from third port of embarkation',
  TSLAVESP: 'Total captives embarked',
  TSLAVESD: 'Total captives on board at departure from last slaving port',
  SLAARRIV: 'Total captives arrived at first port of disembarkation',
  SLAS32: 'Captives landed at first port of disembarkation',
  SLAS36: 'Captives landed at second port of disembarkation',
  SLAS39: 'Captives landed at third port of disembarkation',
  SLADVOY: 'Deaths in the transoceanic voyage',
};

/** `MALE`/`FEMALE` take the plural backing prefix; the rest are singular. */
const CATEGORY_PREFIX: Record<string, string> = {
  MEN: 'num_men',
  WOMEN: 'num_women',
  BOY: 'num_boy',
  GIRL: 'num_girl',
  MALE: 'num_males',
  FEMALE: 'num_females',
  ADULT: 'num_adult',
  CHILD: 'num_child',
  INFANT: 'num_infant',
};

/** The trailing digit of a table variable names its position, not its row. */
const POSITION_SUFFIX: Record<string, string> = {
  '1': 'embark_first_port_purchase',
  '2': 'died_middle_passage',
  '3': 'disembark_first_landing',
  '4': 'embark_second_port_purchase',
  '5': 'embark_third_port_purchase',
  '6': 'disembark_second_landing',
};

const tableCellField = (v: SlaveNumberVar): string => {
  const prefix = CATEGORY_PREFIX[v.slice(0, -1)];
  const suffix = POSITION_SUFFIX[v.slice(-1)];
  if (prefix === undefined || suffix === undefined) {
    throw new Error(`Cannot map slave number variable ${v} to a table cell`);
  }
  return `${prefix}_${suffix}`;
};

/**
 * Build the `slave_numbers` map.
 *
 * Absent values are *omitted* rather than stored as null, because the
 * calculation supplies its own per-variable default on read — 0 for most, null
 * for TSLAVESD/TSLAVESP/SLADVOY. Writing a null here would override that
 * distinction; both are falsy but they order differently.
 */
const readSlaveNumbers = (
  slaveNumbers: MaterializedEntity | null,
): Map<SlaveNumberVar, number> => {
  const result = new Map<SlaveNumberVar, number>();
  if (slaveNumbers === null) {
    return result;
  }
  for (const v of SLAVE_NUMBER_VARS) {
    const scalarLabel = SLAVE_NUMBER_SCALARS[v];
    const raw =
      scalarLabel !== undefined
        ? slaveNumbers.data[scalarLabel]
        : slaveNumbers.data[tableCellField(v)];
    if (typeof raw === 'number') {
      result.set(v, raw);
    }
  }
  return result;
};

/**
 * Every property this module reads, by schema.
 *
 * Named here rather than inline because a wrong label on the read side does not
 * throw — `entityAt`/`numberAt` simply return null, the calculation receives a
 * missing value, and the result is quietly wrong. The mappings test asserts each
 * of these exists, which turns that silent failure into a failing build.
 */
export const READ_LABELS: { schema: string; label: string }[] = [
  { schema: 'Voyage', label: 'Dataset' },
  { schema: 'Voyage', label: 'Ship' },
  { schema: 'Voyage', label: 'Outcome' },
  { schema: 'Voyage', label: 'Itinerary' },
  { schema: 'Voyage', label: 'Dates' },
  { schema: 'Voyage', label: 'Slave numbers' },

  { schema: 'VoyageDates', label: "Date of vessel's departure" },
  { schema: 'VoyageDates', label: 'Date that embarkation began' },
  { schema: 'VoyageDates', label: 'Date that vessel left last slaving port' },
  { schema: 'VoyageDates', label: 'Date of first disembarkation' },
  { schema: 'VoyageDates', label: 'Date that ship left on return voyage' },
  { schema: 'VoyageDates', label: 'Date when voyage completed' },
  { schema: 'VoyageDates', label: 'Length of transoceanic voyage in days' },

  { schema: 'VoyageShip', label: 'National carrier' },
  { schema: 'VoyageShip', label: 'Tonnage of vessel' },
  { schema: 'VoyageShip', label: 'Definition of ton' },
  { schema: 'VoyageShip', label: 'Rig of vessel' },

  { schema: 'VoyageOutcome', label: 'Outcome of voyage' },
  { schema: 'VoyageOutcome', label: 'Enslaved outcome' },

  { schema: 'VoyageItinerary', label: 'First port of intended embarkation' },
  { schema: 'VoyageItinerary', label: 'Second port of intended embarkation' },
  { schema: 'VoyageItinerary', label: 'First port of intended disembarkation' },
  {
    schema: 'VoyageItinerary',
    label: 'Second port of intended disembarkation',
  },
  { schema: 'VoyageItinerary', label: 'First port of embarkation' },
  { schema: 'VoyageItinerary', label: 'Second port of embarkation' },
  { schema: 'VoyageItinerary', label: 'Third port of embarkation' },
  { schema: 'VoyageItinerary', label: 'First port of disembarkation' },
  { schema: 'VoyageItinerary', label: 'Second port of disembarkation' },
  { schema: 'VoyageItinerary', label: 'Third port of disembarkation' },
  { schema: 'VoyageItinerary', label: 'Principal port of embarkation' },
  { schema: 'VoyageItinerary', label: 'Principal port of disembarkation' },
  { schema: 'VoyageItinerary', label: "Port of vessel's departure" },
  { schema: 'VoyageItinerary', label: 'Port at which voyage ended' },

  ...Object.values(SLAVE_NUMBER_SCALARS).map((label) => ({
    schema: 'VoyageSlaveNumbers',
    label: label as string,
  })),
];

export interface ReadVoyageResult {
  input: ImputeInput;
  /** `is_iam`, derived from the voyage's dataset. */
  isIam: boolean;
}

/** The Intra-American dataset, which the calculation branches on. */
const DATASET_INTRA_AMERICAN = 1;

export const readVoyage = (voyage: MaterializedEntity): ReadVoyageResult => {
  if (voyage.entityRef.schema !== 'Voyage') {
    throw new Error(
      `readVoyage expects a Voyage, got ${voyage.entityRef.schema}`,
    );
  }
  const unhydrated: string[] = [];
  const ship = entityAt(voyage, 'Ship');
  const outcome = entityAt(voyage, 'Outcome');
  const itinerary = entityAt(voyage, 'Itinerary');
  const dates = entityAt(voyage, 'Dates');
  const slaveNumbers = entityAt(voyage, 'Slave numbers');

  const coded = (parent: MaterializedEntity | null, label: string) =>
    codedAt(parent, label, unhydrated);

  const input: ImputeInput = {
    // Dates
    date_departure: sparseDateAt(dates, "Date of vessel's departure"),
    date_slave_purchase_began: sparseDateAt(
      dates,
      'Date that embarkation began',
    ),
    date_vessel_left_last_slaving_port: sparseDateAt(
      dates,
      'Date that vessel left last slaving port',
    ),
    date_first_slave_disembarkation: sparseDateAt(
      dates,
      'Date of first disembarkation',
    ),
    date_return_departure: sparseDateAt(
      dates,
      'Date that ship left on return voyage',
    ),
    date_voyage_completed: sparseDateAt(dates, 'Date when voyage completed'),
    length_of_middle_passage: numberAt(
      dates,
      'Length of transoceanic voyage in days',
    ),

    // Ship
    national_carrier: coded(ship, 'National carrier'),
    tonnage_of_vessel: numberAt(ship, 'Tonnage of vessel'),
    ton_type: coded(ship, 'Definition of ton'),
    rig_of_vessel: coded(ship, 'Rig of vessel'),

    // Outcome. `imputed_outcome_of_voyage_for_slaves` is the *persisted* value
    // from a previous run, read separately from the one derived in this run.
    voyage_outcome: coded(outcome, 'Outcome of voyage'),
    imputed_outcome_of_voyage_for_slaves: coded(outcome, 'Enslaved outcome'),

    // Itinerary
    first_port_intended_embarkation: coded(
      itinerary,
      'First port of intended embarkation',
    ),
    second_port_intended_embarkation: coded(
      itinerary,
      'Second port of intended embarkation',
    ),
    first_port_intended_disembarkation: coded(
      itinerary,
      'First port of intended disembarkation',
    ),
    second_port_intended_disembarkation: coded(
      itinerary,
      'Second port of intended disembarkation',
    ),
    first_place_of_slave_purchase: coded(
      itinerary,
      'First port of embarkation',
    ),
    second_place_of_slave_purchase: coded(
      itinerary,
      'Second port of embarkation',
    ),
    third_place_of_slave_purchase: coded(
      itinerary,
      'Third port of embarkation',
    ),
    first_place_of_landing: coded(itinerary, 'First port of disembarkation'),
    second_place_of_landing: coded(itinerary, 'Second port of disembarkation'),
    third_place_of_landing: coded(itinerary, 'Third port of disembarkation'),
    principal_place_of_slave_purchase: coded(
      itinerary,
      'Principal port of embarkation',
    ),
    principal_place_of_slave_disembarkation: coded(
      itinerary,
      'Principal port of disembarkation',
    ),
    port_of_departure: coded(itinerary, "Port of vessel's departure"),
    port_voyage_ended: coded(itinerary, 'Port at which voyage ended'),

    slave_numbers: readSlaveNumbers(slaveNumbers),
  };

  if (unhydrated.length > 0) {
    throw new UnhydratedSnapshotError(unhydrated);
  }

  return {
    input,
    isIam: numberAt(voyage, 'Dataset') === DATASET_INTRA_AMERICAN,
  };
};
