import L from 'leaflet';

export class CustomMarker extends L.CircleMarker {
  nodeId: string;
  constructor(
    latlng: L.LatLngExpression,
    radius: number,
    color: string,
    fillColor: string,
    fillOpacity: number,
    nodeId: string,
  ) {
    super(latlng, {
      radius: radius,
      weight: 1,
      color: color,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
    });
    this.nodeId = nodeId;
  }
}
export interface VoyageMapping {
  nodes: string[];
  edges: [source: string, target: string][];
}
export interface AggroutesData {
  edges: EdgesAggroutes[];
  nodes: NodeAggroutes[];
  paths: PathsAggroutes[];
  voyage_mappings?: Record<string, VoyageMapping>;
}
export interface NodeAggroutes {
  data: DataAggroutes;
  id: string;
  weights: Weights;
}

export interface DataAggroutes {
  lat?: number;
  lon?: number;
  name?: string;
  uuid?: string;
  val?: number;
  tags?: string[];
}

export interface Weights {
  disembarkation?: number;
  embarkation?: number;
  origin?: number;
  post_disembarkation: number;
}
export interface EdgesAggroutes {
  controls: number[][];
  source: string;
  target: string;
  type: string;
  weight: number;
}
export type LatLng = [number, number];
export interface EdgesAggroutedSourceTarget extends EdgesAggroutes {
  sourceLatlng: LatLng;
  targetLatlng: LatLng;
  controls: number[][];
  weight: number;
}
export interface PathsAggroutes {
  path: any[];
  weight: number;
}
export interface Dispositions {
  s: string;
  t: string;
  w: number;
}
export interface Originations {
  s: string;
  t: string;
  w: number;
}
export interface Transportation {
  s: string;
  t: string;
  w: number;
}

export interface PathOptions {
  color: string;
}

export interface PolylineMapProps {
  transportation: Transportation[];
  disposition?: Dispositions[];
  origination?: Originations[];
  nodesData: NodeAggroutes[];
}

export interface NodeMarkerMapProps {
  nodesData: NodeAggroutes[];
}

export interface InitialStateNodeEdgesAggroutesMapData {
  mapData: AggroutesData;
  edgesData: EdgesAggroutes[];
  nodesData: NodeAggroutes[];
  pathsData: PathsAggroutes[];
  hasFetchedRegion: boolean;
  clusterNodeKeyVariable: string;
  clusterNodeValue: string;
}
export type CurveOptions = {
  dashArray?: string;
  fill?: boolean;
  weight?: number;
  color?: string;
  opacity?: number;
  stroke?: boolean;
  interactive?: boolean;
  animate?: {
    duration: number;
    iterations: number;
  };
};

export interface HandleZoomEventProps {
  setZoomLevel: (zoomLevel: number) => void;
  zoomLevel: number;
  setRegionPlace?: (value: string) => void;
  styleRouteName?: string;
}
