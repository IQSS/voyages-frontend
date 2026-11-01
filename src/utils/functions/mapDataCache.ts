import {
  AggroutesData,
  EdgesAggroutes,
  NodeAggroutes,
  PathsAggroutes,
} from '@/share/InterfaceTypesMap';

import { buildRouteVoyageIndex, RouteVoyageIndex } from './routeVoyageIds';

export interface MapCacheEntry {
  mapData: AggroutesData;
  nodes: NodeAggroutes[];
  edges: EdgesAggroutes[];
  paths: PathsAggroutes[];
  routeVoyageIndex?: RouteVoyageIndex;
}

const LEGACY_STORAGE_KEYS = [
  'nodesDataregion',
  'edgesDataregion',
  'nodesDataplace',
  'edgesDataplace',
  'nodesDatabroad_region',
  'edgesDatabroad_region',
];

const clearLegacyStorage = () => {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    return;
  }
};

clearLegacyStorage();

const CACHE_LIMIT = 16;
const cache = new Map<string, MapCacheEntry>();
const inflight = new Map<string, Promise<MapCacheEntry | undefined>>();

export const getCachedMapData = (key: string): MapCacheEntry | undefined => {
  const entry = cache.get(key);
  if (entry) {
    cache.delete(key);
    cache.set(key, entry);
  }
  return entry;
};

export const loadMapData = (
  key: string,
  fetcher: () => Promise<AggroutesData | undefined>,
): Promise<MapCacheEntry | undefined> => {
  const cached = getCachedMapData(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = fetcher()
    .then((response) => {
      if (!response) return undefined;
      const { voyage_mappings: voyageMappings, ...mapData } = response;
      const entry: MapCacheEntry = {
        mapData,
        nodes: mapData.nodes ?? [],
        edges: mapData.edges ?? [],
        paths: mapData.paths ?? [],
        routeVoyageIndex: buildRouteVoyageIndex(voyageMappings),
      };
      cache.set(key, entry);
      while (cache.size > CACHE_LIMIT) {
        const oldest = cache.keys().next().value as string;
        cache.delete(oldest);
      }
      return entry;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
};
