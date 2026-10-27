/**
 * Write side: the calculation's flat output -> an EntityChange[] to stack as a
 * bot-authored review.
 *
 * Two rules shape everything here:
 *
 * - **Zero means null.** The original script's last act is `float(v) if v else
 *   None`, so a computed 0 was never stored. Reproducing that keeps the imputed
 *   columns from filling with zeros the original never wrote.
 * - **Never clobber a human.** A property an editor already set in a review is
 *   left alone and reported, rather than silently reverted.
 */

import {
  DirectPropertyChange,
  EntityChange,
  getSchema,
  getSchemaProp,
  isMaterializedEntity,
  isUpdateEntityChange,
  LinkedEntityProperty,
  LinkedEntitySelectionChange,
  materializeNew,
  MaterializedEntity,
  OwnedEntityChange,
  PropertyChange,
  TableChange,
} from '@slavevoyages/voyages-contribute';

import { EntityLookUp } from './codeLookup';
import { ImputeEnv, PyNum, pyTruthy } from './types';

export interface ComputationContext {
  lookUp: EntityLookUp;
  /** Id generator for entities the bot has to materialize. */
  newId: () => string;
  /**
   * Property keys a human review already touched. Property uids for scalars and
   * links, backing fields for table cells.
   */
  protectedKeys?: ReadonlySet<string>;
}

// -- Variable maps ----------------------------------------------------------
//
// Grouped by the owned entity that holds them, and keyed by label because that
// is how the snapshot is keyed.

const VOYAGE_CODES: Record<string, string> = {
  xmimpflag: 'Voyage grouping',
};

const SHIP_CODES: Record<string, string> = {
  natinimp: 'Nationality',
};

const SHIP_NUMBERS: Record<string, string> = {
  tonmod: 'Tonnage standardized on British measured tons, 1773-1870',
};

const OUTCOME_CODES: Record<string, string> = {
  fate2: 'Enslaved outcome',
  fate3: 'Vessel outcome',
  fate4: 'Owner outcome',
};

const ITINERARY_CODES: Record<string, string> = {
  ptdepimp: 'Imputed port where voyage began',
  mjbyptimp: 'Imputed principal place of slave purchase',
  mjslptimp: 'Imputed principal port of slave disembarkation',
};

const DATES_NUMBERS: Record<string, string> = {
  voy1imp: 'Voyage length from home port to disembarkation (days)',
  voy2imp:
    'Voyage length from last slave embarkation to first disembarkation (days)',
};

/** Imputed years, held as a sparse date carrying only a Year. */
const DATES_YEARS: Record<string, string> = {
  yeardep: 'Year voyage began',
  yearaf: 'Year departed Africa',
  yearam: 'Year of arrival at port of disembarkation',
};

const SLAVE_NUMBERS: Record<string, string> = {
  slaximp: 'Total captives embarked (imputed)',
  slamimp: 'Total captives disembarked (imputed)',
  tslmtimp: 'Imputed number of captives embarked for mortality calculation',
  vymrtimp: 'Imputed number of captive deaths during Middle Passage',
  vymrtrat: 'Imputed mortality ratio',
  slavema1: 'Total captives embarked with age identified',
  slavemx1: 'Total captives embarked with gender identified',
  slavmax1: 'Total captives embarked with age and gender identified',
  slavema3: 'Total captives landed with age identified',
  slavemx3: 'Total captives landed with gender identified',
  slavmax3: 'Total captives identified by age and gender among landed',
  slavema7: 'Total captives identified by age at departure or arrival',
  slavemx7: 'Total captives identified by gender at departure or arrival',
  slavmax7:
    'Total captives identified by age and gender at departure or arrival',
  menrat1: 'Percentage of men among embarked captives',
  womrat1: 'Percentage of women among embarked captives',
  boyrat1: 'Percentage of boys among embarked captives',
  girlrat1: 'Percentage of girls among embarked captives',
  chilrat1: 'Child ratio among embarked captives',
  malrat1: 'Male ratio among embarked captives',
  menrat3: 'Percentage of men among landed captives',
  womrat3: 'Percentage of women among landed captives',
  boyrat3: 'Percentage of boys among landed captives',
  girlrat3: 'Percentage of girls among landed captives',
  chilrat3: 'Child ratio among landed captives',
  malrat3: 'Male ratio among landed captives',
  menrat7: 'Percentage men on voyage',
  womrat7: 'Percentage women on voyage',
  boyrat7: 'Percentage boy on voyage',
  girlrat7: 'Percentage girl on voyage',
  chilrat7: 'Percentage children on voyage',
  malrat7: 'Percentage male on voyage',
};

/**
 * Imputed slave-number table cells, keyed by backing field. Verified against
 * VoyageSlaveNumbersSchema's `cellField`, including its three hard-coded naming
 * exceptions (children_embarked, males_total, females_total).
 */
const SLAVE_NUMBER_TABLE: Record<string, string> = {
  adlt1imp: 'imp_num_adult_embarked',
  chil1imp: 'imp_num_children_embarked',
  male1imp: 'imp_num_male_embarked',
  feml1imp: 'imp_num_female_embarked',
  adlt2imp: 'imp_adult_death_middle_passage',
  chil2imp: 'imp_child_death_middle_passage',
  male2imp: 'imp_male_death_middle_passage',
  feml2imp: 'imp_female_death_middle_passage',
  adlt3imp: 'imp_num_adult_landed',
  chil3imp: 'imp_num_child_landed',
  male3imp: 'imp_num_male_landed',
  feml3imp: 'imp_num_female_landed',
  men7: 'imp_num_men_total',
  women7: 'imp_num_women_total',
  boy7: 'imp_num_boy_total',
  girl7: 'imp_num_girl_total',
  adult7: 'imp_num_adult_total',
  child7: 'imp_num_child_total',
  male7: 'imp_num_males_total',
  female7: 'imp_num_females_total',
};

const SLAVE_NUMBERS_TABLE_UID = 'sn_characteristics_imputed';

/**
 * Flattened view of every property the maps above name, for the test that
 * asserts each one exists on its schema. `linked` marks the ones that must be
 * linked entities, since a code or sparse date cannot be written to a scalar.
 */
export const IMPUTE_LABELS: {
  schema: string;
  label: string;
  linked: boolean;
}[] = [
  ...Object.values(VOYAGE_CODES).map((label) => ({
    schema: 'Voyage',
    label,
    linked: true,
  })),
  ...Object.values(SHIP_CODES).map((label) => ({
    schema: 'VoyageShip',
    label,
    linked: true,
  })),
  ...Object.values(SHIP_NUMBERS).map((label) => ({
    schema: 'VoyageShip',
    label,
    linked: false,
  })),
  ...Object.values(OUTCOME_CODES).map((label) => ({
    schema: 'VoyageOutcome',
    label,
    linked: true,
  })),
  ...Object.values(ITINERARY_CODES).map((label) => ({
    schema: 'VoyageItinerary',
    label,
    linked: true,
  })),
  ...Object.values(DATES_NUMBERS).map((label) => ({
    schema: 'VoyageDates',
    label,
    linked: false,
  })),
  ...Object.values(DATES_YEARS).map((label) => ({
    schema: 'VoyageDates',
    label,
    linked: true,
  })),
  ...Object.values(SLAVE_NUMBERS).map((label) => ({
    schema: 'VoyageSlaveNumbers',
    label,
    linked: false,
  })),
];

/** Backing fields of the imputed slave-numbers table. */
export const IMPUTE_TABLE_FIELDS: string[] = Object.values(SLAVE_NUMBER_TABLE);

/**
 * Derived arithmetically from a code or a year, so the schema deliberately has
 * no column for them. Returned as diagnostics rather than written.
 */
const DIAGNOSTIC_VARS = [
  'deptregimp',
  'deptregimp1',
  'regem1',
  'regem2',
  'regem3',
  'regdis1',
  'regdis2',
  'regdis3',
  'majbyimp',
  'majbyimp1',
  'mjselimp',
  'mjselimp1',
  'retrnreg1',
  'year5',
  'year10',
  'year25',
  'year100',
];

// -- Helpers ----------------------------------------------------------------

/** `float(v) if v else None` — a falsy result was never stored. */
const imputedValue = (v: PyNum): number | null => (pyTruthy(v) ? v : null);

const propUid = (schemaName: string, label: string): string => {
  const prop = getSchemaProp(getSchema(schemaName), label);
  if (prop === undefined) {
    throw new Error(`Property "${label}" not found on schema ${schemaName}`);
  }
  return prop.uid;
};

const linkedProp = (
  schemaName: string,
  label: string,
): LinkedEntityProperty => {
  const prop = getSchemaProp(getSchema(schemaName), label);
  if (prop?.kind !== 'linkedEntity') {
    throw new Error(
      `Property "${label}" on ${schemaName} is not a linked entity`,
    );
  }
  return prop;
};

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
 * Every property key a change set touches: uids for scalars and links, backing
 * fields for table cells. Used to spot what a human already decided.
 */
export const collectTouchedKeys = (changes: EntityChange[]): Set<string> => {
  const keys = new Set<string>();
  const recurse = (propChanges: PropertyChange[]) => {
    for (const c of propChanges) {
      if (c.kind === 'table') {
        for (const field of Object.keys(c.changes)) {
          keys.add(field);
        }
        continue;
      }
      keys.add(c.property);
      if (c.kind === 'owned') {
        recurse(c.changes);
      } else if (c.kind === 'linked' && c.linkedChanges) {
        recurse(c.linkedChanges);
      } else if (c.kind === 'ownedList') {
        for (const m of c.modified) {
          recurse(m.changes);
        }
      }
    }
  };
  for (const change of changes) {
    if (isUpdateEntityChange(change)) {
      recurse(change.changes);
    }
  }
  return keys;
};

/** Collects the changes for one owned entity, tracking skips and deltas. */
class OwnedBuilder {
  readonly changes: PropertyChange[] = [];

  constructor(
    private readonly schemaName: string,
    private readonly entity: MaterializedEntity | null,
    private readonly protectedKeys: ReadonlySet<string>,
    private readonly skipped: string[],
  ) {}

  private guard(key: string, label: string): boolean {
    if (this.protectedKeys.has(key)) {
      this.skipped.push(`${this.schemaName}.${label}`);
      return false;
    }
    return true;
  }

  addNumber(label: string, value: PyNum) {
    const uid = propUid(this.schemaName, label);
    if (!this.guard(uid, label)) {
      return;
    }
    const next = imputedValue(value);
    if (numberAt(this.entity, label) === next) {
      return;
    }
    this.changes.push({
      kind: 'direct',
      property: uid,
      changed: next,
    } as DirectPropertyChange);
  }

  addLinked(label: string, target: MaterializedEntity | null) {
    const uid = propUid(this.schemaName, label);
    if (!this.guard(uid, label)) {
      return;
    }
    const current = entityAt(this.entity, label);
    if ((current?.entityRef.id ?? null) === (target?.entityRef.id ?? null)) {
      return;
    }
    this.changes.push({
      kind: 'linked',
      property: uid,
      changed: target,
    } as LinkedEntitySelectionChange);
  }

  /**
   * An imputed year, held as an owned sparse date. The existing date entity is
   * reused when there is one, so the row is updated rather than orphaned.
   */
  addYear(label: string, value: PyNum, newId: () => string) {
    const uid = propUid(this.schemaName, label);
    if (!this.guard(uid, label)) {
      return;
    }
    const next = imputedValue(value);
    const current = entityAt(this.entity, label);
    if ((current === null ? null : numberAt(current, 'Year')) === next) {
      return;
    }
    if (next === null) {
      this.changes.push({
        kind: 'linked',
        property: uid,
        changed: null,
      } as LinkedEntitySelectionChange);
      return;
    }
    const prop = linkedProp(this.schemaName, label);
    const dateSchema = getSchema(prop.linkedEntitySchema);
    const target =
      current ?? materializeNew(dateSchema, `${newId()}_${prop.backingField}`);
    this.changes.push({
      kind: 'linked',
      property: uid,
      changed: target,
      linkedChanges: [
        {
          kind: 'direct',
          property: propUid(dateSchema.name, 'Year'),
          changed: next,
        } as DirectPropertyChange,
      ],
    } as LinkedEntitySelectionChange);
  }

  addTableCells(tableUid: string, cells: Record<string, number | null>) {
    const changes: Record<string, number | null> = {};
    for (const [field, value] of Object.entries(cells)) {
      if (this.protectedKeys.has(field)) {
        this.skipped.push(`${this.schemaName}.${field}`);
        continue;
      }
      const current = this.entity?.data[field];
      if ((typeof current === 'number' ? current : null) === value) {
        continue;
      }
      changes[field] = value;
    }
    if (Object.keys(changes).length > 0) {
      this.changes.push({
        kind: 'table',
        property: tableUid,
        changes,
      } as TableChange);
    }
  }
}

export interface ImputeWriteResult {
  changes: EntityChange[];
  /** Properties left alone because an editor had already set them. */
  skipped: string[];
  /** Computed intermediates the schema has no column for. */
  diagnostics: Record<string, PyNum>;
}

/**
 * Turn the calculation's environment into changes against the voyage snapshot.
 *
 * Only properties whose imputed value differs from the snapshot are emitted, so
 * a re-run that changes nothing yields an empty change set rather than a review
 * full of noise.
 */
export const writeVoyage = async (
  voyage: MaterializedEntity,
  env: ImputeEnv,
  ctx: ComputationContext,
): Promise<ImputeWriteResult> => {
  const protectedKeys = ctx.protectedKeys ?? new Set<string>();
  const skipped: string[] = [];

  const resolveCode = async (
    schemaName: string,
    label: string,
    value: PyNum,
  ): Promise<MaterializedEntity | null> => {
    const code = imputedValue(value);
    if (code === null) {
      return null;
    }
    return ctx.lookUp(linkedProp(schemaName, label).linkedEntitySchema, code);
  };

  const changes: PropertyChange[] = [];

  // Voyage root: the grouping flag.
  const voyageBuilder = new OwnedBuilder(
    'Voyage',
    voyage,
    protectedKeys,
    skipped,
  );
  for (const [envVar, label] of Object.entries(VOYAGE_CODES)) {
    voyageBuilder.addLinked(
      label,
      await resolveCode('Voyage', label, env[envVar]),
    );
  }
  changes.push(...voyageBuilder.changes);

  const ownedTargets: {
    label: string;
    schemaName: string;
    build: (b: OwnedBuilder) => Promise<void>;
  }[] = [
    {
      label: 'Ship',
      schemaName: 'VoyageShip',
      build: async (b) => {
        for (const [envVar, label] of Object.entries(SHIP_CODES)) {
          b.addLinked(
            label,
            await resolveCode('VoyageShip', label, env[envVar]),
          );
        }
        for (const [envVar, label] of Object.entries(SHIP_NUMBERS)) {
          b.addNumber(label, env[envVar]);
        }
      },
    },
    {
      label: 'Outcome',
      schemaName: 'VoyageOutcome',
      build: async (b) => {
        for (const [envVar, label] of Object.entries(OUTCOME_CODES)) {
          b.addLinked(
            label,
            await resolveCode('VoyageOutcome', label, env[envVar]),
          );
        }
      },
    },
    {
      label: 'Itinerary',
      schemaName: 'VoyageItinerary',
      build: async (b) => {
        for (const [envVar, label] of Object.entries(ITINERARY_CODES)) {
          b.addLinked(
            label,
            await resolveCode('VoyageItinerary', label, env[envVar]),
          );
        }
      },
    },
    {
      label: 'Dates',
      schemaName: 'VoyageDates',
      build: async (b) => {
        for (const [envVar, label] of Object.entries(DATES_NUMBERS)) {
          b.addNumber(label, env[envVar]);
        }
        for (const [envVar, label] of Object.entries(DATES_YEARS)) {
          b.addYear(label, env[envVar], ctx.newId);
        }
      },
    },
    {
      label: 'Slave numbers',
      schemaName: 'VoyageSlaveNumbers',
      build: async (b) => {
        for (const [envVar, label] of Object.entries(SLAVE_NUMBERS)) {
          b.addNumber(label, env[envVar]);
        }
        const cells: Record<string, number | null> = {};
        for (const [envVar, field] of Object.entries(SLAVE_NUMBER_TABLE)) {
          cells[field] = imputedValue(env[envVar]);
        }
        b.addTableCells(SLAVE_NUMBERS_TABLE_UID, cells);
      },
    },
  ];

  for (const target of ownedTargets) {
    const existing = entityAt(voyage, target.label);
    const builder = new OwnedBuilder(
      target.schemaName,
      existing,
      protectedKeys,
      skipped,
    );
    await target.build(builder);
    if (builder.changes.length === 0) {
      // Nothing to write. Notably this is what keeps a nullable owned entity
      // like `Outcome` from being materialized on every run to hold an empty
      // change.
      continue;
    }
    changes.push({
      kind: 'owned',
      property: propUid('Voyage', target.label),
      ownedEntity:
        existing ??
        materializeNew(
          getSchema(target.schemaName),
          `${ctx.newId()}_${target.label}`,
        ),
      changes: builder.changes,
    } as OwnedEntityChange);
  }

  const diagnostics: Record<string, PyNum> = {};
  for (const v of DIAGNOSTIC_VARS) {
    if (v in env) {
      diagnostics[v] = env[v];
    }
  }

  return {
    changes:
      changes.length === 0
        ? []
        : [{ type: 'update', entityRef: voyage.entityRef, changes }],
    skipped,
    diagnostics,
  };
};
