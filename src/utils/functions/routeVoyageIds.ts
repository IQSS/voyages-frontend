import { VoyageMapping } from '@/share/InterfaceTypesMap';

export type RouteVoyageIndex = Map<string, string[]>;

let currentIndex: RouteVoyageIndex | undefined;

export const buildRouteVoyageIndex = (
  voyageMappings?: Record<string, VoyageMapping>,
): RouteVoyageIndex | undefined => {
  if (!voyageMappings) return undefined;
  const index: RouteVoyageIndex = new Map();
  for (const [voyageId, mapping] of Object.entries(voyageMappings)) {
    for (const [source, target] of mapping.edges) {
      const key = `${source}|${target}`;
      const ids = index.get(key);
      if (ids) ids.push(voyageId);
      else index.set(key, [voyageId]);
    }
  }
  return index;
};

export const setRouteVoyageIndex = (index?: RouteVoyageIndex) => {
  currentIndex = index;
};

export const getRouteVoyageIds = (source: string, target: string): string[] =>
  currentIndex?.get(`${source}|${target}`) ?? [];
