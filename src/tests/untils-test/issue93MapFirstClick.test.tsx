import React from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { afterEach, expect, test, vi } from 'vitest';

import MAPComponents from '@/components/PresentationComponents/Map/MAPS';

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => ({ nameIdURL: '' }),
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({
    styleNameRoute: 'trans-atlantic',
    voyageURLID: '',
    nodeTypeURL: 'voyage',
  }),
}));
vi.mock('@/components/PresentationComponents/Map/LeafletMapURL', () => ({
  LeafletMapURL: () => null,
}));
vi.mock('@/components/PresentationComponents/Map/LeafletMap', () => ({
  LeafletMap: () => (
    <MapContainer className="lealfetMap-container" center={[0, 0]} zoom={3}>
      <svg>
        <path
          data-testid="route"
          data-voyage-route-source="114"
          data-voyage-route-target="32"
        />
      </svg>
    </MapContainer>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('the first route press focuses the interactive map without scrolling it away from the pointer', () => {
  render(
    <div data-testid="scroll-area">
      <MAPComponents />
    </div>,
  );
  const route = screen.getByTestId('route');
  const scroller = screen.getByTestId('scroll-area');
  const interactiveMap = route.closest('.lealfetMap-container');
  const focus = HTMLElement.prototype.focus;
  // The DOM test environment does not scroll on focus. Model the nested scroller movement from the
  // browser reproduction while exercising Leaflet’s actual keyboard handlers.
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
    this: HTMLElement,
    options?: FocusOptions,
  ) {
    if (this.classList.contains('leaflet-container') && !options?.preventScroll)
      scroller.scrollTop += 40;
    focus.call(this, options);
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  fireEvent.mouseDown(route, { button: 0 });
  expect(scroller.scrollTop).toBe(0);
  expect(document.activeElement).toBe(interactiveMap);
});
