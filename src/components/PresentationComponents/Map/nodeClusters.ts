import L from 'leaflet';

import { NodeAggroutes, Weights } from '@/share/InterfaceTypesMap';

export interface PlacedNode {
  node: NodeAggroutes;
  latlng: L.LatLng;
  radius: number;
}

const CLUSTER_GAP_PX = 0;
const CLUSTER_BOX_PAD_PX = 8;

export const findNodeCluster = (
  map: L.Map,
  picked: PlacedNode,
  candidates: PlacedNode[],
): PlacedNode[] => {
  const center = map.latLngToContainerPoint(picked.latlng);
  return candidates.filter(
    (candidate) =>
      candidate === picked ||
      center.distanceTo(map.latLngToContainerPoint(candidate.latlng)) <=
        picked.radius + candidate.radius + CLUSTER_GAP_PX,
  );
};

export const clusterBounds = (
  map: L.Map,
  members: PlacedNode[],
): L.LatLngBounds => {
  const points = members.map((member) => ({
    point: map.latLngToContainerPoint(member.latlng),
    radius: member.radius,
  }));
  const left =
    Math.min(...points.map(({ point, radius }) => point.x - radius)) -
    CLUSTER_BOX_PAD_PX;
  const right =
    Math.max(...points.map(({ point, radius }) => point.x + radius)) +
    CLUSTER_BOX_PAD_PX;
  const top =
    Math.min(...points.map(({ point, radius }) => point.y - radius)) -
    CLUSTER_BOX_PAD_PX;
  const bottom =
    Math.max(...points.map(({ point, radius }) => point.y + radius)) +
    CLUSTER_BOX_PAD_PX;
  return L.latLngBounds(
    map.containerPointToLatLng([left, top]),
    map.containerPointToLatLng([right, bottom]),
  );
};

export const clusterWeights = (members: PlacedNode[]): Weights => ({
  post_disembarkation: members.reduce(
    (sum, member) => sum + (member.node.weights.post_disembarkation ?? 0),
    0,
  ),
  embarkation: members.reduce(
    (sum, member) => sum + (member.node.weights.embarkation ?? 0),
    0,
  ),
  disembarkation: members.reduce(
    (sum, member) => sum + (member.node.weights.disembarkation ?? 0),
    0,
  ),
});

export const clusterTotalNode = (members: PlacedNode[]): NodeAggroutes => ({
  id: 'cluster-total',
  data: { name: 'Total' },
  weights: clusterWeights(members),
});
