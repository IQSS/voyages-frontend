import {
  EntityChange,
  getSchema,
  isUpdateEntityChange,
  materializeNew,
  MaterializedEntity,
  OwnedEntityChange,
  TableChange,
} from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import { EntityLookUp } from '@/utils/impute/codeLookup';
import { readVoyage, UnhydratedSnapshotError } from '@/utils/impute/readVoyage';
import { ImputeEnv } from '@/utils/impute/types';
import { collectTouchedKeys, writeVoyage } from '@/utils/impute/writeVoyage';

const mkVoyage = (): MaterializedEntity =>
  materializeNew(getSchema('Voyage'), 1);

const owned = (
  voyage: MaterializedEntity,
  label: string,
): MaterializedEntity => {
  const e = voyage.data[label];
  if (typeof e !== 'object' || e === null || !('data' in e)) {
    throw new Error(`${label} is not materialized`);
  }
  return e as MaterializedEntity;
};

/** A read-only code entity, as the snapshot holds them. */
const coded = (
  schema: string,
  id: number,
  code: number,
  label: 'Code' | 'Value' = 'Code',
): MaterializedEntity => ({
  entityRef: { type: 'existing', schema, id },
  data: { [label]: code },
  state: 'original',
});

const sparseDate = (
  year: number | null,
  month: number | null,
  day: number | null,
): MaterializedEntity => ({
  entityRef: { type: 'existing', schema: 'VoyageSparseDate', id: 99 },
  data: { Year: year, Month: month, Day: day },
  state: 'original',
});

const lookUpAll: EntityLookUp = async (schema, code) =>
  coded(schema, 1000 + code, code);

const emptyEnv = (): ImputeEnv => ({});

const findOwned = (
  changes: EntityChange[],
  propertyUid: string,
): OwnedEntityChange | undefined => {
  const update = changes.find(isUpdateEntityChange);
  return update?.changes.find(
    (c): c is OwnedEntityChange =>
      c.kind === 'owned' && c.property === propertyUid,
  );
};

describe('readVoyage', () => {
  test('omits absent slave numbers rather than zeroing them', () => {
    const voyage = mkVoyage();
    const sn = owned(voyage, 'Slave numbers');
    sn.data['Total captives on board at departure from last slaving port'] =
      null;
    sn.data['Captives carried from first port of embarkation'] = 42;

    const { input } = readVoyage(voyage);

    expect(input.slave_numbers.get('NCAR13')).toBe(42);
    // The calculation defaults NCAR13 to 0 but TSLAVESD to null. Writing a null
    // here would erase that distinction.
    expect(input.slave_numbers.has('TSLAVESD')).toBe(false);
    expect(input.slave_numbers.has('MEN1')).toBe(false);
  });

  test('reads table-cell slave numbers by backing field', () => {
    const voyage = mkVoyage();
    const sn = owned(voyage, 'Slave numbers');
    sn.data.num_men_embark_first_port_purchase = 7;
    sn.data.num_males_died_middle_passage = 3;
    sn.data.num_females_disembark_second_landing = 5;

    const { input } = readVoyage(voyage);

    expect(input.slave_numbers.get('MEN1')).toBe(7);
    // MALE/FEMALE take the plural backing prefix.
    expect(input.slave_numbers.get('MALE2')).toBe(3);
    expect(input.slave_numbers.get('FEMALE6')).toBe(5);
  });

  test('formats a full date as MM,DD,YYYY', () => {
    const voyage = mkVoyage();
    owned(voyage, 'Dates').data["Date of vessel's departure"] = sparseDate(
      1780,
      1,
      31,
    );
    expect(readVoyage(voyage).input.date_departure).toBe('01,31,1780');
  });

  test('keeps a year-only date parseable but not differenceable', () => {
    const voyage = mkVoyage();
    owned(voyage, 'Dates').data["Date of vessel's departure"] = sparseDate(
      1780,
      null,
      null,
    );
    // Empty month/day: extractYear still reads the year, dateDiff declines it.
    expect(readVoyage(voyage).input.date_departure).toBe(',,1780');
  });

  test('yields no date at all when the year is missing', () => {
    const voyage = mkVoyage();
    owned(voyage, 'Dates').data["Date of vessel's departure"] = sparseDate(
      null,
      6,
      15,
    );
    expect(readVoyage(voyage).input.date_departure).toBe(null);
  });

  test('reads codes from Code or Value per schema', () => {
    const voyage = mkVoyage();
    owned(voyage, 'Ship').data['National carrier'] = coded('Nationality', 5, 7);
    voyage.data.Outcome = materializeNew(getSchema('VoyageOutcome'), 'o1');
    owned(voyage, 'Outcome').data['Outcome of voyage'] = coded(
      'ParticularOutcome',
      3,
      2,
      'Value',
    );

    const { input } = readVoyage(voyage);

    expect(input.national_carrier?.value).toBe(7);
    expect(input.voyage_outcome?.value).toBe(2);
  });

  test('refuses an unhydrated linked entity instead of reading it as absent', () => {
    const voyage = mkVoyage();
    owned(voyage, 'Ship').data['National carrier'] = {
      entityRef: { type: 'existing', schema: 'Nationality', id: 5 },
      data: {},
      state: 'lazy',
    };

    expect(() => readVoyage(voyage)).toThrow(UnhydratedSnapshotError);
  });

  test('derives isIam from the dataset', () => {
    const voyage = mkVoyage();
    voyage.data.Dataset = 1;
    expect(readVoyage(voyage).isIam).toBe(true);
    voyage.data.Dataset = 0;
    expect(readVoyage(voyage).isIam).toBe(false);
  });
});

describe('writeVoyage', () => {
  test('stores a computed zero as null', async () => {
    const voyage = mkVoyage();
    owned(voyage, 'Ship').data[
      'Tonnage standardized on British measured tons, 1773-1870'
    ] = 150;

    const { changes } = await writeVoyage(
      voyage,
      { ...emptyEnv(), tonmod: 0 },
      { lookUp: lookUpAll, newId: () => 'new' },
    );

    const tonmod = findOwned(changes, 'Voyage_Ship')?.changes.find(
      (c) => c.kind === 'direct' && c.property === 'VoyageShip_tonnage_mod',
    );
    expect(tonmod).toBeDefined();
    expect((tonmod as { changed: unknown }).changed).toBe(null);
  });

  test('emits nothing when values already match the snapshot', async () => {
    const voyage = mkVoyage();
    owned(voyage, 'Ship').data[
      'Tonnage standardized on British measured tons, 1773-1870'
    ] = 150;

    const { changes } = await writeVoyage(
      voyage,
      { ...emptyEnv(), tonmod: 150 },
      { lookUp: lookUpAll, newId: () => 'new' },
    );

    expect(changes).toHaveLength(0);
  });

  test('skips and reports properties an editor already set', async () => {
    const voyage = mkVoyage();

    const { changes, skipped } = await writeVoyage(
      voyage,
      { ...emptyEnv(), tonmod: 200 },
      {
        lookUp: lookUpAll,
        newId: () => 'new',
        protectedKeys: new Set(['VoyageShip_tonnage_mod']),
      },
    );

    expect(skipped).toContain(
      'VoyageShip.Tonnage standardized on British measured tons, 1773-1870',
    );
    expect(changes).toHaveLength(0);
  });

  test('writes imputed table cells under their exception names', async () => {
    const voyage = mkVoyage();

    const { changes } = await writeVoyage(
      voyage,
      {
        ...emptyEnv(),
        chil1imp: 4, // imp_num_children_embarked exception
        male7: 9, // imp_num_males_total exception
        adlt2imp: 2, // death_middle_passage drops the num_ prefix
      },
      { lookUp: lookUpAll, newId: () => 'new' },
    );

    const table = findOwned(changes, 'Voyage_Slave numbers')?.changes.find(
      (c): c is TableChange =>
        c.kind === 'table' && c.property === 'sn_characteristics_imputed',
    );
    expect(table?.changes.imp_num_children_embarked).toBe(4);
    expect(table?.changes.imp_num_males_total).toBe(9);
    expect(table?.changes.imp_adult_death_middle_passage).toBe(2);
  });

  test('writes an imputed year as a sparse date carrying only the year', async () => {
    const voyage = mkVoyage();

    const { changes } = await writeVoyage(
      voyage,
      { ...emptyEnv(), yeardep: 1780 },
      { lookUp: lookUpAll, newId: () => 'gen' },
    );

    const year = findOwned(changes, 'Voyage_Dates')?.changes.find(
      (c) =>
        c.kind === 'linked' &&
        c.property === 'VoyageDates_imp_voyage_began_sparsedate_id',
    );
    expect(year).toBeDefined();
    expect((year as { linkedChanges?: unknown[] }).linkedChanges).toHaveLength(
      1,
    );
  });

  test('materializes Outcome only when there is something to write', async () => {
    const voyage = mkVoyage();
    expect(voyage.data.Outcome).toBe(null);

    // Nothing computed: the nullable entity must not be created.
    const empty = await writeVoyage(voyage, emptyEnv(), {
      lookUp: lookUpAll,
      newId: () => 'gen',
    });
    expect(findOwned(empty.changes, 'Voyage_Outcome')).toBeUndefined();

    // Something computed: now it is materialized.
    const filled = await writeVoyage(
      voyage,
      { ...emptyEnv(), fate2: 3 },
      { lookUp: lookUpAll, newId: () => 'gen' },
    );
    const outcome = findOwned(filled.changes, 'Voyage_Outcome');
    expect(outcome).toBeDefined();
    expect(outcome?.ownedEntity.entityRef.type).toBe('new');
  });
});

describe('collectTouchedKeys', () => {
  test('finds scalar, linked and table properties', () => {
    const touched = collectTouchedKeys([
      {
        type: 'update',
        entityRef: { type: 'existing', schema: 'Voyage', id: 1 },
        changes: [
          {
            kind: 'owned',
            property: 'Voyage_Ship',
            ownedEntity: materializeNew(getSchema('VoyageShip'), 's'),
            changes: [
              {
                kind: 'direct',
                property: 'VoyageShip_tonnage_mod',
                changed: 12,
              },
              {
                kind: 'table',
                property: 'sn_characteristics_imputed',
                changes: { imp_num_adult_embarked: 3 },
              },
            ],
          },
        ],
      },
    ]);

    expect(touched.has('VoyageShip_tonnage_mod')).toBe(true);
    expect(touched.has('imp_num_adult_embarked')).toBe(true);
    expect(touched.has('Voyage_Ship')).toBe(true);
  });
});
