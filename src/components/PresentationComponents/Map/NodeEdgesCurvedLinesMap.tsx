/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

import L, { LatLngExpression, Marker } from 'leaflet';
import { useMap } from 'react-leaflet';
import '@/style/table-popup.scss';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { useSelector, useDispatch } from 'react-redux';

import {
  setClusterNodeKeyVariable,
  setClusterNodeValue,
} from '@/redux/getNodeEdgesAggroutesMapDataSlice';
import { RootState, AppDispatch } from '@/redux/store';
import {
  DISPOSTIONNODE,
  EDGES_ANIMATED_PANE,
  EDGES_MAIN_PANE,
  FILTER_OBJECT_KEY,
  nodeTypeOrigin,
  nodeTypePostDisembarkation,
  ORIGINATIONNODE,
  ORIGINLanguageGroupKEY,
  postDisembarkLocationKEY,
} from '@/share/CONST_DATA';
import { Filter } from '@/share/InterfaceTypes';
import { CustomMarker, EdgesAggroutes } from '@/share/InterfaceTypesMap';
import { createLogNodeValueScale } from '@/utils/functions/createLogNodeValueScale';
import { createTooltipEmbarkDiseEmbarkEdges } from '@/utils/functions/createTooltipClusterEdges';
import { getNodeColorMapVoyagesStyle } from '@/utils/functions/getNodeColorStyle';
import '@johnconnor_mulligan/leaflet.curve';
import { getNodeSize } from '@/utils/functions/getNodeSize';

import '@/style/map.scss';
import { handerRenderEdges } from './handerRenderEdges';
import { handleHoverCircleMarker } from './handleHoverCircleMarker';
import { handleHoverMarkerCluster } from './handleHoverMarkerCluster';

const NodeEdgesCurvedLinesMap = () => {
  const map = useMap();
  const dispatch: AppDispatch = useDispatch();

  const { nodesData, edgesData } = useSelector(
    (state: RootState) => state.getNodeEdgesAggroutesMapData,
  );

  const handleSetClusterKeyValue = (value: string, nodeType: string) => {
    if (nodeType === nodeTypeOrigin) {
      dispatch(setClusterNodeKeyVariable(ORIGINLanguageGroupKEY));
      dispatch(setClusterNodeValue(value));
    } else if (nodeType === nodeTypePostDisembarkation) {
      dispatch(setClusterNodeKeyVariable(postDisembarkLocationKEY));
      dispatch(setClusterNodeValue(value));
    }
    const existingFilterObjectString = localStorage.getItem(FILTER_OBJECT_KEY);
    let existingFilterObject: any = {};

    if (existingFilterObjectString) {
      existingFilterObject = JSON.parse(existingFilterObjectString);
    }
    const existingFilters: Filter[] = existingFilterObject.filter || [];
    const existingFilterIndex = existingFilters.findIndex(
      (filter) => filter.varName === ORIGINLanguageGroupKEY,
    );
    if (existingFilterIndex !== -1) {
      existingFilters[existingFilterIndex].searchTerm = [value];
    } else {
      const newFilter: Filter = {
        varName: ORIGINLanguageGroupKEY,
        searchTerm: [value!],
        op: 'in',
      };
      existingFilters.push(newFilter);
    }

    if (nodeType) {
      const filterObjectUpdate = {
        filter: existingFilters,
      };

      const filterObjectString = JSON.stringify(filterObjectUpdate);
      localStorage.setItem('filterObject', filterObjectString);
    }
  };

  const updateEdgesAndNodes = () => {
    [
      [EDGES_MAIN_PANE, '390'],
      [EDGES_ANIMATED_PANE, '395'],
    ].forEach(([name, zIndex]) => {
      if (!map.getPane(name)) {
        const pane = map.createPane(name);
        pane.style.zIndex = zIndex;
        map.getPanes().overlayPane.before(pane);
      }
    });

    const hiddenEdgesLayer = L.layerGroup().addTo(map);

    map.eachLayer((layer) => {
      if (
        layer instanceof L.Curve ||
        layer instanceof L.MarkerClusterGroup ||
        layer instanceof L.CircleMarker ||
        layer instanceof L.Marker
      ) {
        map.removeLayer(layer);
      }
    });
    const nodeLogValueScale = createLogNodeValueScale(nodesData);

    const hiddenEdges = (edgesData ?? []).filter(
      (edge: EdgesAggroutes) =>
        edge.type === ORIGINATIONNODE || edge.type === DISPOSTIONNODE,
    );

    const edgesToRender = edgesData?.filter(
      (edge: EdgesAggroutes) =>
        edge.type !== ORIGINATIONNODE && edge.type !== DISPOSTIONNODE,
    );

    // Render edges when page rendering
    handerRenderEdges(edgesToRender, nodesData, map);

    //  Render originMarkerCluster
    const originMarkerCluster = L.markerClusterGroup({
      zoomToBoundsOnClick: false,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      iconCreateFunction: function (cluster) {
        const childCount = cluster.getChildCount();
        let c = ' marker-cluster-';
        if (childCount < 10) {
          c += 'large';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'small';
        }
        const backgroundColor = 'rgb(96, 192, 171)';
        const borderColor = 'black';
        const opacity = 0.9;
        return new L.DivIcon({
          html:
            '<div style="background-color:' +
            backgroundColor +
            '; border: 1px solid ' +
            borderColor +
            '; opacity: ' +
            opacity +
            ';"></div>',
          className: 'marker-cluster' + c,
          iconSize: new L.Point(50, 50, true),
        });
      },
    }).on('clustermouseover', async (event) => {
      handleHoverMarkerCluster(
        event,
        hiddenEdgesLayer,
        hiddenEdges,
        nodesData,
        nodeTypeOrigin,
        handleSetClusterKeyValue,
        map,
      );
    });

    // Render postDisembarkationsMarkerCluster
    const postDisembarkationsMarkerCluster = L.markerClusterGroup({
      zoomToBoundsOnClick: false,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      iconCreateFunction: function (cluster) {
        const childCount = cluster.getChildCount();
        let c = ' marker-cluster-';
        if (childCount < 10) {
          c += 'large';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'small';
        }

        const backgroundColor = 'rgb(246,193,60)';
        const borderColor = 'black';
        const opacity = 0.9;
        return new L.DivIcon({
          html:
            '<div style="background-color:' +
            backgroundColor +
            '; border: 1px solid ' +
            borderColor +
            '; opacity: ' +
            opacity +
            ';"></div>',
          className: 'marker-cluster' + c,
          iconSize: new L.Point(40, 40, true),
        });
      },
    })
    .on('clustermouseover', (event) => {
      handleHoverMarkerCluster(
        event,
        hiddenEdgesLayer,
        hiddenEdges,
        nodesData,
        nodeTypePostDisembarkation,
        handleSetClusterKeyValue,
        map,
      );
    })
    .on('mouseover', (event) => {
      handleHoverMarkerCluster(
        event,
        hiddenEdgesLayer,
        hiddenEdges,
        nodesData,
        nodeTypePostDisembarkation,
        handleSetClusterKeyValue,
        map,
      );
    });

    const originNodeMarkersMap = new Map<string, Marker>();
    nodesData.forEach((node) => {
      const { data, weights, id: nodeID } = node;
      const { lat, lon } = data;
      const { origin, post_disembarkation, disembarkation, embarkation } =
        weights;
   
      const size = getNodeSize(node);

      const nodeColor = getNodeColorMapVoyagesStyle(node);
   
      const embarkDisembarkTotal = (embarkation ?? 0) + (disembarkation ?? 0);
      const nodeOpacity =
        embarkDisembarkTotal > 0
          ? 0.5 + 0.35 * ((embarkation ?? 0) / embarkDisembarkTotal)
          : 0.9;

      const logSize = nodeLogValueScale(size);
      const radius = isNaN(logSize) ? 0 : (logSize as number);
      if (lat && lon) {
        const latlon: LatLngExpression = [lat, lon];
        const circleMarker = new CustomMarker(
          latlon,
          radius,
          radius === 0 ? 'transparent' : '#000000',
          radius === 0 ? 'transparent' : nodeColor,
          nodeOpacity,
          nodeID,
        );

        const originMarker = L.marker(latlon);

        if (disembarkation !== 0 || embarkation !== 0) {
          const popupContent = createTooltipEmbarkDiseEmbarkEdges(node);
          circleMarker.bindPopup(popupContent).bringToFront();
          circleMarker.on('mouseover', (event) => {
            circleMarker.openPopup();
            handleHoverCircleMarker(
              event,
              hiddenEdgesLayer,
              edgesData,
              nodesData,
              node,
              originNodeMarkersMap,
              originMarkerCluster,
              handleSetClusterKeyValue,
              map,
            );
          });
          circleMarker.addTo(map).bringToFront();
        } else if (origin && origin > 0) {
          const popupContent = createTooltipEmbarkDiseEmbarkEdges(node);
          circleMarker.bindPopup(popupContent).bringToFront();
          circleMarker.on('mouseover', (event) => {
            circleMarker.openPopup();
            handleHoverCircleMarker(
              event,
              hiddenEdgesLayer,
              edgesData,
              nodesData,
              node,
              originNodeMarkersMap,
              originMarkerCluster,
              handleSetClusterKeyValue,
              map,
            );
          });
          originNodeMarkersMap.set(nodeID, originMarker);
          originMarkerCluster.addLayer(circleMarker).bringToFront();
          originMarkerCluster.addLayer(originMarker).bringToFront();
        } else if (
          Number(post_disembarkation) &&
          Number(post_disembarkation) > 0 &&
          disembarkation === 0 &&
          embarkation === 0
        ) {
          postDisembarkationsMarkerCluster
            .addLayer(circleMarker)
            .bringToFront();
        }
      }
    });

    if (map) {
      map.addLayer(hiddenEdgesLayer);
      map.addLayer(originMarkerCluster);
      map.addLayer(postDisembarkationsMarkerCluster);
    }
  };

  useEffect(() => {
    if (map) {
      updateEdgesAndNodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesData, edgesData, map]);

  return null;
};

export default NodeEdgesCurvedLinesMap;
