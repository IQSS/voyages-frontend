import { describe, expect, test } from 'vitest';

import {
  idsFromGrid,
  loadNavList,
  pageOf,
  saveNavList,
  withPage,
} from '@/utils/contribute/contributionNav';

const grid = (nodes: [number | null, string | undefined][]) => ({
  forEachNode: (
    cb: (node: { rowIndex: number | null; data?: { id: string } }) => void,
  ) =>
    nodes.forEach(([rowIndex, id]) =>
      cb({ rowIndex, data: id ? { id } : undefined }),
    ),
});

describe('contribution navigation', () => {
  test('reads loaded rows by position, leaving gaps empty', () => {
    expect(
      idsFromGrid(
        grid([
          [0, 'a'],
          [1, 'b'],
          [3, 'd'],
          [2, undefined],
        ]),
      ),
    ).toEqual(['a', 'b', null, 'd']);
    expect(idsFromGrid(undefined)).toEqual([]);
  });

  test('puts a fetched page in place', () => {
    expect(pageOf(0, 2)).toBe(1);
    expect(pageOf(5, 2)).toBe(3);
    expect(withPage(['a', 'b'], 2, 2, ['c', 'd'])).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(withPage(['a'], 3, 2, ['e'])).toEqual(['a', null, null, null, 'e']);
  });

  test('keeps each table list apart', () => {
    saveNavList({
      source: 'welcome',
      ids: ['w'],
      total: 1,
      pageSize: 50,
      query: {},
    });
    expect(loadNavList('welcome')?.ids).toEqual(['w']);
    expect(loadNavList('editorial')).toBeUndefined();
  });
});
