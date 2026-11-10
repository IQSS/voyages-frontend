/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useMemo } from 'react';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';

import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';
import { fetchEstimatesMap } from '@/fetch/estimateFetch/fetchEstimatesMap';
import { fetchEnslavedMap } from '@/fetch/pastEnslavedFetch/fetchEnslavedMap';
import { fetchVoyagesMap } from '@/fetch/voyagesFetch/fetchVoyagesMap';
import { useCachedMapData } from '@/hooks/useCachedMapData';
import { usePageRouter } from '@/hooks/usePageRouter';
import { AppDispatch, RootState } from '@/redux/store';
import '@/style/map.scss';
import {
  MAP_CENTER,
  MAXIMUM_ZOOM,
  MINIMUM_ZOOM,
  ZOOM_LEVEL_THRESHOLD,
  ZOOM_LEVEL_REGION_ESTIMATE_MIN,
  mappingSpecialists,
  PLACE,
  ESTIMATES,
  REGION,
  broadRegion,
} from '@/share/CONST_DATA';
import { MapPropsRequest } from '@/share/InterfaceTypes';
import {
  checkPagesRouteForEnslaved,
  checkPagesRouteForVoyages,
  checkPagesRouteMapEstimates,
} from '@/utils/functions/checkPagesRoute';
import { filtersDataSend } from '@/utils/functions/filtersDataSend';
import { getColorBackgroundHeader } from '@/utils/functions/getColorStyle';

import { HandleZoomEvent } from './HandleZoomEvent';
import NodeEdgesCurvedLinesMap from './NodeEdgesCurvedLinesMap';
import ShowsColoredNodeOnMap from './ShowsColoredNodeOnMap';

interface LeafletMapProps {
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomLevel: number;
}

export const LeafletMap = ({ setZoomLevel, zoomLevel }: LeafletMapProps) => {
  const dispatch: AppDispatch = useDispatch();
  const mapRef = useRef(null);
  const { nodesData, clusterNodeKeyVariable, clusterNodeValue } = useSelector(
    (state: RootState) => state.getNodeEdgesAggroutesMapData,
  );
  const {
    styleName: styleNameRoute,
    nodeTypeURL,
    currentBlockName,
  } = usePageRouter();
  const { filtersObj } = useSelector((state: RootState) => state.getFilter);
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );

  const isEstimates = styleNameRoute === ESTIMATES;
  const level = isEstimates
    ? zoomLevel >= ZOOM_LEVEL_REGION_ESTIMATE_MIN
      ? REGION
      : broadRegion
    : zoomLevel >= ZOOM_LEVEL_THRESHOLD
      ? PLACE
      : REGION;
  const prefetchLevel = isEstimates ? null : level === REGION ? PLACE : null;

  const filters = useMemo(
    () =>
      filtersDataSend(
        filtersObj,
        styleNameRoute!,
        clusterNodeKeyVariable,
        clusterNodeValue,
      ),
    [filtersObj, styleNameRoute, clusterNodeKeyVariable, clusterNodeValue],
  );

  const request: MapPropsRequest = useMemo(() => {
    const base: MapPropsRequest = {
      filter: filters?.map(({ ...rest }) => rest) || [],
    };
    if (inputSearchValue) base.global_search = inputSearchValue;
    return base;
  }, [filters, inputSearchValue]);

  const fetchMap = (dataSend: MapPropsRequest) => {
    if (checkPagesRouteForVoyages(styleNameRoute! || nodeTypeURL!)) {
      return dispatch(fetchVoyagesMap(dataSend)).unwrap();
    }
    if (checkPagesRouteForEnslaved(styleNameRoute!)) {
      return dispatch(fetchEnslavedMap(dataSend)).unwrap();
    }
    if (checkPagesRouteMapEstimates(styleNameRoute!)) {
      return dispatch(fetchEstimatesMap(dataSend)).unwrap();
    }
    return Promise.resolve(undefined);
  };

  const { loading, shownBaseKey, error, retry } = useCachedMapData({
    scope: `${styleNameRoute ?? ''}|${nodeTypeURL ?? ''}`,
    request,
    level,
    prefetchLevel,
    enabled: currentBlockName !== 'tables' && currentBlockName !== 'timeline',
    fetchMap,
  });

  const map = useMap();

  map.on('zoomend', () => {
    const newZoomLevel = map.getZoom();
    setZoomLevel(newZoomLevel);
  });

  return (
    <div
      className="map-legend-frame"
      style={{ backgroundColor: getColorBackgroundHeader(styleNameRoute!) }}
    >
      {error ? (
        <div role="alert">
          {error} <button type="button" onClick={retry}>Retry</button>
        </div>
      ) : loading ? (
        <div className="loading-logo">
          <img src={LOADINGLOGO} alt="loading" />
        </div>
      ) : nodesData?.length === 0 ? (
        <div role="status">No map results.</div>
      ) : (
        <>
          <MapContainer
            ref={mapRef}
            center={MAP_CENTER}
            zoom={zoomLevel}
            className="lealfetMap-container"
            maxZoom={MAXIMUM_ZOOM}
            minZoom={MINIMUM_ZOOM}
            zoomSnap={0.25}
            zoomDelta={1}
            attributionControl={false}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <HandleZoomEvent
              setZoomLevel={setZoomLevel}
              zoomLevel={zoomLevel}
              styleRouteName={styleNameRoute}
            />
            <TileLayer url={mappingSpecialists} />
            <NodeEdgesCurvedLinesMap fitKey={shownBaseKey} />
          </MapContainer>
          <ShowsColoredNodeOnMap />
        </>
      )}
    </div>
  );
};
