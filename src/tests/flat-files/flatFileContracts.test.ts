import { expect, test } from 'vitest';

import { extractTestVarNamesFlatFiles } from '@/utils/functions/extractVarNamesTest';

import { chartField, unsupportedVariables } from './flatFileContracts';

test('nested filter extraction retains leaf variables and ignores headings', async () => {
  expect(
    await extractTestVarNamesFlatFiles([
      {
        label: { en: 'Group' },
        children: [
          { var_name: 'age' },
          { children: [{ var_name: 'gender__name' }] },
        ],
      },
    ]),
  ).toEqual(['age', 'gender__name']);
});

test('unknown variables remain failures rather than being inferred from the menu', () => {
  expect(unsupportedVariables(['age', 'age_typo'], ['age'])).toEqual([
    'age_typo',
  ]);
  expect(chartField('year__bins__10')).toBe('year');
  expect(chartField('year__bins__invalid')).toBe('year__bins__invalid');
  expect(chartField('year__bins__0')).toBe('year__bins__0');
});
