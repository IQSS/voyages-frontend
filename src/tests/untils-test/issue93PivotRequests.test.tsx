import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, test, vi } from 'vitest';

import PivotTables from '@/components/PresentationComponents/PivotTables/PivotTables';
import pivotReducer, { setRowsPerPage } from '@/redux/getPivotTablesDataSlice';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), csv: vi.fn() }));
vi.mock('@/fetch/voyagesFetch/fetchPivotCrosstabsTables', () => ({
  fetchPivotCrosstabsTables: (request: unknown) => () => ({
    unwrap: () => mocks.fetch(request),
  }),
}));
vi.mock('@/fetch/voyagesFetch/fetchPivotCrosstabsCSV', () => ({
  fetchPivotCrosstabsCSV: mocks.csv,
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({ styleName: 'trans-atlantic' }),
}));
vi.mock(
  '@/components/SelectorComponents/SelectDrowdown/SelectDropdownPivotable',
  () => ({ SelectDropdownPivotable: () => null }),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.fetch.mockReset();
  mocks.csv.mockReset();
});
const table = {
  row_label: 'Year range',
  column_labels: ['Region'],
  value_label: 'People',
  columns: [['St. Helena'], ['All']],
  rows: ['1751–1775', '1776–1800', 'Undefined'],
  values: [
    [4, 4],
    [2, 2],
    [1, 1],
  ],
  totals: [7, 7],
  metadata: { total_results_count: 3, offset: 0, limit: null },
};
function deferred() {
  let resolve!: (value: { data: typeof table }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ data: typeof table }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function mount() {
  const store = configureStore({
    reducer: {
      getPivotTablesData: pivotReducer,
      getLanguages: (state = { languageValue: 'en' }) => state,
      autoCompleteList: (state = { autoLabelName: '' }) => state,
      rangeSlider: (state = { rangeSliderMinMax: [], varName: '' }) => state,
      getScrollPage: (state = { currentPage: 0 }) => state,
      getDataSetCollection: (state = { styleName: 'trans-atlantic' }) => state,
      getGeoTreeData: (state = { geoTreeValue: [] }) => state,
      getCommonGlobalSearch: (state = { inputSearchValue: '' }) => state,
      getNodeEdgesAggroutesMapData: (
        state = { clusterNodeKeyVariable: '', clusterNodeValue: '' },
      ) => state,
      getFilter: (state = { filtersObj: [] }, action) =>
        action.type === 'test/filter' ? { filtersObj: action.payload } : state,
    },
  });
  store.dispatch(setRowsPerPage(2));
  const view = render(
    <Provider store={store}>
      <PivotTables />
    </Provider>,
  );
  return { ...view, store };
}
test('pivot pages and numeric sorts stay local while CSV exports all filtered rows with matching order', async () => {
  mocks.fetch.mockResolvedValue({ data: table });
  mocks.csv.mockResolvedValue(new Blob(['Year range,All\n1751–1775,4']));
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:issue93');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    () => undefined,
  );
  const view = mount();
  await screen.findByRole('table');
  const requestCount = mocks.fetch.mock.calls.length;
  fireEvent.click(screen.getByTitle('2'));
  expect(view.container.querySelector('tbody')?.textContent).toContain(
    'Undefined',
  );
  fireEvent.click(screen.getByRole('button', { name: 'St. Helena' }));
  expect(view.container.querySelector('tbody th')?.textContent).toBe(
    '1751–1775',
  );
  expect(mocks.fetch).toHaveBeenCalledTimes(requestCount);
  fireEvent.click(screen.getByRole('button', { name: /Download/ }));
  await waitFor(() => expect(mocks.csv).toHaveBeenCalledTimes(1));
  expect(mocks.csv.mock.calls[0][0]).toEqual({
    ...mocks.fetch.mock.calls.at(-1)![0],
    order_by: ['-St. Helena'],
  });
  expect(mocks.csv.mock.calls[0][0]).not.toHaveProperty('limit');
  expect(mocks.csv.mock.calls[0][0]).not.toHaveProperty('offset');
});
test('a failed filter request clears the old pivot instead of presenting old totals as current', async () => {
  const next = deferred();
  mocks.fetch
    .mockResolvedValueOnce({ data: table })
    .mockReturnValueOnce(next.promise);
  const view = mount();
  await screen.findByRole('table');
  act(() =>
    view.store.dispatch({
      type: 'test/filter',
      payload: [{ varName: 'voyage_id', op: 'in', searchTerm: [848382733] }],
    }),
  );
  await act(async () =>
    next.reject(new Error('Candidate service unavailable')),
  );
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.getByRole('alert').textContent).toMatch(/Could not load/);
  expect(
    (screen.getByRole('button', { name: /Download/ }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
test('an unmounted pivot response cannot replace the next page’s results', async () => {
  const old = deferred();
  const next = deferred();
  mocks.fetch
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(next.promise);
  const view = mount();
  view.unmount();
  // Reuse the same Redux store, as the real application does across routes.
  render(
    <Provider store={view.store}>
      <PivotTables />
    </Provider>,
  );
  await act(async () =>
    next.resolve({
      data: {
        ...table,
        rows: ['New filter'],
        values: [[9, 9]],
        totals: [9, 9],
      },
    }),
  );
  await act(async () => old.resolve({ data: table }));
  expect(view.store.getState().getPivotTablesData.table?.rows).toEqual([
    'New filter',
  ]);
});
