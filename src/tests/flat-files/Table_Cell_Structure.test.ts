import { expect, test } from 'vitest';

import getColumnsReducer, {
  initialState,
  setColumnsSelectorTree,
} from '@/redux/getColumnSlice';
import TABLE_FLAT from '@/utils/flatfiles/voyages/voyages_transatlantic_table.json';

test('getColumnsSelectorTree reducer sets the valueCells', () => {
  const tableCellStructure = TABLE_FLAT;

  const state = getColumnsReducer(
    initialState,
    setColumnsSelectorTree(
      tableCellStructure as unknown as typeof initialState.valueCells,
    ),
  );

  expect(state.valueCells).toEqual(tableCellStructure);
});

test('replacing table columns preserves visibility and the previous state', () => {
  const before = { ...initialState, visibleColumnCells: ['voyage_id'] };
  const state = getColumnsReducer(
    before,
    setColumnsSelectorTree([] as unknown as typeof initialState.valueCells),
  );
  expect(state.valueCells).toEqual([]);
  expect(state.visibleColumnCells).toEqual(['voyage_id']);
  expect(before.valueCells).toEqual(TABLE_FLAT);
});
