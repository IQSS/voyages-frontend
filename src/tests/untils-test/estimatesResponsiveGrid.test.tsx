import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { afterEach, expect, test, vi } from 'vitest';

import Estimates from '@/components/PresentationComponents/Assessment/Estimates/Estimates';

vi.mock('@/components/MetaTag/MetaTag', () => ({ default: () => null }));
vi.mock(
  '@/components/PresentationComponents/Assessment/Estimates/EstimatesNavBar',
  () => ({
    default: () => null,
  }),
);
vi.mock(
  '@/components/PresentationComponents/Assessment/Estimates/ShowAllSelected',
  () => ({
    default: () => null,
  }),
);
vi.mock(
  '@/components/PresentationComponents/Assessment/Estimates/EstimateCollapse',
  () => ({
    default: () => <div data-testid="filters">Filters</div>,
  }),
);
vi.mock(
  '@/components/PresentationComponents/Assessment/Estimates/EstimatesTabs',
  () => ({
    default: () => <div data-testid="visualization">Map and table</div>,
  }),
);

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const hosts: HTMLDivElement[] = [];
afterEach(() => hosts.splice(0).forEach((host) => host.remove()));

test.each([
  ['filters', { xs: 12, sm: 12, md: 4, lg: 3, xl: 3 }],
  ['visualization', { xs: 12, sm: 12, md: 8, lg: 9, xl: 9 }],
] as const)(
  'Estimates applies the accepted responsive spans to %s using the installed Grid',
  (area, spans) => {
    const host = document.createElement('div');
    hosts.push(host);
    document.body.append(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<Estimates />));
      const grid = host.querySelector(`[data-testid="${area}"]`)?.parentElement;
      expect(grid).not.toBeNull();
      // Use the real installed MUI renderer. Legacy item/xs/lg props were
      // silently discarded by MUI 7 and produced no responsive sizing classes.
      // Full browser acceptance separately verifies actual width and map popups.
      for (const [breakpoint, span] of Object.entries(spans)) {
        expect(
          grid?.classList.contains(`MuiGrid-grid-${breakpoint}-${span}`),
        ).toBe(true);
      }
    } finally {
      act(() => root.unmount());
    }
  },
);
