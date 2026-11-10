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
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import { GenerateCellTableRenderer } from '@/components/PresentationComponents/Tables/GenerateCellTableRenderer';
import TabsSelect from '@/components/SelectorComponents/Tabs/TabsSelect';
import networkReducer from '@/redux/getPastNetworksGraphDataSlice';
import { DocumentViewerContext } from '@/utils/functions/documentWorkspace';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  route: {
    styleName: 'trans-atlantic',
    currentBlockName: 'variables',
    voyageURLID: '848382733',
    endpointPath: 'voyage',
  },
}));
vi.mock('@/hooks/usePageRouter', () => ({ usePageRouter: () => mocks.route }));
vi.mock('@/fetch/voyagesFetch/fetchVoyageCard', () => ({
  fetchVoyageCard: (id: number) => () => ({ unwrap: () => mocks.fetch(id) }),
}));
vi.mock('@/components/MetaTag/MetaTag', () => ({ default: () => null }));
vi.mock('@/components/PresentationComponents/Cards/Cards', () => ({
  default: () => null,
}));
vi.mock('@/components/PresentationComponents/Cards/CardModal', () => ({
  default: () => null,
}));
vi.mock('@/components/PresentationComponents/Map/MAPS', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/PresentationComponents/NetworkGraph/NetworkDiagramSlaveVoyagesSVG',
  () => ({ NetworkDiagramSlaveVoyagesSVG: () => null }),
);
afterEach(() => {
  cleanup();
  mocks.fetch.mockReset();
  mocks.route.voyageURLID = '848382733';
  mocks.route.currentBlockName = 'variables';
});
function store() {
  return configureStore({
    reducer: {
      getPastNetworksGraphData: networkReducer,
      getCardFlatObjectData: () => ({
        variable: 'variables',
        nodeTypeClass: 'voyage',
        cardRowID: null,
      }),
    },
  });
}
test.each([undefined, null, 0, 1])(
  'connection cells are blank for unavailable or sparse counts (%s)',
  (count) => {
    const Cell = () =>
      GenerateCellTableRenderer(
        {
          value: '',
          data: { id: 848382733, connections_count: count },
        } as never,
        'networks',
        'connections',
        null,
        'voyages',
      );
    const view = render(
      <Provider store={store()}>
        <MemoryRouter>
          <DocumentViewerContext.Provider
            value={{ doc: null, setDoc: vi.fn(), workspace: [] }}
          >
            <Cell />
          </DocumentViewerContext.Provider>
        </MemoryRouter>
      </Provider>,
    );
    expect(view.container.textContent).toBe('');
    expect(screen.queryByRole('button')).toBeNull();
  },
);
test('connection cells show the exact count and open the database network identity by keyboard', () => {
  const state = store();
  const Cell = () =>
    GenerateCellTableRenderer(
      {
        value: '',
        data: { id: 900239, voyage_id: 848382733, connections_count: 7 },
      } as never,
      'networks',
      'connections',
      null,
      'voyages',
    );
  render(
    <Provider store={state}>
      <MemoryRouter>
        <DocumentViewerContext.Provider
          value={{ doc: null, setDoc: vi.fn(), workspace: [] }}
        >
          <Cell />
        </DocumentViewerContext.Provider>
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'Open 7 connections for 900239' }),
    { key: 'Enter' },
  );
  expect(state.getState().getPastNetworksGraphData.networkID).toBe(900239);
  expect(state.getState().getPastNetworksGraphData.networkKEY).toBe('voyages');
});
test.each([0, 1, null])(
  'record tabs hide sparse or unavailable connection counts (%s)',
  async (count) => {
    mocks.fetch.mockResolvedValue({ data: { connections_count: count } });
    render(
      <Provider store={store()}>
        <MemoryRouter>
          <TabsSelect />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('tab', { name: 'Network graph' })).toBeNull(),
    );
  },
);
test('an old record response cannot hide a newer record’s network tab', async () => {
  let resolveOld!: (value: unknown) => void;
  mocks.fetch
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValueOnce({ data: { connections_count: 7 } });
  const state = store();
  const content = () => (
    <Provider store={state}>
      <MemoryRouter>
        <TabsSelect />
      </MemoryRouter>
    </Provider>
  );
  const view = render(content());
  mocks.route.voyageURLID = '848382734';
  view.rerender(content());
  await waitFor(() => expect(mocks.fetch).toHaveBeenLastCalledWith(848382734));
  await act(async () => resolveOld({ data: { connections_count: 0 } }));
  expect(screen.getByRole('tab', { name: 'Network graph' })).toBeTruthy();
});

test('a voyage record’s network uses its database PK rather than its public URL ID', async () => {
  mocks.route.currentBlockName = 'network';
  mocks.fetch.mockResolvedValue({
    data: { id: 900239, voyage_id: 848382733, connections_count: 7 },
  });
  const state = store();
  render(
    <Provider store={state}>
      <MemoryRouter>
        <TabsSelect />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(848382733));
  await waitFor(() =>
    expect(state.getState().getPastNetworksGraphData.networkID).toBe(900239),
  );
  expect(state.getState().getPastNetworksGraphData.networkKEY).toBe('voyages');
});
