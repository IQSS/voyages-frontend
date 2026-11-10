import React from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import PivotHtmlTable from '@/components/PresentationComponents/PivotTables/PivotHtmlTable';
import { PivotCrosstabResponse } from '@/share/InterfaceTypePivotTable';

afterEach(cleanup);
export const table: PivotCrosstabResponse = {
  row_label: 'Year range',
  column_labels: ['Broad region', 'Region'],
  value_label: 'People',
  columns: [
    ['Africa', 'St. Helena'],
    ['Africa', 'St. Kitts'],
    ['Undefined', 'Undefined'],
    ['All'],
  ],
  rows: ['1751–1775', '1776–1800', 'Undefined'],
  values: [
    [1000, 2, 0, 1002],
    [4, 2, 0, 6],
    [0, 0, 3, 3],
  ],
  totals: [1004, 4, 3, 1011],
  metadata: { total_results_count: 3, offset: 0, limit: null },
};
const props = {
  table,
  sort: null,
  onSort: vi.fn(),
  page: 1,
  pageSize: 2,
  headerColor: '#000',
};
test('HTML pivot renders hierarchical dotted labels, Undefined and full-table totals on every page', () => {
  const view = render(<PivotHtmlTable {...props} />);
  expect(screen.getByText('Africa').getAttribute('colspan')).toBe('2');
  expect(screen.getByRole('button', { name: 'St. Helena' })).toBeTruthy();
  expect(view.container.querySelector('tbody')?.textContent).toContain('1,002');
  expect(view.container.querySelector('tfoot')?.textContent).toContain('1,011');
  view.rerender(<PivotHtmlTable {...props} page={2} />);
  expect(view.container.querySelector('tbody')?.textContent).toBe(
    'Undefined0033',
  );
  expect(view.container.querySelector('tfoot')?.textContent).toContain('1,011');
});
test('pivot sorting is stable, numeric, local and does not mutate the API response', () => {
  const before = JSON.stringify(table);
  const view = render(
    <PivotHtmlTable
      {...props}
      pageSize={10}
      sort={{ column: 'Africa__St. Kitts', direction: 'desc' }}
    />,
  );
  const labels = () =>
    [...view.container.querySelectorAll('tbody th')].map(
      (node) => node.textContent,
    );
  expect(labels()).toEqual(table.rows);
  view.rerender(
    <PivotHtmlTable
      {...props}
      pageSize={10}
      sort={{ column: 'All', direction: 'asc' }}
    />,
  );
  expect(labels()).toEqual(['Undefined', '1776–1800', '1751–1775']);
  expect(
    view.container
      .querySelector('th.pivot-total-col')
      ?.getAttribute('aria-sort'),
  ).toBe('ascending');
  fireEvent.click(screen.getByRole('button', { name: 'St. Helena' }));
  expect(props.onSort).toHaveBeenLastCalledWith('Africa__St. Helena');
  expect(JSON.stringify(table)).toBe(before);
});
test('empty and normalized pivot responses render without invented data', () => {
  const view = render(
    <PivotHtmlTable
      {...props}
      table={{ ...table, rows: [], values: [], totals: [] }}
    />,
  );
  expect(screen.getByText('No results.')).toBeTruthy();
  view.rerender(
    <PivotHtmlTable
      {...props}
      table={{
        ...table,
        rows: ['1751–1775'],
        values: [[0.3333, 0.6667, 0, 1]],
        totals: [0.3333, 0.6667, 0, 1],
      }}
    />,
  );
  expect(view.container.querySelector('tbody')?.textContent).toBe(
    '1751–17750.330.6701',
  );
});

test.each([
  ['asc', ['2', '10', '100', 'Undefined']],
  ['desc', ['100', '10', '2', 'Undefined']],
] as const)(
  'row-label %s matches canonical numeric API/CSV order with Undefined last',
  (direction, expected) => {
    const view = render(
      <PivotHtmlTable
        {...props}
        table={{
          ...table,
          rows: ['2', '10', '100', 'Undefined'],
          values: [[1], [2], [3], [4]],
          columns: [['All']],
          column_labels: ['Region'],
          totals: [10],
        }}
        pageSize={10}
        sort={{ column: null, direction }}
      />,
    );
    expect(
      [...view.container.querySelectorAll('tbody th')].map(
        (node) => node.textContent,
      ),
    ).toEqual(expected);
  },
);

test.each([
  ['asc', ['Port 10', 'Port 2', 'Undefined']],
  ['desc', ['Port 2', 'Port 10', 'Undefined']],
] as const)(
  'row-label %s uses canonical server ranks rather than browser-dependent text collation',
  (direction, expected) => {
    const view = render(
      <PivotHtmlTable
        {...props}
        table={{ ...table, rows: ['Port 10', 'Port 2', 'Undefined'] }}
        pageSize={10}
        sort={{ column: null, direction }}
      />,
    );
    expect(
      [...view.container.querySelectorAll('tbody th')].map(
        (node) => node.textContent,
      ),
    ).toEqual(expected);
  },
);
