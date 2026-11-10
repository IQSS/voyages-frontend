import fs from 'node:fs';

import axios from 'axios';
import { afterEach, expect, test, vi } from 'vitest';

import { fetchNodePivot } from '@/fetch/voyagesFetch/fetchNodePivot';
import { fetchPivotCrosstabsCSV } from '@/fetch/voyagesFetch/fetchPivotCrosstabsCSV';
import {
  fetchRouteVoyagesPage,
  fetchVoyageBibliography,
} from '@/fetch/voyagesFetch/fetchRouteVoyages';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@/share/AUTH_BASEURL', () => ({
  BASEURL: 'https://candidate.invalid/api',
  AUTHTOKEN: 'Token synthetic-django-fixture',
}));
afterEach(() => vi.mocked(axios.post).mockReset());
const headers = {
  Authorization: 'Token synthetic-django-fixture',
  'Content-Type': 'application/json',
};
test('route rows and bibliography use public IDs and Django authentication', async () => {
  vi.mocked(axios.post).mockResolvedValue({ data: [] });
  await fetchRouteVoyagesPage(['848382733'], 2, 25, ['-voyage_id']);
  expect(axios.post).toHaveBeenLastCalledWith(
    'https://candidate.invalid/api/voyage/',
    {
      page: 2,
      page_size: 25,
      order_by: ['-voyage_id'],
      filter: [{ varName: 'voyage_id', op: 'in', searchTerm: [848382733] }],
    },
    { headers },
  );
  await fetchVoyageBibliography(['848382733']);
  expect(axios.post).toHaveBeenLastCalledWith(
    'https://candidate.invalid/api/voyage/bibliography/',
    { voyage_ids: [848382733] },
    { headers },
  );
});
test('node pivots filter public IDs and CSV retains all statistical options without page slicing', async () => {
  const request = {
    rows: 'voyage_dates__imp_arrival_at_port_of_dis_sparsedate__year',
    rows_label: 'Year range',
    columns: ['voyage_itinerary__imp_principal_region_slave_dis__name'],
    binsize: 25,
    value_field: 'voyage_slaves_numbers__imp_total_num_slaves_embarked',
    agg_fn: 'sum',
  };
  const blob = new Blob(['Year range,All\n1751–1775,7']);
  vi.mocked(axios.post).mockResolvedValue({ data: blob });
  await fetchNodePivot(request, ['848382733']);
  expect(axios.post).toHaveBeenLastCalledWith(
    'https://candidate.invalid/api/voyage/crosstabs/',
    {
      ...request,
      filter: [{ varName: 'voyage_id', op: 'in', searchTerm: [848382733] }],
    },
    { headers },
  );
  const csvRequest = {
    ...request,
    filter: [],
    order_by: ['-All'],
    global_search: 'synthetic',
  };
  expect(await fetchPivotCrosstabsCSV(csvRequest)).toBe(blob);
  expect(axios.post).toHaveBeenLastCalledWith(
    'https://candidate.invalid/api/voyage/crosstabs/',
    { ...csvRequest, format: 'csv' },
    { headers, responseType: 'blob' },
  );
});

type Config = Record<string, unknown>;
function objects(value: unknown): Config[] {
  if (!value || typeof value !== 'object') return [];
  return [value as Config, ...Object.values(value).flatMap(objects)];
}
test.each([
  'voyages_all',
  'voyages_transatlantic',
  'voyages_intraamerican',
  'voyages_indian_ocean_and_asia_slave_trade_database',
])(
  '%s distinguishes recorded Total embarked from imputed totals in table, card and filter',
  (dataset) => {
    const recorded =
      'voyage_slaves_numbers__total_num_slaves_dep_last_slaving_port';
    const imputed = 'voyage_slaves_numbers__imp_total_num_slaves_embarked';
    for (const suffix of ['table', 'card', 'filter_menu']) {
      const config = JSON.parse(
        fs.readFileSync(
          `src/utils/flatfiles/voyages/${dataset}_${suffix}.json`,
          'utf8',
        ),
      );
      const labeled = objects(config).filter(
        (entry) =>
          ((entry.header_label ?? entry.label) as { en?: string } | undefined)
            ?.en === 'Total embarked',
      );
      expect(labeled.length).toBeGreaterThan(0);
      for (const entry of labeled) {
        const serialized = JSON.stringify(entry);
        expect(serialized).toContain(recorded);
        expect(serialized).not.toContain(imputed);
      }
      const imp = objects(config).filter(
        (entry) =>
          ((entry.header_label ?? entry.label) as { en?: string } | undefined)
            ?.en === 'Total embarked (IMP)',
      );
      expect(imp.length).toBeGreaterThan(0);
      for (const entry of imp) expect(JSON.stringify(entry)).toContain(imputed);
    }
  },
);
