import { act } from 'react';

import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import NodeEdgesCurvedLinesMap from '@/components/PresentationComponents/Map/NodeEdgesCurvedLinesMap';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let map: L.Map;
let width: number;
let host: HTMLDivElement;
let mapElement: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
vi.mock('react-leaflet', () => ({ useMap: () => map }));
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => ({ nodesData: [], edgesData: [] }),
}));

beforeEach(() => {
  width = 1000;
  mapElement = document.createElement('div');
  host = document.createElement('div');
  document.body.append(mapElement, host);
  Object.defineProperties(mapElement, {
    clientWidth: { get: () => width },
    clientHeight: { value: 600 },
  });
  // happy-dom has no layout. Model only Leaflet's measured content/chrome;
  // GPU browser acceptance independently checks real bounds and close clicks.
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.classList.contains('leaflet-popup-content')) {
        return parseFloat(this.style.width) || 500;
      }
      if (this.classList.contains('leaflet-popup')) {
        const content = this.querySelector<HTMLElement>(
          '.leaflet-popup-content',
        );
        return (content?.offsetWidth || 0) + 46;
      }
      return 0;
    },
  );
  map = L.map(mapElement, { maxZoom: 18 }).setView([0, 0], 3);
  root = createRoot(host);
  act(() => root.render(<NodeEdgesCurvedLinesMap />));
});
afterEach(() => {
  act(() => root.unmount());
  map.remove();
  mapElement.remove();
  host.remove();
  vi.restoreAllMocks();
});

function openPopup(maxWidth = 300) {
  return L.popup({ maxWidth })
    .setLatLng([0, 0])
    .setContent(
      'Africa: 2948558 people embarked and 105070 people disembarked.',
    )
    .openOn(map);
}

test('the actual node-map lifecycle fits an open popup and restores its desktop cap after resizing', () => {
  const popup = openPopup();
  expect(popup.options.maxWidth).toBe(300);
  width = 326;
  map.invalidateSize({ pan: false });
  expect(popup.options.maxWidth).toBe(269);
  expect(popup.getElement()?.offsetWidth).toBeLessThanOrEqual(width - 10);
  expect(popup.getContent()).toContain('2948558 people embarked');
  width = 1000;
  map.invalidateSize({ pan: false });
  expect(popup.options.maxWidth).toBe(300);
  expect(map.hasLayer(popup)).toBe(true);
});

test('a popup first opened on a narrow map fits its complete bubble', () => {
  width = 326;
  map.invalidateSize({ pan: false });
  const popup = openPopup();
  expect(popup.options.maxWidth).toBe(269);
  expect(popup.getElement()?.offsetWidth).toBeLessThanOrEqual(width - 10);
});

test('a custom popup keeps its original width cap after narrow and wide resizing', () => {
  width = 240;
  map.invalidateSize({ pan: false });
  const popup = openPopup(180);
  expect(popup.options.maxWidth).toBe(180);
  width = 180;
  map.invalidateSize({ pan: false });
  expect(popup.options.maxWidth).toBe(123);
  width = 1000;
  map.invalidateSize({ pan: false });
  expect(popup.options.maxWidth).toBe(180);
});

test('unmount removes popup sizing listeners without changing a subsequently opened popup', () => {
  act(() => root.unmount());
  root = createRoot(host);
  width = 326;
  map.invalidateSize({ pan: false });
  const popup = openPopup();
  expect(popup.options.maxWidth).toBe(300);
});
