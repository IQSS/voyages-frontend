import React from 'react';

import { cleanup, render } from '@testing-library/react';
import L from 'leaflet';
import { MapContainer, useMap } from 'react-leaflet';
import { afterEach, expect, test, vi } from 'vitest';

import { LeafletMap } from '@/components/PresentationComponents/Map/LeafletMap';

let map: L.Map;
vi.mock(
  '@/components/PresentationComponents/Map/NodeEdgesCurvedLinesMap',
  () => ({
    default: function CaptureMap() {
      map = useMap();
      return null;
    },
  }),
);
vi.mock('@/components/PresentationComponents/Map/HandleZoomEvent', () => ({
  HandleZoomEvent: () => null,
}));
vi.mock(
  '@/components/PresentationComponents/Map/ShowsColoredNodeOnMap',
  () => ({
    default: () => null,
  }),
);
vi.mock('@/hooks/useCachedMapData', () => ({
  useCachedMapData: () => ({ loading: false }),
}));
vi.mock('@/hooks/usePageRouter', () => ({
  usePageRouter: () => ({
    styleName: 'trans-atlantic',
    currentBlockName: 'map',
  }),
}));
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => ({ nodesData: [{}], filtersObj: [] }),
}));

afterEach(cleanup);

test('the responsive route map can fit the Atlantic extent inside its mobile viewport', () => {
  render(
    <MapContainer center={[0, 0]} zoom={3}>
      <LeafletMap setZoomLevel={vi.fn()} zoomLevel={3} />
    </MapContainer>,
  );
  // Dimensions and extreme node positions from the 390px public map.
  Object.defineProperties(map.getContainer(), {
    clientWidth: { value: 306 },
    clientHeight: { value: 675 },
  });
  map.invalidateSize({ pan: false });
  const points: L.LatLngTuple[] = [
    [29.8, -89.56],
    [-17.56, 40.61],
  ];
  map.fitBounds(L.latLngBounds(points), { padding: [16, 16], animate: false });
  for (const position of points) {
    const pixel = map.latLngToContainerPoint(position);
    expect(pixel.x).toBeGreaterThanOrEqual(16);
    expect(pixel.x).toBeLessThanOrEqual(map.getSize().x - 16);
  }
});
