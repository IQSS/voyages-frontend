import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, test, vi } from 'vitest';

import { NetworkDiagramSlaveVoyagesSVG } from '@/components/PresentationComponents/NetworkGraph/NetworkDiagramSlaveVoyagesSVG';
import networkReducer, {
  setNetWorksID,
  setNetWorksKEY,
} from '@/redux/getPastNetworksGraphDataSlice';

const fetch = vi.hoisted(() => vi.fn());
vi.mock('@/fetch/pastEnslavedFetch/fetchPastNetworksGraph', () => ({
  fetchPastNetworksGraphApi: (payload: unknown) => () => ({
    unwrap: () => fetch(payload),
  }),
}));
vi.mock('@/hooks/useDimensions', () => ({
  useDimensions: () => ({ width: 640, height: 400 }),
}));
vi.mock(
  '@/components/PresentationComponents/NetworkGraph/NetworkDiagramDrawSVG',
  () => ({ NetworkDiagramDrawSVG: () => null }),
);
afterEach(() => {
  cleanup();
  fetch.mockReset();
});
test('record network request binds its explicit database seed before a previous Redux seed can be fetched', async () => {
  const store = configureStore({
    reducer: { getPastNetworksGraphData: networkReducer },
  });
  store.dispatch(setNetWorksID(123));
  store.dispatch(setNetWorksKEY('enslavers'));
  fetch.mockResolvedValue({ nodes: [], edges: [] });
  const props = { seed: { networkID: 900239, networkKEY: 'voyages' } };
  render(
    <Provider store={store}>
      <NetworkDiagramSlaveVoyagesSVG {...props} />
    </Provider>,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(fetch).toHaveBeenCalledWith({ voyages: [900239] });
  expect(fetch).not.toHaveBeenCalledWith({ enslavers: [123] });
});
