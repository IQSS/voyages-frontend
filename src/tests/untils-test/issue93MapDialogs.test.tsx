import React from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { VoyagesModal } from '@/components/PresentationComponents/Map/VoyagesModal/VoyagesModal';
import { NodePivot } from '@/components/PresentationComponents/Map/VoyagesModal/NodePivot';
import { nodePivots } from '@/components/PresentationComponents/Map/VoyagesModal/nodePivots';
import {
  buildRouteVoyageIndex,
  getRouteVoyageIds,
  getNodeVoyageIds,
  setRouteVoyageIndex,
} from '@/utils/functions/routeVoyageIds';

const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  bibliography: vi.fn(),
  pivot: vi.fn(),
}));
vi.mock('@/fetch/voyagesFetch/fetchRouteVoyages', () => ({
  fetchRouteVoyagesPage: mocks.page,
  fetchVoyageBibliography: mocks.bibliography,
}));
vi.mock('@/fetch/voyagesFetch/fetchNodePivot', () => ({
  fetchNodePivot: mocks.pivot,
}));
const pivot = {
  row_label: 'Year range',
  column_labels: ['Region'],
  value_label: 'People',
  columns: [['All']],
  rows: ['1751–1775'],
  values: [[4]],
  totals: [4],
  metadata: { total_results_count: 1, offset: 0, limit: null },
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});
function observeRows() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
    },
  );
}
test('route and node indexes retain public voyage identities and isolate the current map', () => {
  setRouteVoyageIndex(
    buildRouteVoyageIndex({
      '848382733': {
        nodes: ['Africa', 'America'],
        edges: [['Africa', 'America']],
      },
    }),
  );
  expect(getRouteVoyageIds('Africa', 'America')).toEqual(['848382733']);
  expect(getNodeVoyageIds('Africa')).toEqual(['848382733']);
  setRouteVoyageIndex(
    buildRouteVoyageIndex({ '848382734': { nodes: ['Europe'], edges: [] } }),
  );
  expect(getRouteVoyageIds('Africa', 'America')).toEqual([]);
  expect(getNodeVoyageIds('Europe')).toEqual(['848382734']);
});
test('route dialog fetches public IDs, preserves unknown values, sorts with -descending and opens sources', async () => {
  observeRows();
  mocks.bibliography.mockResolvedValue(['<em>Recorded source</em>']);
  mocks.page.mockResolvedValue({
    count: 1,
    results: [
      {
        voyage_id: 848382733,
        voyage_ship: { ship_name: 'Fictional test ship' },
      },
    ],
  });
  const close = vi.fn();
  const view = render(
    <VoyagesModal voyageIds={['848382733']} onClose={close} />,
  );
  await screen.findByText('Fictional test ship');
  expect(mocks.page).toHaveBeenLastCalledWith(['848382733'], 1, 25, [
    'voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year',
  ]);
  expect(view.container.querySelector('tbody')?.textContent).toContain('—');
  fireEvent.click(screen.getByRole('button', { name: /Year/ }));
  await waitFor(() =>
    expect(mocks.page).toHaveBeenLastCalledWith(['848382733'], 1, 25, [
      '-voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year',
    ]),
  );
  fireEvent.click(screen.getByRole('tab', { name: '1 Source' }));
  expect(screen.getByText('Recorded source').tagName).toBe('EM');
  expect(mocks.bibliography).toHaveBeenCalledWith(['848382733']);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(close).toHaveBeenCalledTimes(1);
});
test('cluster toggles recompute public voyage IDs, sources and node pivots without deselecting every place', async () => {
  mocks.bibliography.mockResolvedValue([]);
  mocks.pivot.mockResolvedValue(pivot);
  const places = [
    {
      id: 'a',
      name: 'Port A',
      voyageIds: ['848382733'],
      weights: { embarkation: 4, post_disembarkation: 0 },
    },
    {
      id: 'b',
      name: 'Port B',
      voyageIds: ['848382733', '848382734'],
      weights: { disembarkation: 5, post_disembarkation: 0 },
    },
  ];
  render(
    <VoyagesModal
      voyageIds={['848382733', '848382734']}
      places={places}
      onClose={vi.fn()}
    />,
  );
  await screen.findByRole('table');
  expect(mocks.pivot).toHaveBeenLastCalledWith(
    expect.objectContaining({
      binsize: 25,
      value_field: 'voyage_slaves_numbers__imp_total_num_slaves_embarked',
    }),
    ['848382733', '848382734'],
  );
  fireEvent.click(screen.getByRole('button', { name: 'Port B' }));
  await waitFor(() =>
    expect(mocks.pivot).toHaveBeenLastCalledWith(expect.anything(), [
      '848382733',
    ]),
  );
  expect(mocks.bibliography).toHaveBeenLastCalledWith(['848382733']);
  expect(
    screen.queryByRole('tab', { name: 'Disembarked here, by origin' }),
  ).toBeNull();
  expect(
    (screen.getByRole('button', { name: 'Port A' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
test('node pivot ignores stale responses after a selection switch', async () => {
  let resolveOld!: (value: typeof pivot) => void;
  mocks.pivot
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValueOnce({ ...pivot, rows: ['Current port'] });
  const request = nodePivots({ embarkation: 4, post_disembarkation: 0 })[0]
    .request;
  const view = render(
    <NodePivot voyageIds={['848382733']} request={request} />,
  );
  view.rerender(<NodePivot voyageIds={['848382734']} request={request} />);
  await screen.findByText('Current port');
  await act(async () => resolveOld(pivot));
  expect(screen.queryByText('1751–1775')).toBeNull();
  expect(screen.getByText('Current port')).toBeTruthy();
});
