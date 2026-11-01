import { VoyageMapping } from '@/share/InterfaceTypesMap';

export interface RouteVoyageIndex {
  edges: Map<string, string[]>;
  nodes: Map<string, string[]>;
}

let currentIndex: RouteVoyageIndex | undefined;

const addId = (index: Map<string, string[]>, key: string, voyageId: string) => {
  const ids = index.get(key);
  if (ids) ids.push(voyageId);
  else index.set(key, [voyageId]);
};

export const buildRouteVoyageIndex = (
  voyageMappings?: Record<string, VoyageMapping>,
): RouteVoyageIndex | undefined => {
  if (!voyageMappings) return undefined;
  const index: RouteVoyageIndex = { edges: new Map(), nodes: new Map() };
  for (const [voyageId, mapping] of Object.entries(voyageMappings)) {
    for (const [source, target] of mapping.edges) {
      addId(index.edges, `${source}|${target}`, voyageId);
    }
    for (const nodeId of mapping.nodes) {
      addId(index.nodes, nodeId, voyageId);
    }
  }
  return index;
};

export const setRouteVoyageIndex = (index?: RouteVoyageIndex) => {
  currentIndex = index;
};

export const getRouteVoyageIds = (source: string, target: string): string[] =>
  currentIndex?.edges.get(`${source}|${target}`) ?? [];

export const getNodeVoyageIds = (nodeId: string): string[] =>
  currentIndex?.nodes.get(nodeId) ?? [];
