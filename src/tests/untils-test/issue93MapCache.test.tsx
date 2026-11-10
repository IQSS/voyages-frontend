import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, expect, test, vi } from 'vitest';

import { useCachedMapData } from '@/hooks/useCachedMapData';
import mapReducer from '@/redux/getNodeEdgesAggroutesMapDataSlice';
import { AggroutesData } from '@/share/InterfaceTypesMap';
import { loadMapData } from '@/utils/functions/mapDataCache';
import { getNodeVoyageIds } from '@/utils/functions/routeVoyageIds';

afterEach(cleanup);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const data = (id: string): AggroutesData => ({
  nodes: [
    {
      id,
      data: { lat: 1, lon: 2 },
      weights: { embarkation: 3, post_disembarkation: 0 },
    },
  ],
  edges: [],
  paths: [],
  voyage_mappings: { '848382733': { nodes: [id], edges: [] } },
});
function mount(fetchMap: Parameters<typeof useCachedMapData>[0]['fetchMap']) {
  const store = configureStore({
    reducer: { getNodeEdgesAggroutesMapData: mapReducer },
  });
  const scope = `issue93-${Math.random()}`;
  const props = {
    scope,
    request: { filter: [] },
    level: 'region',
    enabled: true,
    fetchMap,
  };
  const hook = renderHook((options) => useCachedMapData(options), {
    initialProps: props,
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
  return {
    ...hook,
    props,
    store,
    nodes: () => store.getState().getNodeEdgesAggroutesMapData.nodesData,
  };
}

test('map cache separates datasets and ignores an older response arriving last', async () => {
  const old = deferred<AggroutesData>();
  const next = deferred<AggroutesData>();
  const fetch = vi
    .fn()
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(next.promise);
  const view = mount(fetch);
  view.rerender({ ...view.props, scope: `${view.props.scope}-next` });
  await act(async () => next.resolve(data('next')));
  expect(view.nodes().map((node) => node.id)).toEqual(['next']);
  await act(async () => old.resolve(data('old')));
  expect(view.nodes().map((node) => node.id)).toEqual(['next']);
  expect(getNodeVoyageIds('next')).toEqual(['848382733']);
  expect(getNodeVoyageIds('old')).toEqual([]);
});

test('a failed dataset switch never exposes the previous dataset or voyage index', async () => {
  const next = deferred<AggroutesData>();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(data('old'))
    .mockReturnValueOnce(next.promise);
  const view = mount(fetch);
  await waitFor(() => expect(view.nodes()).toHaveLength(1));
  view.rerender({ ...view.props, scope: `${view.props.scope}-next` });
  await act(async () =>
    next.reject(new Error('Candidate service unavailable')),
  );
  expect(view.nodes()).toEqual([]);
  expect(getNodeVoyageIds('old')).toEqual([]);
  expect(view.result.current.loading).toBe(false);
  expect(view.result.current.error).toBe('Could not load map data.');
  fetch.mockResolvedValueOnce(data('recovered'));
  act(() => view.result.current.retry());
  await waitFor(() => expect(view.nodes()[0]?.id).toBe('recovered'));
  expect(view.result.current.error).toBeNull();
});

test('disabling or unmounting a map invalidates its outstanding response', async () => {
  const pending = deferred<AggroutesData>();
  const view = mount(vi.fn().mockReturnValue(pending.promise));
  view.rerender({ ...view.props, enabled: false });
  await act(async () => pending.resolve(data('disabled')));
  expect(view.nodes()).toEqual([]);
  const another = deferred<AggroutesData>();
  const unmounted = mount(vi.fn().mockReturnValue(another.promise));
  unmounted.unmount();
  await act(async () => another.resolve(data('unmounted')));
  expect(unmounted.nodes()).toEqual([]);
});

test('cache coalesces identical requests and retries a rejected request', async () => {
  const key = `coalesce-${Math.random()}`;
  const pending = deferred<AggroutesData>();
  const fetch = vi.fn().mockReturnValue(pending.promise);
  const first = loadMapData(key, fetch);
  expect(loadMapData(key, fetch)).toBe(first);
  pending.resolve(data('shared'));
  await first;
  expect((await loadMapData(key, fetch))?.nodes[0].id).toBe('shared');
  expect(fetch).toHaveBeenCalledTimes(1);
  const failing = vi
    .fn()
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValue(data('retry'));
  await expect(loadMapData(`${key}-retry`, failing)).rejects.toThrow(
    'unavailable',
  );
  expect((await loadMapData(`${key}-retry`, failing))?.nodes[0].id).toBe(
    'retry',
  );
  expect(failing).toHaveBeenCalledTimes(2);
});
