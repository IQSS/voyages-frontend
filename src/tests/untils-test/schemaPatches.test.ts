import {
  AllProperties,
  AllSchemas,
  getSchema,
  SparseDateSchema,
  VoyageSourceSchema,
  VoyageDatesSchema,
  VoyageSchema,
} from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import { propertyForUid } from '@/utils/contribute/propertyAccess';
import { applySchemaPatches } from '@/utils/contribute/schemaPatches';

describe('applySchemaPatches', () => {
  // The patch mutates the shared schema once, so apply it before asserting.
  applySchemaPatches();

  test('moves Voyage grouping into the Impute section', () => {
    const prop = VoyageSchema.properties.find(
      (p) => p.label === 'Voyage grouping',
    );
    expect(prop).toBeDefined();
    expect(prop?.section).toBe('Impute');
  });

  test('leaves the other voyage data fields ungrouped', () => {
    // Voyage ID and Dataset are data, not imputation artifacts — they should
    // still render flat rather than being swept into the new section.
    for (const label of ['Voyage ID', 'Dataset']) {
      const prop = VoyageSchema.properties.find((p) => p.label === label);
      expect(prop?.section).toBeUndefined();
    }
  });

  test('still orders the date fields ahead of the length fields', () => {
    // Guards the pre-existing patch against regressions from the new one.
    const fields = VoyageDatesSchema.properties.map((p) =>
      'backingField' in p ? p.backingField : '',
    );
    expect(fields.indexOf('voyage_began_sparsedate_id')).toBeLessThan(
      fields.indexOf('length_middle_passage_days'),
    );
  });

  test('keeps source dates separate from voyage dates and registers editable properties', () => {
    const sourceDate = getSchema('SourceDate');
    expect(sourceDate.backingTable).toBe('document_docsparsedate');
    expect(sourceDate.properties.map((property) => property.uid)).toEqual([
      'SourceDate_year',
      'SourceDate_month',
      'SourceDate_day',
    ]);
    const date = VoyageSourceSchema.properties.find(
      (property) => property.label === 'Date',
    );
    expect(date).toMatchObject({
      uid: 'Voyage Source_date',
      linkedEntitySchema: 'SourceDate',
      backingField: 'date_id',
    });
    expect(propertyForUid('SourceDate_year')).toBe(
      AllProperties.SourceDate_year,
    );
    expect(SparseDateSchema.backingTable).toBe('voyage_voyagesparsedate');
    expect(SparseDateSchema.properties[0].uid).toBe('VoyageSparseDate_year');
    applySchemaPatches();
    expect(
      AllSchemas.filter((schema) => schema.name === 'SourceDate'),
    ).toHaveLength(1);
  });

  test('is idempotent', () => {
    applySchemaPatches();
    const grouping = VoyageSchema.properties.filter(
      (p) => p.label === 'Voyage grouping',
    );
    expect(grouping).toHaveLength(1);
    expect(grouping[0].section).toBe('Impute');
  });
});
