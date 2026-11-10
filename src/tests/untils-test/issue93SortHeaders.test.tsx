import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, test, vi } from 'vitest';

import CustomHeaderTable from '@/components/NavigationComponents/Header/CustomHeaderTable';
import tableReducer from '@/redux/getTableSlice';

vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({ styleName: 'trans-atlantic' }),
}));
vi.mock('@/hooks/useOtherTableCellStructure', () => ({
  useOtherTableCellStructure: () => ({ default_order_by: '-voyage_id' }),
}));
afterEach(cleanup);
test('table headers send standard sort signs without enabling a client-side reorder', () => {
  const store = configureStore({ reducer: { getTableData: tableReducer } });
  const setSort = vi.fn();
  const view = render(
    <Provider store={store}>
      <CustomHeaderTable
        {...({
          column: { colDef: { context: { fieldToSort: ['voyage_id'] } } },
          displayName: 'Voyage ID',
          enableSorting: true,
          setSort,
        } as never)}
      />
    </Provider>,
  );
  expect(store.getState().getTableData.sortColumn).toEqual(['-voyage_id']);
  fireEvent.click(view.container.querySelector('.customSortUpLabel')!);
  expect(store.getState().getTableData.sortColumn).toEqual(['voyage_id']);
  fireEvent.click(view.container.querySelector('.customSortDownLabel')!);
  expect(store.getState().getTableData.sortColumn).toEqual(['-voyage_id']);
  expect(setSort).not.toHaveBeenCalled();
});
test('non-sortable connection headers do not expose sort controls', () => {
  const store = configureStore({ reducer: { getTableData: tableReducer } });
  const view = render(
    <Provider store={store}>
      <CustomHeaderTable
        {...({
          column: { colDef: { context: { fieldToSort: [] } } },
          displayName: 'Connections',
          enableSorting: false,
        } as never)}
      />
    </Provider>,
  );
  expect(view.queryByRole('button')).toBeNull();
});
