import { useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import {
  setEdgesDataRegion,
  setHasFetchedRegion,
  setMapData,
  setNodesDataRegion,
  setPathsData,
} from '@/redux/getNodeEdgesAggroutesMapDataSlice';
import { AppDispatch } from '@/redux/store';
import { MapPropsRequest } from '@/share/InterfaceTypes';
import { AggroutesData } from '@/share/InterfaceTypesMap';
import {
  getCachedMapData,
  loadMapData,
  MapCacheEntry,
} from '@/utils/functions/mapDataCache';
import { setRouteVoyageIndex } from '@/utils/functions/routeVoyageIds';

interface UseCachedMapDataOptions {
  scope: string;
  request: MapPropsRequest;
  level: string;
  prefetchLevel?: string | null;
  enabled: boolean;
  fetchMap: (dataSend: MapPropsRequest) => Promise<AggroutesData | undefined>;
}

const PREFETCH_DELAY_MS = 3000;

export const useCachedMapData = ({
  scope,
  request,
  level,
  prefetchLevel,
  enabled,
  fetchMap,
}: UseCachedMapDataOptions) => {
  const dispatch: AppDispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [shownBaseKey, setShownBaseKey] = useState<string | null>(null);
  const fetchMapRef = useRef(fetchMap);
  fetchMapRef.current = fetchMap;
  const latestKeyRef = useRef('');
  const shownBaseKeyRef = useRef<string | null>(null);
  const baseKey = JSON.stringify([scope, request]);

  useEffect(() => {
    if (!enabled) return;

    const load = (zoomlevel: string) =>
      loadMapData(`${baseKey}|${zoomlevel}`, () =>
        fetchMapRef.current({ ...request, zoomlevel }),
      );

    const show = (entry: MapCacheEntry) => {
      setRouteVoyageIndex(entry.routeVoyageIndex);
      dispatch(setMapData(entry.mapData));
      dispatch(setNodesDataRegion(entry.nodes));
      dispatch(setEdgesDataRegion(entry.edges));
      dispatch(setPathsData(entry.paths));
      dispatch(setHasFetchedRegion(false));
      shownBaseKeyRef.current = baseKey;
      setShownBaseKey(baseKey);
      setLoading(false);
    };

    const key = `${baseKey}|${level}`;
    latestKeyRef.current = key;
    const cached = getCachedMapData(key);
    if (cached) {
      show(cached);
    } else {
      if (shownBaseKeyRef.current !== baseKey) setLoading(true);
      load(level)
        .then((entry) => {
          if (latestKeyRef.current !== key) return;
          if (entry) show(entry);
          else setLoading(false);
        })
        .catch(() => {
          if (latestKeyRef.current === key) setLoading(false);
        });
    }

    if (!prefetchLevel || prefetchLevel === level) return;
    const prefetchKey = `${baseKey}|${prefetchLevel}`;
    if (getCachedMapData(prefetchKey)) return;
    const timer = setTimeout(() => {
      load(prefetchLevel)
        .then((entry) => {
          if (entry && latestKeyRef.current === prefetchKey) show(entry);
        })
        .catch(() => undefined);
    }, PREFETCH_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, level, prefetchLevel, enabled]);

  return { loading, shownBaseKey };
};
