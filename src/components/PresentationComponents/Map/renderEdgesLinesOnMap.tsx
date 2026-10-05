import L, { LatLngExpression } from 'leaflet';

import { EDGES_MAIN_PANE } from '@/share/CONST_DATA';

const renderEdgesLinesOnMap = (
  startLatLng: LatLngExpression | null,
  endLatLng: LatLngExpression | null,
  weight: number,
  controls: number[][],
  type: string
): L.Curve | undefined => {
  const typeColor =
    type === 'transportation'
      ? 'rgb(215, 153, 250)'
      : type === 'disposition'
      ? 'rgb(246,193,60)'
      : 'rgb(96, 192, 171)';

  if (startLatLng && endLatLng && weight && controls) {
    const startControlLatLng: number[] = controls[0];
    const midpointControlLatLng: number[] = controls[1];
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
        color: typeColor,
        fill: false,
        weight: weight,
        stroke: true,
        pane: EDGES_MAIN_PANE,
      }
    );
    return curve;
  }

  return undefined;
};
export default renderEdgesLinesOnMap;
