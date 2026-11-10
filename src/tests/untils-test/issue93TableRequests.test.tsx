import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, test, vi } from 'vitest';

import Tables from '@/components/PresentationComponents/Tables/Tables';
import tableReducer, { setPage, setSortColumn } from '@/redux/getTableSlice';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/fetch/voyagesFetch/fetchVoyageOptionsAPI', () => ({
  fetchVoyageOptionsAPI: (request: unknown) => () => ({
    unwrap: () => mocks.fetch(request),
  }),
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({ styleName: 'trans-atlantic' }),
}));
vi.mock('@/hooks/useOtherTableCellStructure', () => ({
  useOtherTableCellStructure: () => ({ default_order_by: '-voyage_id' }),
}));
vi.mock('@/hooks/useTableCellStructure', () => ({
  useTableCellStructure: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
}));
// Keep the actual row-processing hook and Redux flow; replace only column/cell
// formatting and the third-party grid so these tests observe rendered ordering.
vi.mock('@/utils/functions/generateRowsData', () => ({
  generateRowsData: (rows: unknown) => rows,
}));
vi.mock('@/utils/functions/generateColumnDef', () => ({
  generateColumnDef: vi.fn(),
}));
vi.mock('ag-grid-react', () => ({
  AgGridReact: React.forwardRef(function Grid(
    {
      rowData,
      loading,
    }: { rowData: { voyage_id: number }[]; loading: boolean },
    _ref,
  ) {
    return (
      <div role="table" aria-busy={loading}>
        {rowData.map((row) => (
          <div role="row" key={row.voyage_id}>
            {row.voyage_id}
          </div>
        ))}
      </div>
    );
  }),
}));
vi.mock('antd', () => ({
  Pagination: ({ total, current }: { total: number; current: number }) => (
    <div role="status">
      Page {current}, {total} results
    </div>
  ),
}));
vi.mock('@/components/CommonComponts/CustomLoadingOverlay', () => ({
  CustomLoadingOverlay: () => <div role="progressbar" />,
}));
vi.mock('@/components/PresentationComponents/Cards/CardModal', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/PresentationComponents/NetworkGraph/ModalNetworksGraph',
  () => ({ default: () => null }),
);
vi.mock(
  '@/components/SelectorComponents/ButtonComponents/ButtonDropdownColumnSelector',
  () => ({ default: () => null }),
);
vi.mock('@/components/SelectorComponents/ButtonComponents/DownloadCSV', () => ({
  default: () => null,
}));

afterEach(() => {
  cleanup();
  mocks.fetch.mockReset();
  vi.restoreAllMocks();
  localStorage.clear();
});
type Response = { data: { count: number; results: { voyage_id: number }[] } };
function deferred() {
  let resolve!: (value: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const response = (count: number, ...ids: number[]): Response => ({
  data: { count, results: ids.map((voyage_id) => ({ voyage_id })) },
});
function mount() {
  const store = configureStore({
    reducer: {
      getTableData: tableReducer,
      getLanguages: (state = { languageValue: 'en' }) => state,
      rangeSlider: (state = { rangeSliderMinMax: [] }) => state,
      getFilter: (state = { filtersObj: [] }) => state,
      autoCompleteList: (state = { textFilterValue: '' }) => state,
      getSaveSearch: (state = { reloadTable: false }) => state,
      getShowFilterObject: (state = { viewAll: false, textFilter: false }) =>
        state,
      getColumns: (state = { visibleColumnCells: [] }) => state,
      getGeoTreeData: (state = { isChangeGeoTree: false }) => state,
      getCommonGlobalSearch: (state = { inputSearchValue: '' }) => state,
      getNodeEdgesAggroutesMapData: (
        state = { clusterNodeKeyVariable: '', clusterNodeValue: '' },
      ) => state,
      getDataSetCollection: (state = { tableFlatfileVoyages: '' }) => state,
      getPeopleEnlavedDataSetCollection: (
        state = { tableFlatfileEnslaved: '' },
      ) => state,
      getScrollEnslavedPage: (state = { currentEnslavedPage: 0 }) => state,
      getEnslaverDataSetCollections: (state = { tableFlatfileEnslavers: '' }) =>
        state,
    },
  });
  store.dispatch(setSortColumn(['-voyage_id']));
  return {
    ...render(
      <Provider store={store}>
        <Tables />
      </Provider>,
    ),
    store,
  };
}
const rows = () => screen.queryAllByRole('row').map((row) => row.textContent);

test('an older sort response cannot replace the current rows or result count', async () => {
  const older = deferred();
  const latest = deferred();
  mocks.fetch
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(latest.promise);
  const view = mount();
  act(() => view.store.dispatch(setSortColumn(['voyage_id'])));
  expect(mocks.fetch.mock.calls.map(([request]) => request.order_by)).toEqual([
    ['-voyage_id'],
    ['voyage_id'],
  ]);
  await act(async () => latest.resolve(response(30, 1, 2)));
  expect(rows()).toEqual(['1', '2']);
  await act(async () => older.resolve(response(50, 9, 8)));
  expect(rows()).toEqual(['1', '2']);
  expect(screen.getByRole('status').textContent).toBe('Page 1, 30 results');
});

test.each(['resolve', 'reject'] as const)(
  'an obsolete page request cannot stop loading the latest page when it %ss',
  async (settle) => {
    const older = deferred();
    const latest = deferred();
    mocks.fetch
      .mockResolvedValueOnce(response(50, 1, 2))
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(latest.promise);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const view = mount();
    await screen.findByRole('table');
    act(() => view.store.dispatch(setPage(1)));
    act(() => view.store.dispatch(setPage(2)));
    expect(
      mocks.fetch.mock.calls.slice(1).map(([request]) => request.page),
    ).toEqual([2, 3]);
    await act(async () => {
      if (settle === 'resolve') older.resolve(response(50, 3, 4));
      else older.reject(new Error('Obsolete request failed'));
    });
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
    expect(rows()).toEqual(['1', '2']);
    await act(async () => latest.resolve(response(50, 5, 6)));
    expect(rows()).toEqual(['5', '6']);
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('false');
  },
);
