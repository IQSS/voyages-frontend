import { getSchema } from '@slavevoyages/voyages-contribute';
import { describe, expect, test } from 'vitest';

import { namePropertyLabel } from '@/utils/contribute/linkedEntityName';

// The five fields an editor can create an entity from a dropdown with, and
// the property the typed text must land in -- the one each dropdown lists by.
describe('namePropertyLabel', () => {
  test.each([
    ['Voyage Source Short Reference', 'Name'],
    ['Voyage Source', 'Title'],
    ['Enslaved', 'Documented name'],
    ['Enslaver', 'Principal alias'],
    ['EnslaverAliasWithIdentity', 'Alias'],
  ])('%s is named by %s', (schema, label) => {
    expect(namePropertyLabel(getSchema(schema))).toBe(label);
  });
});
