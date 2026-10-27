import { describe, expect, test } from 'vitest';

import { tableCellText } from '@/utils/contribute/numbersTable';

describe('tableCellText', () => {
  test('shows numbers, as typed into the table', () => {
    expect(tableCellText(4)).toBe('4');
    expect(tableCellText(0)).toBe('0');
    expect(tableCellText(2.5)).toBe('2.5');
  });

  test('shows numeric text, as the bulk importer stores it (DD-0560)', () => {
    expect(tableCellText('4')).toBe('4');
    expect(tableCellText(' 12 ')).toBe('12');
    expect(tableCellText('0')).toBe('0');
  });

  test('leaves the cell blank for anything that is not a number', () => {
    expect(tableCellText(null)).toBe('');
    expect(tableCellText(undefined)).toBe('');
    expect(tableCellText('')).toBe('');
    expect(tableCellText('   ')).toBe('');
    expect(tableCellText('abc')).toBe('');
    expect(tableCellText(Number.NaN)).toBe('');
  });
});
