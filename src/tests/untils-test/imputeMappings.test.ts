/**
 * Every property the adapters name must actually exist on its schema.
 *
 * The mappings were transcribed from IMPUTE_PORT_PLAN.md, so a typo or a
 * renamed property would otherwise surface as a runtime throw in front of an
 * editor. This asserts the whole surface up front instead.
 *
 * Note what this does *not* prove: that each SPSS variable is paired with the
 * *right* property. A mapping that points at a real but incorrect field passes
 * here and still writes the wrong number. That pairing comes from the port plan
 * and needs Domingos's eyes.
 */

import { getSchema, getSchemaProp } from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import { READ_LABELS } from '@/utils/impute/readVoyage';
import { IMPUTE_LABELS, IMPUTE_TABLE_FIELDS } from '@/utils/impute/writeVoyage';

describe('impute read mappings', () => {
  // A wrong label here returns null instead of throwing, so the calculation
  // would silently run on a missing value. These assertions are the only thing
  // standing between a typo and a quietly wrong imputation.
  test.each(READ_LABELS)(
    '$schema has a property labelled "$label"',
    ({ schema, label }) => {
      const prop = getSchemaProp(getSchema(schema), label);
      expect(prop, `No property "${label}" on schema ${schema}`).toBeDefined();
    },
  );

  test('the slave-number table cells the reader derives all exist', () => {
    // materializeNew seeds one data key per cell the schema defines, so a
    // freshly materialized entity is the oracle for valid cell fields.
    const table = getSchema('VoyageSlaveNumbers').properties.find(
      (p) => p.uid === 'sn_characteristics',
    );
    expect(table?.kind).toBe('table');
    if (table?.kind !== 'table') {
      return;
    }
    const known = new Set<string>();
    for (let row = 0; row < table.rows.length; ++row) {
      for (let col = 0; col < table.columns.length; ++col) {
        const field = table.cellField(col, row);
        if (field !== undefined) {
          known.add(field);
        }
      }
    }
    // Spot-check the two naming traps: the plural MALE/FEMALE prefixes, and the
    // fact that a variable's trailing digit is a position, not a row index.
    for (const field of [
      'num_men_embark_first_port_purchase',
      'num_males_died_middle_passage',
      'num_females_disembark_second_landing',
      'num_infant_embark_first_port_purchase',
    ]) {
      expect(known.has(field), `${field} is not a slave-numbers cell`).toBe(
        true,
      );
    }
  });
});

describe('impute write mappings', () => {
  test.each(IMPUTE_LABELS)(
    '$schema has a property labelled "$label"',
    ({ schema, label }) => {
      const prop = getSchemaProp(getSchema(schema), label);
      expect(prop, `No property "${label}" on schema ${schema}`).toBeDefined();
    },
  );

  test('every linked-code property really is a linked entity', () => {
    for (const { schema, label, linked } of IMPUTE_LABELS) {
      if (!linked) {
        continue;
      }
      const prop = getSchemaProp(getSchema(schema), label);
      expect(prop?.kind, `${schema}.${label}`).toBe('linkedEntity');
    }
  });

  test('every imputed table cell exists on the slave-numbers schema', () => {
    // Table cells are keyed by backing field, and materializeNew seeds one key
    // per cell the schema defines — so the schema's own cell set is the oracle.
    const table = getSchema('VoyageSlaveNumbers').properties.find(
      (p) => p.uid === 'sn_characteristics_imputed',
    );
    expect(table?.kind).toBe('table');
    if (table?.kind !== 'table') {
      return;
    }
    const known = new Set<string>();
    for (let row = 0; row < table.rows.length; ++row) {
      for (let col = 0; col < table.columns.length; ++col) {
        const field = table.cellField(col, row);
        if (field !== undefined) {
          known.add(field);
        }
      }
    }
    for (const field of IMPUTE_TABLE_FIELDS) {
      expect(
        known.has(field),
        `${field} is not a cell of the imputed table`,
      ).toBe(true);
    }
  });
});
