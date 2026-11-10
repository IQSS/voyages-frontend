import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);
  const [shownBaseKey, setShownBaseKey] = useState<string | null>(null);
  const fetchMapRef = useRef(fetchMap);
  fetchMapRef.current = fetchMap;
  const latestKeyRef = useRef('');
  const shownBaseKeyRef = useRef<string | null>(null);
  const baseKey = JSON.stringify([scope, request]);

  useEffect(() => {
    if (!enabled) {
      latestKeyRef.current = '';
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError(null);

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

    if (shownBaseKeyRef.current !== baseKey) {
      setRouteVoyageIndex(undefined);
      dispatch(setMapData({ nodes: [], edges: [], paths: [] }));
      dispatch(setNodesDataRegion([]));
      dispatch(setEdgesDataRegion([]));
      dispatch(setPathsData([]));
      shownBaseKeyRef.current = null;
      setShownBaseKey(null);
    }

    const key = `${baseKey}|${level}`;
    latestKeyRef.current = key;
    const cached = getCachedMapData(key);
    if (cached) {
      show(cached);
    } else {
      if (shownBaseKeyRef.current !== baseKey) setLoading(true);
      load(level)
        .then((entry) => {
          if (cancelled || latestKeyRef.current !== key) return;
          if (entry) show(entry);
          else {
            setError('Could not load map data.');
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled && latestKeyRef.current === key) {
            setError('Could not load map data.');
            setLoading(false);
          }
        });
    }

    if (prefetchLevel && prefetchLevel !== level) {
      const prefetchKey = `${baseKey}|${prefetchLevel}`;
      if (!getCachedMapData(prefetchKey)) {
        timer = setTimeout(() => {
          load(prefetchLevel)
            .then((entry) => {
              if (!cancelled && entry && latestKeyRef.current === prefetchKey)
                show(entry);
            })
            .catch(() => undefined);
        }, PREFETCH_DELAY_MS);
      }
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, level, prefetchLevel, enabled, attempt]);

  return { loading, shownBaseKey, error, retry };
};
