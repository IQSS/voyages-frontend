import { expect, test } from 'vitest';

import all from '@/utils/flatfiles/voyages/voyages_all_filter_menu.json';
import indianOcean from '@/utils/flatfiles/voyages/voyages_indian_ocean_and_asia_slave_trade_database_filter_menu.json';
import intraAmerican from '@/utils/flatfiles/voyages/voyages_intraamerican_filter_menu.json';
import transAtlantic from '@/utils/flatfiles/voyages/voyages_transatlantic_filter_menu.json';

type Filter = {
  label?: { en?: string };
  var_name?: string;
  children?: Filter[];
};

function namedFilters(filters: Filter[], label: string): Filter[] {
  return filters.flatMap((filter) => [
    ...(filter.label?.en === label ? [filter] : []),
    ...namedFilters(filter.children ?? [], label),
  ]);
}

test.each([
  ['All voyages', all],
  ['Trans-Atlantic', transAtlantic],
  ['Intra-American', intraAmerican],
  ['Indian Ocean', indianOcean],
])('%s Percent men filters men, not women', (_dataset, menu) => {
  // The original Percent men contract predates PR219. Both male and female
  // fields are valid API options, so a schema-membership check cannot catch
  // the accidental label/field mismatch reproduced on the deployed candidate.
  const men = namedFilters(menu, 'Percent men');
  expect(men).toHaveLength(1);
  expect(men[0].var_name).toBe('voyage_slaves_numbers__percentage_men');
  const women = namedFilters(menu, 'Percent women');
  expect(women).toHaveLength(1);
  expect(women[0].var_name).not.toBe(men[0].var_name);
});
