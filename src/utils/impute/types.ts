/**
 * The contract of the imputation calculation.
 *
 * These mirror `src/impute/generated/impute.ts` in the voyages-contribute repo,
 * which is not part of the published package yet. Declared locally so the
 * adapters around the calculation can be built and tested now; when the package
 * ships them, delete this file and import from there instead.
 *
 * @see https://github.com/SlaveVoyages/voyages-contribute/issues/7
 */

/** Python numbers are floats and `None` is pervasive, so null is a value. */
export type PyNum = number | null;

/** Stood for a Django model instance carrying a code. */
export interface CodedValue {
  value: PyNum;
}

/** A date held as the `"MM,DD,YYYY"` string the interim voyage used. */
export type CsvDate = string | null | undefined;

/** Every slave-number variable the calculation reads, by codebook name. */
export type SlaveNumberVar =
  | 'NCAR13'
  | 'NCAR15'
  | 'NCAR17'
  | 'TSLAVESD'
  | 'TSLAVESP'
  | 'SLAS32'
  | 'SLAS36'
  | 'SLAS39'
  | 'SLAARRIV'
  | 'SLADVOY'
  | 'MEN1'
  | 'MEN2'
  | 'MEN3'
  | 'MEN4'
  | 'MEN5'
  | 'MEN6'
  | 'WOMEN1'
  | 'WOMEN2'
  | 'WOMEN3'
  | 'WOMEN4'
  | 'WOMEN5'
  | 'WOMEN6'
  | 'ADULT1'
  | 'ADULT2'
  | 'ADULT3'
  | 'ADULT4'
  | 'ADULT5'
  | 'ADULT6'
  | 'GIRL1'
  | 'GIRL2'
  | 'GIRL3'
  | 'GIRL4'
  | 'GIRL5'
  | 'GIRL6'
  | 'BOY1'
  | 'BOY2'
  | 'BOY3'
  | 'BOY4'
  | 'BOY5'
  | 'BOY6'
  | 'CHILD1'
  | 'CHILD2'
  | 'CHILD3'
  | 'CHILD4'
  | 'CHILD5'
  | 'CHILD6'
  | 'INFANT1'
  | 'INFANT3'
  | 'INFANT4'
  | 'MALE1'
  | 'MALE2'
  | 'MALE3'
  | 'MALE4'
  | 'MALE5'
  | 'MALE6'
  | 'FEMALE1'
  | 'FEMALE2'
  | 'FEMALE3'
  | 'FEMALE4'
  | 'FEMALE5'
  | 'FEMALE6';

export const SLAVE_NUMBER_VARS: readonly SlaveNumberVar[] = [
  'NCAR13',
  'NCAR15',
  'NCAR17',
  'TSLAVESD',
  'TSLAVESP',
  'SLAS32',
  'SLAS36',
  'SLAS39',
  'SLAARRIV',
  'SLADVOY',
  'MEN1',
  'MEN4',
  'MEN5',
  'WOMEN1',
  'WOMEN4',
  'WOMEN5',
  'ADULT1',
  'ADULT4',
  'ADULT5',
  'GIRL1',
  'GIRL4',
  'GIRL5',
  'BOY1',
  'BOY4',
  'BOY5',
  'CHILD1',
  'CHILD4',
  'CHILD5',
  'INFANT1',
  'INFANT4',
  'MALE1',
  'MALE4',
  'MALE5',
  'FEMALE1',
  'FEMALE4',
  'FEMALE5',
  'MEN3',
  'MEN6',
  'WOMEN3',
  'WOMEN6',
  'ADULT3',
  'ADULT6',
  'GIRL3',
  'GIRL6',
  'BOY3',
  'BOY6',
  'CHILD3',
  'CHILD6',
  'INFANT3',
  'MALE3',
  'MALE6',
  'FEMALE3',
  'FEMALE6',
  'MEN2',
  'WOMEN2',
  'ADULT2',
  'GIRL2',
  'BOY2',
  'CHILD2',
  'MALE2',
  'FEMALE2',
];

/**
 * Read without a default, so an absent key yields null rather than 0.
 *
 * Load-bearing: null and 0 are both falsy, but they order differently in the
 * comparisons that decide `slaximp` and `slamimp`. The adapter must omit an
 * absent key rather than write a null, so the calculation applies its own
 * per-variable default.
 */
export const SLAVE_NUMBER_VARS_WITHOUT_DEFAULT: readonly SlaveNumberVar[] = [
  'TSLAVESD',
  'TSLAVESP',
  'SLADVOY',
];

/** The inputs, mirroring the legacy InterimVoyage. */
export interface ImputeInput {
  date_departure: CsvDate;
  date_first_slave_disembarkation: CsvDate;
  date_return_departure: CsvDate;
  date_slave_purchase_began: CsvDate;
  date_vessel_left_last_slaving_port: CsvDate;
  date_voyage_completed: CsvDate;
  first_place_of_landing: CodedValue | null;
  first_place_of_slave_purchase: CodedValue | null;
  first_port_intended_disembarkation: CodedValue | null;
  first_port_intended_embarkation: CodedValue | null;
  imputed_outcome_of_voyage_for_slaves: CodedValue | null;
  length_of_middle_passage: PyNum;
  national_carrier: CodedValue | null;
  port_of_departure: CodedValue | null;
  port_voyage_ended: CodedValue | null;
  principal_place_of_slave_disembarkation: CodedValue | null;
  principal_place_of_slave_purchase: CodedValue | null;
  rig_of_vessel: CodedValue | null;
  second_place_of_landing: CodedValue | null;
  second_place_of_slave_purchase: CodedValue | null;
  second_port_intended_disembarkation: CodedValue | null;
  second_port_intended_embarkation: CodedValue | null;
  slave_numbers: ReadonlyMap<SlaveNumberVar, number>;
  third_place_of_landing: CodedValue | null;
  third_place_of_slave_purchase: CodedValue | null;
  ton_type: CodedValue | null;
  tonnage_of_vessel: PyNum;
  voyage_outcome: CodedValue | null;
}

/** Every local of the source function, which its tail reflects over. */
export type ImputeEnv = Record<string, PyNum>;

/** The calculation itself. */
export type RunImpute = (input: ImputeInput, isIam: boolean) => ImputeEnv;

/**
 * Python truthiness: `0` and `null` are both falsy, so `!= null` is not a
 * substitute. Used for the calculation's final coercion, where a falsy imputed
 * number is stored as null.
 */
export const pyTruthy = (x: unknown): boolean => {
  if (x === null || x === undefined || x === false) {
    return false;
  }
  if (typeof x === 'number') {
    return x !== 0;
  }
  if (typeof x === 'string') {
    return x.length > 0;
  }
  return true;
};
