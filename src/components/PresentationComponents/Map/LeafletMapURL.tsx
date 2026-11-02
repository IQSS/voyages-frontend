import { useMemo, useRef } from 'react';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';

import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';
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
  mappingSpecialists,
  PLACE,
  REGION,
  AFRICANORIGINS,
  ENSLAVEDNODE,
  VOYAGESTYPE,
} from '@/share/CONST_DATA';
import {
  Filter,
  MapPropsRequest,
  FilterObjectsState,
} from '@/share/InterfaceTypes';
import {
  checkPagesRouteForEnslaved,
  checkPagesRouteForVoyages,
} from '@/utils/functions/checkPagesRoute';
import { getMapBackgroundColor } from '@/utils/functions/getMapBackgroundColor';

import { HandleZoomEvent } from './HandleZoomEvent';
import NodeEdgesCurvedLinesMap from './NodeEdgesCurvedLinesMap';
import ShowsColoredNodeOnMap from './ShowsColoredNodeOnMap';

interface LeafletMapProps {
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomLevel: number;
}

export const LeafletMapURL = ({ setZoomLevel, zoomLevel }: LeafletMapProps) => {
  const dispatch: AppDispatch = useDispatch();
  const mapRef = useRef(null);
  const { nodesData } = useSelector(
    (state: RootState) => state.getNodeEdgesAggroutesMapData,
  );
  const { voyageURLID, endpointPath: styleNamePage } = usePageRouter();
  const { styleName } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );
  const { styleNamePeople } = useSelector(
    (state: RootState) => state.getPeopleEnlavedDataSetCollection,
  );
  const { filtersObj, nameIdURL } = useSelector(
    (state: RootState) => state.getFilter,
  );
  const { varName } = useSelector(
    (state: RootState) => state.rangeSlider as FilterObjectsState,
  );

  const level = zoomLevel >= ZOOM_LEVEL_THRESHOLD ? PLACE : REGION;
  const prefetchLevel = level === REGION ? PLACE : null;

  const request: MapPropsRequest = useMemo(() => {
    const filters: Filter[] = [];
    const filterByVarName =
      filtersObj &&
      filtersObj.filter((filterItem: Filter) => filterItem.varName !== varName);
    if (voyageURLID !== ENSLAVEDNODE && voyageURLID !== VOYAGESTYPE) {
      if (nameIdURL) {
        filters.push({
          varName: nameIdURL,
          searchTerm: [Number(voyageURLID!)],
          op: 'in',
        });
      }
    }
    return { filter: [...(filterByVarName || []), ...filters] };
  }, [filtersObj, varName, voyageURLID, nameIdURL]);

  const fetchMap = (dataSend: MapPropsRequest) => {
    if (checkPagesRouteForVoyages(styleNamePage!)) {
      return dispatch(fetchVoyagesMap(dataSend)).unwrap();
    }
    if (checkPagesRouteForEnslaved(styleNamePage!)) {
      return dispatch(fetchEnslavedMap(dataSend)).unwrap();
    }
    return Promise.resolve(undefined);
  };

  const { loading, shownBaseKey } = useCachedMapData({
    scope: `url|${styleNamePage ?? ''}`,
    request,
    level,
    prefetchLevel,
    enabled: !!nameIdURL,
    fetchMap,
  });

  const map = useMap();

  map.on('zoomend', () => {
    const newZoomLevel = map.getZoom();
    setZoomLevel(newZoomLevel);
  });

  let backgroundColor = styleNamePeople;
  if (checkPagesRouteForVoyages(styleName)) {
    backgroundColor = styleName;
  }
  if (styleNamePeople === AFRICANORIGINS) {
    backgroundColor = styleNamePeople;
  }

  return (
    <div
      className="map-legend-frame"
      style={{ backgroundColor: getMapBackgroundColor(backgroundColor) }}
    >
      {loading || nodesData?.length === 0 ? (
        <div className="loading-logo">
          <img src={LOADINGLOGO} alt="loading" />
        </div>
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
