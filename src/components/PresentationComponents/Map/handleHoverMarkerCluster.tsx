import { EdgesAggroutes, NodeAggroutes } from '@/share/InterfaceTypesMap';
import { getEdgesSize } from '@/utils/functions/getNodeSize';
import L from 'leaflet';
import { createLogNodeValueScale } from '@/utils/functions/createLogNodeValueScale';
import { nodeTypeOrigin, nodeTypePostDisembarkation } from '@/share/CONST_DATA';
import { renderEdgeClusterNodeOnMap } from './renderEdgeClusterNodeOnMap';
import { TooltipHoverTableOnNode } from './TooltipHoverTableOnNode';
import { createRoot } from 'react-dom/client';
import { getCoordinatesLatLngMap } from '@/utils/functions/getCoordinatesLatLngMap';

export function handleHoverMarkerCluster(
  event: L.LeafletEvent,
  hiddenEdgesLayer: L.LayerGroup<any>,
  hiddenEdges: EdgesAggroutes[],
  nodesData: NodeAggroutes[],
  nodeType: string,
  handleSetClusterKeyValue: (value: string, nodeType: string) => void,
  map: L.Map
) {
  hiddenEdgesLayer.clearLayers();
  const nodeLogValueScale = createLogNodeValueScale(nodesData);
  const layer = (event.propagatedFrom ?? (event as any).layer) as any;
  const isCluster = typeof layer.getAllChildMarkers === 'function';
  const clusterLatLon = layer.getLatLng();
  const clusterChildMarkers = isCluster ? layer.getAllChildMarkers() : [layer];
  const targetNodeMap = new Map<string, [NodeAggroutes, EdgesAggroutes]>();

  const nodeIdsClusters = clusterChildMarkers.map(
    (childMarker: any) => childMarker.nodeId
  );

  // Find nodeClusters Children to get data to draw edges source to target
  nodeIdsClusters.forEach((childNodeId: string) => {
    hiddenEdges
      .filter((edge) => {
        if (nodeType === nodeTypeOrigin) {
          return edge.source === childNodeId;
        } else if (nodeType === nodeTypePostDisembarkation) {
          return edge.target === childNodeId;
        }
        return false;
      })
      .forEach((edge) => {
        const nodes = nodesData.filter((node) => {
          if (nodeType === nodeTypeOrigin) {
            return node.id === edge.target;
          } else if (nodeType === nodeTypePostDisembarkation) {
            return node.id === edge.source;
          }
          return false;
        });
        for (const node of nodes) {
          targetNodeMap.set(node.id, [node, edge]);
        }
      });
  });
  const childNodesData: NodeAggroutes[] = [];

  clusterChildMarkers.forEach((childMarker: any) => {
    const childNode = nodesData.find((node) => node.id === childMarker.nodeId);
    if (childNode) {
      childNodesData.push(childNode);
    }
  });

  const popupContainer = document.createElement('center');
  popupContainer.className = 'tablePopup';
  popupContainer.style.width = '300px';
  const popupRoot = createRoot(popupContainer);
  for (const [, [node, edge]] of targetNodeMap) {
    const { lat: clusterLat, lng: clusterLng } = clusterLatLon;
    const { lat: nodeLat, lon: nodeLng } = node.data;
    const size = getEdgesSize(edge);
    const weightEdges = size !== null ? nodeLogValueScale(size) / 1.4 : 0;

    const [coordinatesStart, coordinatesEnd] = getCoordinatesLatLngMap(
      nodeType,
      clusterLat,
      clusterLng,
      nodeLat!,
      nodeLng!
    );

    renderEdgeClusterNodeOnMap(
      hiddenEdgesLayer,
      edge,
      node,
      coordinatesStart,
      coordinatesEnd,
      weightEdges,
      nodeType,
      map,
      event,
      childNodesData
    );
  }

  if (!isCluster && childNodesData.length === 1) {
    const singleNode = childNodesData[0];
    const count = Number(singleNode.weights.post_disembarkation);
    const peopleText = count === 1 ? 'person' : 'people';
    const popupText = `<p>${singleNode.data.name} is the final known location for ${count} enslaved ${peopleText}.</p>`;
    layer.bindPopup(popupText).openPopup();
  } else {
    popupRoot.render(
      <TooltipHoverTableOnNode
        nodesDatas={childNodesData}
        nodeType={nodeType}
        handleSetClusterKeyValue={handleSetClusterKeyValue}
      />
    );
    layer.bindPopup(popupContainer).openPopup();
  }
}
