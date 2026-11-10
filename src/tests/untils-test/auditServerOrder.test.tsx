import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import useDataTableProcessingEffect from '@/hooks/useDataTableProcessingEffect';
import { setRowData } from '@/redux/getTableSlice';
import { TRANSATLANTICTABLEFILE } from '@/share/CONST_DATA';

const dispatch = vi.hoisted(() =>
  vi.fn<
    (action: { type: string; payload: Array<{ voyage_id: number }> }) => void
  >(),
);
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (
    selector: (state: { getLanguages: { languageValue: string } }) => unknown,
  ) => selector({ getLanguages: { languageValue: 'en' } }),
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({ styleName: 'trans-atlantic' }),
}));

afterEach(() => {
  cleanup();
  dispatch.mockClear();
  localStorage.clear();
});

// PR235's reported defect occurred on subsequent responses, not the first.
// Keep the old optional sort argument to exercise the historical hook on replay.
function Rows({ data }: { data: Array<{ voyage_id: number }> }) {
  (
    useDataTableProcessingEffect as (
      ...args: [...Parameters<typeof useDataTableProcessingEffect>, string[]?]
    ) => void
  )(data, ['voyage_id'], TRANSATLANTICTABLEFILE, '', '', [], ['-voyage_id']);
  return null;
}

test('PR235 retains the exact API order on initial and subsequent table responses', () => {
  const data = [{ voyage_id: 9 }, { voyage_id: 2 }, { voyage_id: 10 }];
  const view = render(<Rows data={data} />);
  const rows = () =>
    dispatch.mock.calls
      .filter(([action]) => action.type === setRowData.type)
      .at(-1)![0].payload;
  expect(rows().map((row) => row.voyage_id)).toEqual([9, 2, 10]);
  const next = [{ voyage_id: 10 }, { voyage_id: 9 }, { voyage_id: 2 }];
  view.rerender(<Rows data={next} />);
  expect(rows().map((row) => row.voyage_id)).toEqual([10, 9, 2]);
  expect(next.map((row) => row.voyage_id)).toEqual([10, 9, 2]);
});
