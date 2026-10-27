import { LatLng } from '@/share/InterfaceTypesMap';
import L, { CurveOptions } from 'leaflet';

import { EDGES_ANIMATED_PANE } from '@/share/CONST_DATA';

const renderEdgesAnimatedLinesOnMap = (
  startLatLng: LatLng,
  endLatLng: LatLng,
  weight: number,
  controls: number[][]
): L.Curve | undefined => {
  const startControlLatLng: number[] = controls[0];
  const midpointControlLatLng: number[] = controls[1];

  if (startLatLng && endLatLng && weight && controls) {
    const curve = L.curve(
      [
        'M',
        startLatLng,
        'C',
        startControlLatLng as [number, number] | [number],
        midpointControlLatLng as [number, number] | [number],
        endLatLng,
      ],
      {
        dashArray: '1 9',
        fill: false,
        weight: Math.max(weight * 0.6, 1),
        color: '#5a86dc',
        opacity: 1,
        stroke: true,
        fillColor: 'red',
        interactive: false,
        pane: EDGES_ANIMATED_PANE,
        animate: { duration: 1000, iterations: Infinity },
      } as CurveOptions
    );
    return curve;
  }

  return undefined;
};
export default renderEdgesAnimatedLinesOnMap;
