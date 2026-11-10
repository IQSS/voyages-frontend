import { act } from 'react';

import { expect, test, vi } from 'vitest';

import { handleHoverMarkerCluster } from '@/components/PresentationComponents/Map/handleHoverMarkerCluster';
import { nodeTypePostDisembarkation } from '@/share/CONST_DATA';

type HoverArgs = Parameters<typeof handleHoverMarkerCluster>;
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

test.each([1, 4])(
  'PR237 standalone post-disembarkation marker describes %i people',
  (count) => {
    const node = {
      id: 'end',
      data: { name: 'Havana', lat: 23, lon: -82 },
      weights: { post_disembarkation: count },
    };
    const marker = {
      nodeId: 'end',
      getLatLng: () => ({ lat: 23, lng: -82 }),
      bindPopup: vi.fn().mockReturnThis(),
      openPopup: vi.fn().mockReturnThis(),
    };
    handleHoverMarkerCluster(
      { layer: marker } as unknown as HoverArgs[0],
      { clearLayers: vi.fn() } as unknown as HoverArgs[1],
      [],
      [node] as HoverArgs[3],
      nodeTypePostDisembarkation,
      vi.fn(),
      {} as HoverArgs[6],
    );
    expect(marker.bindPopup).toHaveBeenCalledWith(
      `<p>Havana is the final known location for ${count} enslaved ${count === 1 ? 'person' : 'people'}.</p>`,
    );
    expect(marker.openPopup).toHaveBeenCalledOnce();
  },
);

test('PR237 clustered markers retain the table popup with each location and total', async () => {
  const nodes = [
    {
      id: 'one',
      data: { name: 'Havana', lat: 23, lon: -82 },
      weights: { post_disembarkation: 4 },
    },
    {
      id: 'two',
      data: { name: 'Bahia', lat: -12, lon: -38 },
      weights: { post_disembarkation: 3 },
    },
  ];
  const marker = {
    getAllChildMarkers: () => [{ nodeId: 'one' }, { nodeId: 'two' }],
    getLatLng: () => ({ lat: 23, lng: -82 }),
    bindPopup: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
  };
  await act(async () =>
    handleHoverMarkerCluster(
      { layer: marker, propagatedFrom: marker } as unknown as HoverArgs[0],
      { clearLayers: vi.fn() } as unknown as HoverArgs[1],
      [],
      nodes as HoverArgs[3],
      nodeTypePostDisembarkation,
      vi.fn(),
      {} as HoverArgs[6],
    ),
  );
  const popup = marker.bindPopup.mock.calls[0][0] as HTMLElement;
  expect(popup.querySelector('table')).not.toBeNull();
  expect(popup.textContent).toContain('Last Known Location');
  expect(popup.textContent).toContain('Havana');
  expect(popup.textContent).toContain('Bahia');
  expect(popup.textContent).toMatch(/Total\s*7/);
});
