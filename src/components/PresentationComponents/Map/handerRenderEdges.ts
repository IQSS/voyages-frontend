import {
  EdgesAggroutes,
  LatLng,
  NodeAggroutes,
} from '@/share/InterfaceTypesMap';
import { createNodeDict } from '@/utils/functions/createNodeDict';
import { createLogWeihtValueScale } from '@/utils/functions/createLogNodeValueScale';
import { getEdgesSize } from '@/utils/functions/getNodeSize';
import { getRouteVoyageIds } from '@/utils/functions/routeVoyageIds';
import renderEdgesAnimatedLinesOnMap from './renderEdgesAnimatedLinesOnMap';
import renderEdgesLinesOnMap from './renderEdgesLinesOnMap';
import L from 'leaflet';

export const handerRenderEdges = (
  edgesToRender: EdgesAggroutes[],
  nodesData: NodeAggroutes[],
  map: L.Map,
  onEdgeClick?: (voyageIds: string[]) => void,
) => {
  const edgeLogValueScale = createLogWeihtValueScale(edgesToRender);
  const nodesDict = createNodeDict(nodesData);
  edgesToRender.forEach((edge) => {
    const { controls, weight, type } = edge;
    const source = nodesDict[edge?.source || 0.15];
    const target = nodesDict[edge?.target || 0.2];

    const size = getEdgesSize(edge);

    const weightEddg = size !== null ? edgeLogValueScale(size) : 0;

    if (source && target && weight) {
      const startLatLng: LatLng = [source[0], source[1]];
      const endLatLng: LatLng = [target[0], target[1]];
      const curveAnimated = renderEdgesAnimatedLinesOnMap(
        startLatLng,
        endLatLng,
        weightEddg,
        controls,
      );
      const curveLine = renderEdgesLinesOnMap(
        startLatLng,
        endLatLng,
        weightEddg,
        controls,
        type,
      );
      if (curveAnimated && curveLine) {
        curveLine.addTo(map);
        curveLine.getElement()?.setAttribute('data-voyage-route-source', edge.source);
        curveLine.getElement()?.setAttribute('data-voyage-route-target', edge.target);
        curveAnimated.addTo(map);
        const tooltipContent = () => {
          const voyageCount = onEdgeClick
            ? getRouteVoyageIds(edge.source, edge.target).length
            : 0;
          return voyageCount > 0
            ? `${weight} people transported<br/>Click to see ${voyageCount.toLocaleString()} ${voyageCount === 1 ? 'voyage' : 'voyages'}`
            : `${weight} people transported`;
        };
        const tooltip = L.tooltip({
          direction: 'top',
          permanent: false,
          opacity: 0.9,
        }).setContent(tooltipContent());

        curveLine.bindTooltip(tooltip);
        curveLine.on('mouseover', (event) => {
          tooltip.setContent(tooltipContent());
          curveLine.openTooltip();
          tooltip.setLatLng(event.latlng);
          map.closePopup();
        });
        if (onEdgeClick) {
          curveLine.on('click', (event) => {
            const voyageIds = getRouteVoyageIds(edge.source, edge.target);
            if (voyageIds.length === 0) return;
            L.DomEvent.stopPropagation(event);
            onEdgeClick(voyageIds);
          });
        }
      }
    }
  });
};
