/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@mui/material';
import * as d3 from 'd3';
import { LatLngBounds } from 'leaflet';
import * as L from 'leaflet';
import { GeodesicLine } from 'leaflet.geodesic';
import { MapContainer, TileLayer, useMap, SVGOverlay } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';

import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';
import CardModal from '@/components/PresentationComponents/Cards/CardModal';
import 'leaflet-easybutton';
import 'leaflet-easybutton/src/easy-button.css';
import '@/style/timelapse.scss';
import { usePageRouter } from '@/hooks/usePageRouter';
import { openCardTarget } from '@/redux/getCardFlatObjectSlice';
import { RootState } from '@/redux/store';
import {
  AFRICANORIGINS,
  MAP_CENTER,
  MAXIMUM_ZOOM,
  MINIMUM_ZOOM,
  VOYAGE,
  mappingSpecialists,
} from '@/share/CONST_DATA';
import { checkPagesRouteForVoyages } from '@/utils/functions/checkPagesRoute';
import { filtersDataSend } from '@/utils/functions/filtersDataSend';
import { getMapBackgroundColor } from '@/utils/functions/getMapBackgroundColor';
import { translationLanguagesTimelapse } from '@/utils/functions/translationLanguages';

import { HandleZoomEvent } from './HandleZoomEvent';
import TimelapseHelpDialog from './TimelapseHelpDialog';
import { AUTHTOKEN, BASEURL } from '../../../share/AUTH_BASEURL';

// TODO
// - move out the basic geometry/calculation stuff to a separate file.
// - i18n
// - use the new site's approach to searching and connect to the backend api
// - add more comments to document components

export type LatLngPathPointDeg = [lat: number, lng: number];
export type LatLngPathPointRad = [lat: number, lng: number];

const degToRad = Math.PI / 180.0;
const radToDeg = 180.0 / Math.PI;

const convertToDeg = (pt: LatLngPathPointRad): LatLngPathPointDeg => {
  const [lat, lng] = pt;
  return [lat * radToDeg, lng * radToDeg];
};

const convertToRadians = (pt: LatLngPathPointDeg): LatLngPathPointRad => {
  const [lat, lng] = pt;
  return [lat * degToRad, lng * degToRad];
};

export interface GreatCircle {
  start: LatLngPathPointRad;
  end: LatLngPathPointRad;
  centralAngle: number;
}

/**
 * 3D Cartesian vector: only used for intermediate calculations
 */
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Interpolates along a great circle arc using Spherical Linear Interpolation (SLERP)
 * for numerical stability.
 *
 * @param arc Great circle arc with start/end points and central angle
 * @param t Interpolation parameter in [0, 1], where 0 returns start and 1 returns end
 * @returns Interpolated point in radians [lat, lng]
 */
export const arcInterpolate = (
  arc: GreatCircle,
  t: number,
): LatLngPathPointRad => {
  // Clamp t to [0, 1] for safety
  t = Math.max(0, Math.min(1, t));
  // Handle trivial cases
  if (t === 0) return arc.start;
  if (t === 1) return arc.end;
  // Step 1: Convert lat/lng points to unit vectors in Cartesian space
  const v1 = latLngToCartesian(arc.start);
  const v2 = latLngToCartesian(arc.end);
  // Step 2: Use the provided central angle (more efficient than recomputing)
  const theta = arc.centralAngle;
  // Step 3: Handle special cases for numerical stability
  const EPSILON = 1e-6;
  let interpolatedVector: Vector3;
  if (theta < EPSILON) {
    // Points are nearly identical - use linear interpolation with renormalization
    // This avoids division by sin(θ) ≈ 0
    interpolatedVector = normalize(linearCombination(v1, 1 - t, v2, t));
  } else if (Math.abs(theta - Math.PI) < EPSILON) {
    // Points are nearly antipodal - geodesic is not unique
    // For practical purposes, we'll use linear interpolation through the sphere
    // and normalize (this picks one of the possible great circles)
    interpolatedVector = normalize(linearCombination(v1, 1 - t, v2, t));
  } else {
    // Step 4: General case - use SLERP formula
    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;
    interpolatedVector = linearCombination(v1, w1, v2, w2);
  }
  // Step 5: Convert back to lat/lng coordinates
  return cartesianToLatLng(interpolatedVector);
};

/**
 * Converts lat/lng coordinates to Cartesian unit vector
 * @param point [latitude, longitude] in radians
 * @returns Unit vector in Cartesian coordinates
 */
function latLngToCartesian(point: LatLngPathPointRad): Vector3 {
  const [lat, lng] = point;
  const cosLat = Math.cos(lat);
  return {
    x: cosLat * Math.cos(lng),
    y: cosLat * Math.sin(lng),
    z: Math.sin(lat),
  };
}

/**
 * Converts Cartesian unit vector to lat/lng coordinates
 * @param vector Unit vector in Cartesian coordinates
 * @returns [latitude, longitude] in radians
 */
function cartesianToLatLng(vector: Vector3): LatLngPathPointRad {
  const lat = Math.asin(clamp(vector.z, -1, 1));
  const lng = Math.atan2(vector.y, vector.x);
  return [lat, lng];
}

/**
 * Computes linear combination of two vectors: w1 * v1 + w2 * v2
 */
function linearCombination(
  v1: Vector3,
  w1: number,
  v2: Vector3,
  w2: number,
): Vector3 {
  return {
    x: w1 * v1.x + w2 * v2.x,
    y: w1 * v1.y + w2 * v2.y,
    z: w1 * v1.z + w2 * v2.z,
  };
}

/**
 * Normalizes a vector to unit length
 */
function normalize(vector: Vector3): Vector3 {
  const length = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z,
  );
  if (length === 0) {
    throw new Error('Cannot normalize zero vector');
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

/**
 * Clamps a value between min and max bounds
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes the central angle of a great circle. In the very exceptional case of
 * antipodal points or numerical errors, an exception is thrown.
 */
export const greatCircle = (
  start: LatLngPathPointDeg,
  end: LatLngPathPointDeg,
): GreatCircle | null => {
  const [sx, sy] = convertToRadians(start);
  const [ex, ey] = convertToRadians(end);
  const w = sx - ex;
  const h = sy - ey;
  // https://en.wikipedia.org/wiki/Haversine_formula
  const z =
    Math.pow(Math.sin(h / 2.0), 2) +
    Math.cos(sy) * Math.cos(ey) * Math.pow(Math.sin(w / 2.0), 2);
  const centralAngle = 2.0 * Math.asin(Math.sqrt(z));
  if (centralAngle === Math.PI || isNaN(centralAngle)) {
    return null;
  }
  return { start: [sx, sy], end: [ex, ey], centralAngle };
};

type Point2D = [x: number, y: number];

const sum = (a: Point2D, b: Point2D, bScalar = 1): Point2D => [
  a[0] + bScalar * b[0],
  a[1] + bScalar * b[1],
];

const dotProd = (a: Point2D, b: Point2D) => a[0] * b[0] + a[1] * b[1];

const normSq = (a: Point2D) => dotProd(a, a);

class AngleInfo {
  public readonly delta1: Point2D;
  public readonly delta2: Point2D;
  public readonly angle: number;

  constructor(
    public readonly center: Point2D,
    public readonly pt1: Point2D,
    public readonly pt2: Point2D,
  ) {
    const [cx, cy] = center;
    const [pt1x, pt1y] = pt1;
    const [pt2x, pt2y] = pt2;
    this.delta1 = [pt1x - cx, pt1y - cy];
    this.delta2 = [pt2x - cx, pt2y - cy];
    const n1 = normSq(this.delta1);
    const n2 = normSq(this.delta2);
    const sqrtDeltasProduct = Math.sqrt(n1 * n2);
    const dot = dotProd(this.delta1, this.delta2);
    this.angle = Math.acos(dot / sqrtDeltasProduct);
  }
}

interface SharpCornerReductionArgs {
  point: Point2D;
  path: Point2D[];
  reversed: boolean;
  maxFractionRemoved?: number;
  angleThreshold?: number;
}

/**
 * Construct a sequence that connects the given point to the path (in natural or
 * reversed orientation) by possibly jumping to a path point further from the
 * start/end to minimize sharp corners.
 */
const reduceSharpCorner = ({
  point,
  path,
  reversed,
  maxFractionRemoved = 0.25,
  angleThreshold = Math.PI * 0.15,
}: SharpCornerReductionArgs) => {
  const last = path.length - 1;
  const maxTries = Math.min(last, Math.round(path.length * maxFractionRemoved));
  let idxBest = reversed ? last : 0;
  let bestAngle = Math.PI;
  const step = reversed ? -1 : 1;
  for (let i = 0; i < maxTries; ++i) {
    const idx = reversed ? last - i : i;
    // Compute the angle with the center being the next point in the path
    // and the other two points being this candidate and the source point.
    // Example: "." represents the point and the path segments are below.
    // The algorithm should find the path's element marked with ! as the
    // first point of the path that has a small angle.
    //          .
    //            /
    //         !--
    //        /
    //       /
    //      |___
    const { angle } = new AngleInfo(path[idx + step], point, path[idx]);
    if (angle <= angleThreshold) {
      // If we found an angle below threshold, stop going further along
      // the path since we want to preserve as much of the original as
      // possible.
      idxBest = idx;
      break;
    }
    if (angle < bestAngle) {
      // Keep track of the best angle found in case we never find one
      // lower than the threshold.
      idxBest = idx;
      bestAngle = angle;
    }
  }
  // Instead of taking a direct jump from the point to the path[idxBest], our
  // approach is to produce a smooth approximation.
  const angleInfo = new AngleInfo(path[idxBest + step], point, path[idxBest]);
  const n1 = normSq(angleInfo.delta1);
  const n2 = normSq(angleInfo.delta2);
  const endTangentScalar = Math.sqrt(n1 * n2) / n2;
  const prefix: Point2D[] = new Array(9);
  for (let i = 0; i < prefix.length; ++i) {
    const scalar = (i + 1) / (prefix.length + 1);
    const v1 = sum(angleInfo.center, angleInfo.delta1, scalar);
    const v2 = sum(
      angleInfo.center,
      angleInfo.delta2,
      scalar * endTangentScalar,
    );
    const d = sum(v1, v2, -1); // d = v1 - v2
    // Using a quadratic scaling: pt = v2 + s^2 * (v1 - v2)
    const pt = sum(v2, d, scalar * scalar);
    prefix[reversed ? i : prefix.length - 1 - i] = pt;
  }
  return reversed
    ? [...path.slice(0, idxBest), ...prefix]
    : [...prefix, ...path.slice(idxBest + 1)];
};

export type InterpolatedPath = (time: number) => LatLngPathPointRad;

class MapRoute {
  private readonly _totalAngle: number;
  private readonly _arcs: ReadonlyArray<GreatCircle>;

  constructor(
    points: LatLngPathPointDeg[],
    public readonly source: string,
    public readonly destination: string,
  ) {
    const arcs = [];
    let totalAngle = 0.0;
    for (let i = 0; i < points.length - 1; ++i) {
      const arc = greatCircle(points[i], points[i + 1]);
      if (arc === null) {
        // Bad data
        this._arcs = [];
        this._totalAngle = 0;
        return;
      }
      arcs.push(arc);
      totalAngle += arc.centralAngle;
    }
    this._arcs = arcs;
    this._totalAngle = totalAngle;
  }

  /**
   * Use the approximate Earth radius to compute the total length of the route.
   */
  getLength = () => this._totalAngle * 6371;

  isValid = () => this._arcs.length > 0;

  /**
   * Creates an interpolated route with a maximum perturbation in the latitude
   * and longitude of the points.
   */
  createInterpolation = (
    perturbLat: number,
    perturbLng: number,
  ): InterpolatedPath => {
    if (this._arcs.length === 0) {
      return (_) => [0, 0];
    }
    // The interpolation works by first identifying which arc contains the
    // interpolated point. This is obtained by the prefix sum of the arc
    // lengths.
    //
    // The expected use case of the interpolation function is to be invoked
    // monotonically (e.g. f(t_1), f(t_2), ... with t_1 < t_2 < ...). We
    // optimize for this use case by creating a capture of the last arc
    // taken and starting the search from there. If this needs to change,
    // then it would be better to precompute the prefix sums and do a binary
    // search every time.
    let capture = { idxArc: 0, accAngle: 0.0, time: 0 };
    const initial = { ...capture };
    return (time) => {
      if (time < capture.time) {
        // The search has to start from zero now.
        capture = { ...initial };
      }
      const targetAngle = time * this._totalAngle;
      while (
        capture.idxArc < this._arcs.length - 1 &&
        capture.accAngle + this._arcs[capture.idxArc].centralAngle < targetAngle
      ) {
        capture.time = time;
        capture.accAngle += this._arcs[capture.idxArc].centralAngle;
        ++capture.idxArc;
      }
      const arc = this._arcs[capture.idxArc];
      const [lat, lng] = arcInterpolate(
        arc,
        (targetAngle - capture.accAngle) / arc.centralAngle,
      );
      // Apply a perturbation to the path that is smaller at the beginning
      // and at the end of the path and maximum at the middle.
      const fuzzy = time * (1.0 - time);
      return [lat + fuzzy * perturbLat, lng + fuzzy * perturbLng];
    };
  };
}

interface PortData {
  reg: number;
  path: LatLngPathPointDeg[];
  name: string;
}

interface PortCollectionData {
  src: Record<string, PortData>;
  dst: Record<string, PortData>;
}

type RegionSegments = Record<string, Record<string, LatLngPathPointDeg[]>>;

class MapRouteBuilder {
  public readonly portNames: Record<number, string>;
  private readonly cache: Record<string, MapRoute> = {};

  private static readonly invalidRoute = new MapRoute([], '', '');

  constructor(
    readonly ports: PortCollectionData,
    readonly regionSegments: RegionSegments,
  ) {
    const names: Record<number, string> = {};
    for (const [key, port] of [
      ...Object.entries(ports.src),
      ...Object.entries(ports.dst),
    ]) {
      names[parseInt(key)] = port.name;
    }
    this.portNames = names;
  }

  getRoute = (source: number, destination: number) => {
    const key = `${source}_${destination}`;
    if (this.cache[key]) {
      return this.cache[key];
    }
    // Compile route based on three segments.
    const srcPort = this.ports.src[source];
    const dstPort = this.ports.dst[destination];
    if (
      !srcPort?.path ||
      !dstPort?.path ||
      !this.regionSegments[srcPort.reg] ||
      !this.regionSegments[srcPort.reg][dstPort.reg]
    ) {
      return (this.cache[key] = MapRouteBuilder.invalidRoute);
    }
    const first = srcPort.path;
    let second = this.regionSegments[srcPort.reg][dstPort.reg];
    let third = dstPort.path;
    if (first.length === 1) {
      second = reduceSharpCorner({
        point: first[0],
        path: second,
        reversed: false,
      });
    }
    if (third.length === 1) {
      second = reduceSharpCorner({
        point: third[0],
        path: second,
        reversed: true,
      });
    }
    third = [...third].reverse();
    const path = [...first, ...second, ...third];
    return (this.cache[key] = new MapRoute(
      path,
      this.portNames[source],
      this.portNames[destination],
    ));
  };
}

interface Nation {
  code: number;
  name: string;
}

interface VoyageRoute {
  readonly id: number;
  readonly startTime: number;
  readonly animationDuration: number;
  readonly embarked: number;
  readonly disembarked: number;
  readonly shipName: string;
  readonly tonnage?: number;
  readonly flag?: Nation;
  readonly sourceRegion: number;
  readonly destinationBroadRegion: number;
  readonly route: MapRoute;
}

type InterpolatedVoyageRoute = VoyageRoute & {
  interpolatedPath: InterpolatedPath;
  geodesic: () => GeodesicLine;
};

class VoyageRouteCollection {
  readonly voyageRoutes: ReadonlyArray<InterpolatedVoyageRoute>;

  constructor(
    voyageRoutes: VoyageRoute[],
    maxLatPerturb: number,
    maxLngPerturb: number,
    public readonly nations: Record<number, Nation>,
  ) {
    // Enforce sorting by startTime, immutability, and generate randomly
    // perturbed interpolated paths for each voyage.
    this.voyageRoutes = voyageRoutes
      .filter((v) => v.route.isValid())
      .map((v) => {
        const interpolatedPath = v.route.createInterpolation(
          maxLatPerturb * (Math.random() - 0.5),
          maxLngPerturb * (Math.random() - 0.5),
        );
        let geo: GeodesicLine | null = null;
        const geodesic = () => {
          if (geo) {
            return geo;
          }
          const pts: LatLngPathPointDeg[] = new Array(64);
          for (let i = 0; i < pts.length; ++i) {
            pts[i] = convertToDeg(interpolatedPath(i / (pts.length - 1)));
          }
          return (geo = new GeodesicLine(pts));
        };
        return { ...v, interpolatedPath, geodesic };
      })
      .sort((a, b) => a.startTime - b.startTime);
  }
}

interface VoyageRoutePoint {
  readonly voyage: InterpolatedVoyageRoute;
  readonly pt: LatLngPathPointDeg;
}

interface VoyageRoutesCluster {
  readonly style: string;
  readonly voyages: Iterable<VoyageRoutePoint>;
}

const timeToYear = (time: number) => Math.floor(time / 360);

class VoyageRouteCollectionWindow {
  private readonly vs: ReadonlyArray<InterpolatedVoyageRoute>;
  private idxSearch: number;

  private static _buffer: (VoyageRoutePoint | null)[] = new Array(2048);
  private static _version: number = 0;

  public readonly time: number;

  constructor(
    voyageRoutes: ReadonlyArray<InterpolatedVoyageRoute>,
    private readonly speed: number,
    time?: number,
    idxSearch?: number,
  ) {
    this.vs = voyageRoutes;
    this.time = time ?? (this.vs.length === 0 ? 0 : this.vs[0].startTime);
    this.idxSearch = idxSearch ?? 0;
  }

  private static createStyleIterable = function* (
    blockStart: number,
    count: number,
  ): Iterable<VoyageRoutePoint> {
    const blockEnd = blockStart + count;
    const myVersion = VoyageRouteCollectionWindow._version;
    for (let i = blockStart; i < blockEnd; ++i) {
      const entry = VoyageRouteCollectionWindow._buffer[i]!;
      if (myVersion !== VoyageRouteCollectionWindow._version) {
        throw 'The iterable was consumed after it was disposed';
      }
      yield entry;
    }
  };

  advance = (delta: number) =>
    new VoyageRouteCollectionWindow(
      this.vs,
      this.speed,
      this.time + delta,
      this.idxSearch,
    );

  hasFinished = () => this.idxSearch >= this.vs.length;

  years = (): [number, number] => {
    let min: number | null = null;
    let max: number | null = null;
    for (const v of this.window()) {
      const y = timeToYear(v.startTime);
      if (!min || y < min) {
        min = y;
      }
      if (!max || y > max) {
        max = y;
      }
    }
    const winYear = timeToYear(this.time);
    return [min ?? winYear, max ?? winYear];
  };

  /**
   * This is a performance oriented, limited-capacity group-by. Yielded groups
   * are clustered by style, however, the same style may be yielded multiple
   * times if the block capacity is reached. Allocation is kept to a minimum
   * by reusing the buffer array and using Iterables.
   */
  groupByStyle = (
    renderStyles: VoyageRouteRenderStyles,
    bounds: LatLngBounds,
  ): Iterable<VoyageRoutesCluster> => {
    const generator = function* (self: VoyageRouteCollectionWindow) {
      const buffer = VoyageRouteCollectionWindow._buffer;
      if (renderStyles.styles.length > buffer.length) {
        throw Error('No way you need so many styles??');
      }
      const counts = renderStyles.styles.map((_) => 0);
      const blockSize = Math.trunc(buffer.length / counts.length);
      const source = self.window();
      const creator = VoyageRouteCollectionWindow.createStyleIterable;
      for (const voyage of source) {
        const idx = renderStyles.getStyleForVoyage(voyage);
        const blockStart = idx * blockSize;
        const fraction =
          (self.time - voyage.startTime) /
          (voyage.animationDuration * self.speed);
        const pt = convertToDeg(voyage.interpolatedPath(fraction));
        if (!bounds.contains(pt)) {
          // Skip points that do not show up inside the bounds.
          continue;
        }
        ++VoyageRouteCollectionWindow._version;
        buffer[blockStart + counts[idx]++] = { voyage, pt };
        if (counts[idx] === blockSize) {
          // A block is full, yield them all and clear the block.
          yield {
            style: renderStyles.styles[idx].style,
            voyages: creator(blockStart, blockSize),
          };
          counts[idx] = 0;
        }
      }
      // Now yield all the remaining clusters.
      for (let idx = 0; idx < counts.length; ++idx) {
        if (counts[idx] > 0) {
          yield {
            style: renderStyles.styles[idx].style,
            voyages: creator(idx * blockSize, counts[idx]),
          };
        }
      }
    };
    return generator(this);
  };

  restart = () => new VoyageRouteCollectionWindow(this.vs, this.speed);

  window = (): Iterable<InterpolatedVoyageRoute> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const generator = function* () {
      const { vs, time, speed } = self;
      const n = vs.length;
      for (let i = self.idxSearch; i < n; ++i) {
        const v = vs[i];
        if (v.startTime > time) {
          // Since the voyages are sorted, we are done iterating.
          break;
        }
        if (v.startTime + v.animationDuration * speed > time) {
          yield v;
        } else if (i === self.idxSearch) {
          // Note: we are updating our knowledge that no entry in the
          // array before idxSearch is active in the window. This is
          // the only mutable field in this class and serves for
          // improved performance.
          ++self.idxSearch;
        }
      }
    };
    return generator();
  };
}

export interface VoyageGroupStyle {
  label: string;
  style: string;
  isLeftoverGroup: boolean;
}

export interface VoyageRouteRenderStyles {
  readonly styles: readonly VoyageGroupStyle[];
  getRadiusForVoyage: (voyage: VoyageRoute) => number;
  getStyleForVoyage: (voyage: VoyageRoute) => number;
}

const UnknownLabel = 'Unknown';

const CustomShipFlagColors: Record<string, string> = {
  // colors are either mixed or adopted based on national flag colors
  'Portugal / Brazil': '#009c3b', // brazil - green
  'Great Britain': '#cf142b', // uk - red
  France: '#00209F', // france - blue
  Netherlands: '#FF4F00', // netherlands orange
  'Spain / Uruguay': '#FFC400', // spain - yellow
  'U.S.A.': '#00A0D1', // usa - blend of blue and white
  'Denmark / Baltic': '#E07A8E', // denmark mix
  Portugal: '#5D4100', // portugal mix
  Other: '#999999', // grey,
  [UnknownLabel]: '#999999', // grey
};

const createRenderStyles = (
  collection: VoyageRouteCollection,
  embarkationBaseLine: number,
  grouping: (voyage: VoyageRoute) => number,
  styling: Record<number, VoyageGroupStyle>,
): VoyageRouteRenderStyles => {
  let count = 0;
  const map: Record<number, number> = {};
  for (const v of collection.voyageRoutes) {
    const key = grouping(v);
    if (map[key] === undefined) {
      map[key] = count++;
    }
  }
  const styles: VoyageGroupStyle[] = new Array(count);
  for (const [key, idx] of Object.entries(map)) {
    styles[idx] = styling[parseInt(key)];
  }
  return {
    styles,
    getRadiusForVoyage: (v) =>
      v.embarked <= embarkationBaseLine
        ? 2
        : Math.min(9, 2 * (1.0 + Math.log2(v.embarked / embarkationBaseLine))),
    getStyleForVoyage: (voyage) => map[grouping(voyage)],
  };
};

interface CanvasAnimationProps {
  collection: VoyageRouteCollection;
  speed: number;
  renderStyles: VoyageRouteRenderStyles;
  paused: boolean;
  userStartYear: number | null;
  onWindowChange: (win: VoyageRouteCollectionWindow) => void;
}

interface Size {
  width: number;
  height: number;
}

const useMapPosition = () => {
  const map = useMap();
  const getSizeOfMap = (m: L.Map): Size => {
    const { x: width, y: height } = m.getSize();
    return { width, height };
  };
  const [bounds, setBounds] = useState<LatLngBounds>(map.getBounds());
  const [size, setSize] = useState(getSizeOfMap(map));
  useEffect(() => {
    const refreshBounds = () => setBounds(map.getBounds());
    map.on('dragend', refreshBounds);
    map.on('zoomend', refreshBounds);
    map.on('resize', () => setSize(getSizeOfMap(map)));
  }, [map]);
  return { bounds, size };
};

const CanvasAnimation = ({
  collection,
  paused,
  renderStyles,
  speed,
  userStartYear,
  onWindowChange,
}: CanvasAnimationProps) => {
  const windowRef = useRef<VoyageRouteCollectionWindow>();
  const canvasRef = useRef<CanvasRenderingContext2D | null>();
  const map = useMap();
  const { size } = useMapPosition();
  useEffect(() => {
    if (userStartYear) {
      windowRef.current = new VoyageRouteCollectionWindow(
        collection.voyageRoutes,
        speed,
        userStartYear * 360,
      );
      onWindowChange(windowRef.current);
    }
  }, [collection.voyageRoutes, onWindowChange, speed, userStartYear]);
  useEffect(() => {
    const routes = collection.voyageRoutes;
    if (routes.length === 0) {
      windowRef.current = undefined;
      return;
    }
    // Pick a good start year considering the volume of ships.
    const fullYearRange = [routes[0], routes.at(-1)!].map((r) =>
      timeToYear(r.startTime),
    );
    let defaultYearStart = 1660;
    if (
      defaultYearStart < fullYearRange[0] ||
      defaultYearStart > 0.25 * fullYearRange[0] + 0.75 * fullYearRange[1]
    ) {
      defaultYearStart = fullYearRange[0];
    }
    windowRef.current = new VoyageRouteCollectionWindow(
      collection.voyageRoutes,
      speed,
      // TODO: replace constant year
      windowRef.current?.time ?? defaultYearStart * 360,
    );
  }, [collection, speed]);
  const render = (elapsed: number) => {
    const ctx = canvasRef.current;
    let win = windowRef.current;
    if (!ctx || !win) {
      return;
    }
    // Advance the window.
    win = win.advance((elapsed * speed) / 10);
    if (win.hasFinished()) {
      // Restart
      win = win.restart();
    }
    onWindowChange(win);
    windowRef.current = win;
    // We are grouping the work so that Canvas draw operations are batched
    // (e.g. we draw several circles with the same style in one step). Our
    // grouping method also skips over points that would be outside the map
    // bounds.
    const bounds = map.getBounds();
    const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
    ctx.setTransform(1, 0, 0, 1, -topLeft.x, -topLeft.y);
    // Clear canvas before rendering frame.
    ctx.clearRect(topLeft.x, topLeft.y, ctx.canvas.width, ctx.canvas.height);
    if (paused) {
      // This is the right point to stop when paused: after clearing,
      // before drawing.
      return;
    }
    const active = win.groupByStyle(renderStyles, bounds);
    for (const { style, voyages } of active) {
      ctx.beginPath();
      ctx.fillStyle = style;
      for (const { voyage, pt } of voyages) {
        const radius = renderStyles.getRadiusForVoyage(voyage);
        const { x, y } = map.latLngToLayerPoint(pt);
        // Start a new sub-path with moveTo.
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
  };
  // Handle the animation frame requests.
  const fRef = useRef<number>(0);
  const lastTick = useRef<DOMHighResTimeStamp>(0);
  useLayoutEffect(() => {
    const frame = (now: DOMHighResTimeStamp) => {
      const elapsed = lastTick.current ? now - lastTick.current : 0;
      if (paused) {
        // Reset the last tick so that when the animation resumes, no
        // time would have elapsed.
        lastTick.current = 0;
      } else {
        // Request next frame and render current.
        lastTick.current = now;
        fRef.current = requestAnimationFrame(frame);
      }
      render(elapsed);
    };
    fRef.current = requestAnimationFrame(frame);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      fRef.current && cancelAnimationFrame(fRef.current);
    };
  }, [collection, renderStyles, speed, paused, map]);
  return (
    <canvas
      width={size.width}
      height={size.height}
      style={{ pointerEvents: 'none', position: 'relative', zIndex: 500 }}
      ref={(c) => (canvasRef.current = c?.getContext('2d'))}
    />
  );
};

interface InteractiveShipProps {
  voyage: InterpolatedVoyageRoute;
  pt: Point2D;
  radius: number;
  color: string;
  status: 'normal' | 'hovered' | 'selected';
  onClick: (voyage: InterpolatedVoyageRoute) => void;
  onHover: (voyage: InterpolatedVoyageRoute) => void;
}

const InteractiveShip = ({
  voyage,
  pt,
  radius,
  color,
  status,
  onClick,
  onHover,
}: InteractiveShipProps) => {
  const selectionRadius = Math.max(10, 5 + radius);
  return (
    <g onClick={() => onClick(voyage)} onMouseOver={() => onHover(voyage)}>
      <circle r={radius} cx={pt[0]} cy={pt[1]} fill={color} />
      <circle
        opacity={status !== 'normal' ? 1 : 0}
        r={selectionRadius}
        cx={pt[0]}
        cy={pt[1]}
        stroke={status === 'hovered' ? 'gray' : '#3388ff'}
        strokeWidth={2}
        fill="transparent"
      />
      <text
        pointerEvents="none"
        opacity={status === 'hovered' ? 1 : 0}
        x={pt[0] + selectionRadius + 4}
        y={pt[1] + selectionRadius + 4}
      >
        {voyage.shipName}
      </text>
    </g>
  );
};

interface InteractiveVoyageRoutesFrameProps {
  selected?: InterpolatedVoyageRoute;
  window: VoyageRouteCollectionWindow;
  renderStyles: VoyageRouteRenderStyles;
  onSelect: (voyage: InterpolatedVoyageRoute) => void;
}

const InteractiveVoyageRoutesFrame = ({
  selected,
  window,
  renderStyles,
  onSelect,
}: InteractiveVoyageRoutesFrameProps) => {
  const [hovered, setHovered] = useState<VoyageRoute | null>(null);
  const map = useMap();
  const { bounds } = useMapPosition();
  const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
  const children: JSX.Element[] = [];
  // Note: Do not convert the nested loop to flatMap/map functional style: the
  // groupByStyle method returns clusters that are only valid within the
  // iteration that produced it.
  const active = window.groupByStyle(renderStyles, bounds);
  let hoveredShip: JSX.Element | null = null;
  for (const { style, voyages } of active) {
    for (const { voyage, pt } of voyages) {
      const radius = renderStyles.getRadiusForVoyage(voyage);
      const { x, y } = map.latLngToLayerPoint(pt);
      const isHovered = voyage === hovered;
      const ship = (
        <InteractiveShip
          key={voyage.id}
          status={
            voyage === selected ? 'selected' : isHovered ? 'hovered' : 'normal'
          }
          voyage={voyage}
          pt={[x - topLeft.x, y - topLeft.y]}
          color={style}
          radius={radius}
          onClick={(v) => {
            setHovered(v);
            onSelect(v);
          }}
          onHover={setHovered}
        />
      );
      if (isHovered) {
        hoveredShip = ship;
      } else {
        children.push(ship);
      }
    }
  }
  if (hoveredShip) {
    // Place the hovered ship *last* as in SVG the render order is
    // sequential.
    children.push(hoveredShip);
  }
  useEffect(() => {
    const current = selected?.geodesic();
    if (current) {
      map.addLayer(current);
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      current && map.removeLayer(current);
    };
  }, [selected]);
  return (
    <SVGOverlay
      attributes={{
        class: 'timelapseSvgFrame',
        style: 'pointer-events: auto; z-index: 5500;',
        focusable: 'false',
      }}
      bounds={bounds}
    >
      {children}
    </SVGOverlay>
  );
};

interface TimelapseUIProps {
  collection: VoyageRouteCollection;
  selected?: VoyageRoute;
  years?: [number, number];
  paused: boolean;
  speed: number;
  onClearSelection: () => void;
  onPlay: () => void;
  onPause: () => void;
  onShowDetails: (selected: VoyageRoute) => void;
  onSpeedChange: (speed: number) => void;
  tanslateTimelapse: Record<string, string>;
}

const FlagNames: Record<number, string> = {
  1: 'Spain',
  2: 'Uruguay',
  3: 'Spain_Uruguay',
  4: 'Portugal',
  5: 'Brazil',
  6: 'Portugal_Brazil',
  7: 'United-Kingdom',
  8: 'Netherlands',
  9: 'United-States',
  10: 'France',
  11: 'Denmark',
  13: 'Sweden',
  14: 'Norway',
  15: 'Denmark_Baltic',
  16: 'Argentina',
  17: 'Russia',
  19: 'Mexico',
};

const TimelapseUI = ({
  collection,
  selected,
  years,
  paused,
  speed,
  onClearSelection,
  onPlay,
  onPause,
  onShowDetails,
  onSpeedChange,
  tanslateTimelapse,
}: TimelapseUIProps): React.ReactElement | any => {
  const [fullscreen, setFullscreen] = useState(false);
  const { size } = useMapPosition();
  const map = useMap();
  const handleSpeedChange = () => {
    let next = speed * 2;
    if (next > 16) {
      next = 1;
    }
    onSpeedChange(next);
    return next;
  };
  const toggleFullscreen = () => {
    if (fullscreen) {
      document.exitFullscreen();
    } else {
      map.getContainer().requestFullscreen();
    }
    setFullscreen(!fullscreen);
  };
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  useEffect(() => {
    const playPauseBtn = L.easyButton({
      states: [
        {
          stateName: 'play',
          onClick: (btn) => {
            btn.state('pause');
            onPlay();
          },
          title: 'Play',
          icon: 'fa-play',
        },
        {
          stateName: 'pause',
          onClick: (btn) => {
            btn.state('play');
            onPause();
          },
          title: 'Pause',
          icon: 'fa-pause',
        },
      ],
    });
    playPauseBtn.state(paused ? 'play' : 'pause');
    const speedLabel = (s: number) => `${s}x`;
    const speedBtn = L.easyButton({
      states: [1, 2, 4, 8, 16].map((speed) => {
        const stateName = speedLabel(speed);
        return {
          stateName,
          onClick: (btn) => {
            const next = handleSpeedChange();
            btn.state(speedLabel(next));
          },
          title: stateName,
          icon: `fa-fast-forward`,
        };
      }),
    });
    speedBtn.state(speedLabel(speed));
    const bar = L.easyBar([playPauseBtn, speedBtn]);
    map.addControl(bar);

    const helpBtn = L.easyButton(
      'fa-question-circle',
      () => {
        onPause();
        handleDialogOpen();
      },
      'Help',
    );
    map.addControl(helpBtn);

    const fullscreenBtn = L.easyButton(
      'fa-arrows-alt',
      toggleFullscreen,
      'Toggle full-screen',
    );
    map.addControl(fullscreenBtn);
    return () => {
      map.removeControl(bar);
      map.removeControl(helpBtn);
      map.removeControl(fullscreenBtn);
    };
  }, [map, paused, speed, fullscreen]);

  const flag = selected?.flag?.code ? FlagNames[selected.flag.code] : null;
  return (
    collection.voyageRoutes.length > 0 && (
      <div
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: 6,
          left: 50,
          zIndex: 600,
          width: size.width,
          height: size.height,
        }}
      >
        <div className="timelapseInfoBox" style={{ maxWidth: 'fit-content' }}>
          {years && (
            <h1>
              {years[1] - years[0] <= 1 ? years[0] : `${years[0]}-${years[1]}`}
            </h1>
          )}
        </div>
        <div className="timelapseInfoBox" style={{ width: 'fit-content' }}>
          {tanslateTimelapse.viewMovementLang} {collection.voyageRoutes.length}{' '}
          {tanslateTimelapse.slaveShips}
        </div>
        {selected && (
          <div
            className="timelapseInfoBox"
            style={{ width: '350px', pointerEvents: 'auto' }}
          >
            <h1>
              {selected.shipName}
              <span
                role="button"
                tabIndex={0}
                onClick={onClearSelection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onClearSelection();
                  }
                }}
                className="timelapseInfoBoxClose fa fa-close"
                style={{ float: 'right', cursor: 'pointer' }}
                aria-label="Close"
              ></span>
            </h1>
            {selected.flag && (
              <h2>
                {selected.flag.name}
                {flag && (
                  <img
                    src={`/flags/${flag}.png`}
                    height="24px"
                    style={{ float: 'right' }}
                    alt="timelapse"
                  />
                )}
              </h2>
            )}
            <p>
              This {selected.tonnage ? `${selected.tonnage} tons` : ''} ship
              left {selected.route.source} in {timeToYear(selected.startTime)}{' '}
              with {selected.embarked} enslaved people and arrived in{' '}
              {selected.route.destination} with {selected.disembarked}.
            </p>
            <Button
              onClick={() => {
                if (fullscreen) {
                  // The details dialog does not work in full screen.
                  toggleFullscreen();
                }
                onShowDetails(selected);
              }}
            >
              Read more
            </Button>
          </div>
        )}
        <TimelapseHelpDialog open={dialogOpen} onClose={handleDialogClose} />
      </div>
    )
  );
};

interface TimelapseAggregateChartProps {
  collection: VoyageRouteCollection;
  years?: [number, number];
  renderStyles: VoyageRouteRenderStyles;
  aggregatedField?: 'embarked' | 'disembarked';
  onYearChange: (year: number) => void;
  tanslateTimelapse: Record<string, string>;
}

interface AggregateValue {
  year: number;
  group: number;
  aggregate: number;
}

type TimelapseAggregateChartTable = Record<string, number>[];

const TimelapseAggregateChart = ({
  collection,
  renderStyles,
  years,
  aggregatedField = 'embarked',
  onYearChange,
  tanslateTimelapse,
}: TimelapseAggregateChartProps): React.ReactElement | any => {
  const svg = useRef<SVGSVGElement>(null);
  const [sortedKeys, setSortedKeys] = useState<string[]>([]);
  const { size } = useMapPosition();
  const LeftMargin = 120;
  const RightMargin = 60;
  const NormalHeight = 100;
  const VerticalMargin = 4;
  const XAxisLabelOffset = 16;
  const XAxisLineOffset = 25;
  const chartWidth = Math.max(100, size.width - 360);
  const { table, x } = useMemo(() => {
    if (collection.voyageRoutes.length === 0) {
      return { table: [], x: undefined };
    }
    // Generate the chart aggregate data.
    const startYear = timeToYear(collection.voyageRoutes[0].startTime);
    const sequence: AggregateValue[][] = [
      renderStyles.styles.map((_, group) => ({
        year: startYear,
        group,
        aggregate: 0,
      })),
    ];
    // Note: the collection is already sorted by year.
    for (const v of collection.voyageRoutes) {
      const year = timeToYear(v.startTime);
      while (startYear + sequence.length - 1 < year) {
        // Carry the aggregate over when changing years.
        const next = sequence.at(-1)!.map((item) => ({ ...item }));
        for (const agg of next) {
          agg.year = sequence.length + startYear;
        }
        sequence.push(next);
      }
      const group = renderStyles.getStyleForVoyage(v);
      const val = (sequence.at(-1)![group] ??= { year, group, aggregate: 0 });
      val.aggregate += v[aggregatedField];
    }
    const table: TimelapseAggregateChartTable = sequence.map((item) =>
      item.reduce(
        (prev, x) => ({
          ...prev,
          year: x.year,
          [renderStyles.styles[x.group].label]: x.aggregate,
        }),
        {},
      ),
    );
    const x = d3
      .scaleLinear()
      .domain([startYear, startYear + table.length])
      .range([0, chartWidth - LeftMargin - RightMargin]);
    return { table, x };
  }, [collection, renderStyles]);
  const getStyle = (key: string) =>
    renderStyles.styles.find((s) => s.label === key)?.style ?? '';

  useEffect(() => {
    if (
      table.length > 0 &&
      renderStyles.styles.length > 0 &&
      svg.current &&
      x
    ) {
      // Now we use D3.js to produce a stacked area chart. The areas correspond to
      // the aggregated field and are sorted by final value (with the special case
      // 'Other' being always placed left).
      const xAxis = d3
        .axisBottom(x)
        .ticks(20)
        .tickFormat((a) => a + '');
      const yMaxValue = Object.values(table.at(-1)!).reduce((x, y) => x + y);
      const y = d3
        .scaleLinear()
        .domain([0, yMaxValue])
        .range([
          NormalHeight - 2 * VerticalMargin - XAxisLabelOffset,
          VerticalMargin,
        ]);
      const yAxis = d3.axisRight(y).ticks(4);
      const stack = d3.stack();
      // Sort keys by total aggregated value (in the final frame). The
      // "leftover" groups (e.g. Unknown/Other) are always placed in the
      // end even if their values are larger than other groups.
      const last = table.at(-1)!;
      const getSortKey: (s: VoyageGroupStyle) => number = (s) =>
        (s.isLeftoverGroup ? 1e-9 : 1) * last[s.label];
      const sortedKeys = [...renderStyles.styles]
        .sort((a, b) => getSortKey(b) - getSortKey(a))
        .map((s) => s.label);
      stack.keys(sortedKeys);
      setSortedKeys(sortedKeys);
      const stackData = stack(table);
      // Create the root element for the chart. Note that the effect
      // clean-up function removes this element (by id).
      const MainTimelapseElementId = 'timelapse_slider';
      const root = d3.select(svg.current);
      const g = root
        .append('g')
        .attr('id', MainTimelapseElementId)
        .classed('timelapse_slider_group', true);
      const groups = g
        .selectAll('.group')
        .data(stackData)
        .enter()
        .append('g')
        .attr('class', (d: any) => `group ${d.key}`);
      const area = d3
        .area()
        .x((d: any) => x(d.data.year))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]));
      groups
        .append('path')
        .attr('class', 'area')
        .attr('d', area as any)
        .attr('transform', 'translate(' + LeftMargin + ', 0)')
        .style('pointer-events', 'none')
        .style('fill', (d: any) => getStyle(d.key));
      g.append('g')
        .attr('class', 't_axis')
        .attr(
          'transform',
          `translate(${LeftMargin},${NormalHeight - XAxisLineOffset})`,
        )
        .attr('color', 'black')
        .call(xAxis);
      g.append('g')
        .attr('class', 'aggregate_axis')
        .attr('transform', `translate(${chartWidth - RightMargin - 2},-1)`)
        .attr('color', 'black')
        .call(yAxis);
      // Add a Y-axis label.
      g.append('text')
        .attr('transform', `translate(${LeftMargin},${VerticalMargin})`)
        .attr('dy', '1em')
        .attr('class', 'timelapse-timelapse-title-label')
        .text(`${tanslateTimelapse.accumulated} (${aggregatedField})`);
      // Create mouse-over line that allows jumping to any given year in the chart.
      const hoverLine = g
        .append('g')
        .classed('timelapse_slider_x_axis_hover', true)
        .attr('id', 'timelapse_hoverline')
        .attr('transform', `translate(${LeftMargin},${RightMargin})`)
        .style('opacity', 0);
      hoverLine
        .append('rect')
        .attr('x', -1)
        .attr('width', 2)
        .attr('height', NormalHeight - XAxisLineOffset)
        .attr('fill', 'white');
      hoverLine
        .append('line')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .style('stroke-dasharray', '2, 2')
        .attr('y2', NormalHeight - XAxisLineOffset);
      root.on('mousemove', (e) => {
        const { offsetX } = e;
        if (offsetX >= LeftMargin && offsetX <= chartWidth - RightMargin) {
          hoverLine
            .style('opacity', '0.8')
            .attr('transform', `translate(${offsetX},0)`);
        } else {
          hoverLine.style('opacity', 0);
        }
      });
      root.on('click', (e) => {
        const { offsetX } = e;
        if (offsetX >= LeftMargin && offsetX <= chartWidth - RightMargin) {
          onYearChange(x.invert(offsetX - LeftMargin));
        }
      });
      return () => document.getElementById(MainTimelapseElementId)?.remove();
    }
  }, [table, size, svg]);
  useEffect(() => {
    if (!years || !svg.current || !x) {
      return;
    }
    const sliderId = 'timelapse_slider_id';
    d3.select(svg.current)
      .select('g')
      .append('rect')
      .classed('timelapse_slider_x_axis_bar', true)
      .attr('id', sliderId)
      .attr('x', LeftMargin + x(years[0]))
      .attr('width', x(years[1] + 1) - x(years[0]))
      .attr('height', NormalHeight - XAxisLineOffset)
      .style('fill', 'black')
      .style('opacity', '0.7');
    return () => document.getElementById(sliderId)?.remove();
  }, [years]);
  const handleHighlight = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
    ) => {
      e.currentTarget?.style.setProperty('opacity', '0.9');
    },
    [],
  );
  const handleLeave = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
    ) => {
      e.currentTarget.style.setProperty('opacity', '0.4');
      document
        .getElementById('timelapse_hoverline')
        ?.style.setProperty('opacity', '0');
    },
    [],
  );
  return (
    collection.voyageRoutes.length > 0 && (
      <div
        className="timelapseInfoBox"
        onFocus={handleHighlight}
        onMouseOver={handleHighlight}
        onMouseLeave={handleLeave}
        onBlur={handleLeave}
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 610,
          opacity: 0.4,
          paddingBottom: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: `${LeftMargin - 4}px`,
            marginRight: '3px',
            maxHeight: NormalHeight,
            overflowY: 'scroll',
            overflowX: 'hidden',
          }}
        >
          <ul>
            {sortedKeys.map((key) => (
              <li
                key={key}
                style={{ fontWeight: 'bold', color: getStyle(key) }}
              >
                {key}
              </li>
            ))}
          </ul>
        </div>
        <svg width={chartWidth} height={NormalHeight} ref={svg}></svg>
      </div>
    )
  );
};

/**
 * TODO: remove this once we can use the new API
 */
interface OBSOLETE_APIVoyageEntry {
  voyage_id: number;
  src: number;
  dst: number;
  regsrc: number;
  bregsrc: number;
  regdst: number;
  bregdst: number;
  embarked: number;
  disembarked: number;
  year: number;
  month: number;
  ship_ton: number;
  nat_id: number;
  ship_name: string;
}

const rndInteger = (max: number) => Math.round(Math.random() * max);

const OBSOLETE_legacyToVoyageRoute = (
  routeBuilder: MapRouteBuilder,
  nations: Record<number, Nation>,
  entry: OBSOLETE_APIVoyageEntry,
): VoyageRoute => {
  // The start time is expressed in "days" elapsed, however since we not
  // always have a month available on record, we use a random value to better
  // distribute
  const { year, month, embarked, disembarked } = entry;
  const startTime =
    year * 360 +
    (month >= 1 && month <= 12
      ? (month - 1) * 30 + rndInteger(30)
      : rndInteger(360));
  // The animation duration is now randomly generated. Our time scale for the
  // routes are in "days", and an entire year in the timelapse goes relatively
  // quickly, hence the duration needs to be somewhat large otherwise the
  // ships would barely show up in the animation.
  const animationDuration = 180 + rndInteger(120);
  return {
    id: entry.voyage_id,
    startTime,
    embarked,
    disembarked,
    animationDuration,
    shipName: entry.ship_name,
    flag: nations[entry.nat_id],
    sourceRegion: entry.regsrc,
    destinationBroadRegion: entry.bregdst,
    route: routeBuilder.getRoute(entry.src, entry.dst),
  };
};

const builders: Record<string, MapRouteBuilder> = {};

const useMapRouteBuilder = (network: string) => {
  const [routeBuilder, setRouteBuilder] = useState<MapRouteBuilder | null>(
    null,
  );
  useEffect(() => {
    // Fetch and keep cached the data that does not change with the filter.
    const fetchData = async (networkName: string) => {
      const res = await fetch(
        `${BASEURL}/timelapse/get-compiled-routes/?networkName=${networkName}`,
        {
          headers: { Authorization: AUTHTOKEN },
        },
      );
      const { ports, routes: regionSeg } = await res.json();
      const b = (builders[networkName] = new MapRouteBuilder(ports, regionSeg));
      setRouteBuilder(b);
    };
    const current = builders[network];
    if (current) {
      setRouteBuilder(current);
    } else if (current === undefined) {
      setRouteBuilder(null);
      // Set to null while fetching in the background to avoid multiple
      // hits to the API endpoint.
      builders[network] = null!;
      fetchData(network);
    }
  }, [network]);
  return routeBuilder;
};

const useFilteredVoyageRoutes = () => {
  const queryRef = useRef<string>('');
  const abortController = useRef<AbortController>();
  const emptyCol = new VoyageRouteCollection([], 0, 0, {});
  const { styleName } = usePageRouter();
  let network = styleName ?? 'trans';
  // TODO: the API should have network names that correspond to the usage in
  // the front-end.
  if (network.startsWith('trans')) {
    network = 'trans';
  } else {
    network = 'intra';
  }
  const routeBuilder = useMapRouteBuilder(network);
  const [nations, setNations] = useState<Record<string, Nation> | null>(null);
  const [collection, setCollection] = useState<VoyageRouteCollection>(emptyCol);
  useEffect(() => {
    // Fetch and keep cached the data that does not change with the filter.
    const fetchNations = async () => {
      const res = await fetch(`${BASEURL}/timelapse/nations/`, {
        headers: { Authorization: AUTHTOKEN },
      });
      const nationsSource = await res.json();
      setNations(
        (Object.values(nationsSource) as Nation[]).reduce<
          Record<string, Nation>
        >((prev, item) => ({ ...prev, [item.code]: item }), {}),
      );
    };
    fetchNations();
  }, []);
  const { filtersObj } = useSelector((state: RootState) => state.getFilter);
  const filters = useMemo(
    () => filtersDataSend(filtersObj, styleName!),
    [filtersObj, styleName],
  );

  // NOTE: We use a dependency on the stringified filters because the
  // filtersDataSend function returns a new array every time.
  const filter = useMemo(() => {
    return filters === undefined
      ? undefined
      : filters!.map((filter) => {
          const { ...neededPartOfFilter } = filter;
          return neededPartOfFilter;
        });
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    const fetchVoyages = async () => {
      if (!routeBuilder || !nations) {
        return;
      }
      // Use our reference fields to ensure:
      // 1) That we do not submit two identical queries if the filter
      //    array was changed but not its values.
      // 2) That if the filter changes while the request is in-flight,
      //    when it returns, we try to abort the previous fetch and ignore
      //    the return value rather than having a race-condition decide
      //    the result set.
      const body = JSON.stringify({ filter });
      if (queryRef.current === body) {
        return;
      }
      queryRef.current = body;
      if (abortController.current) {
        abortController.current.abort();
      }
      const controller = new AbortController();
      abortController.current = controller;
      const voyagesRes = await fetch(`${BASEURL}/timelapse/records/`, {
        method: 'POST',
        headers: {
          Authorization: AUTHTOKEN,
          'Content-Type': 'application/json',
        },
        body,
        signal: controller.signal,
      });
      const data: OBSOLETE_APIVoyageEntry[] = await voyagesRes.json();
      if (queryRef.current === body) {
        const voyages = (data as OBSOLETE_APIVoyageEntry[]).map((v) =>
          OBSOLETE_legacyToVoyageRoute(routeBuilder, nations, v),
        );
        const fuzzyMultiplier = network === 'trans' ? 1.0 : 0.1;
        setCollection(
          new VoyageRouteCollection(
            voyages,
            fuzzyMultiplier * 0.3,
            fuzzyMultiplier * 0.2,
            nations,
          ),
        );
      }
    };
    setCollection(emptyCol);
    fetchVoyages();
  }, [filter, routeBuilder, nations]);
  return collection;
};

export interface TimelapseMapProps {
  renderStyles: VoyageRouteRenderStyles;
  collection: VoyageRouteCollection;
  initialSpeed: number;
  tanslateTimelapse: Record<string, string>;
}

export const VoyagesTimelapseMap = () => {
  const collection = useFilteredVoyageRoutes();
  const [renderStyles, setStyles] = useState<VoyageRouteRenderStyles | null>(
    null,
  );
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const tanslateTimelapse = translationLanguagesTimelapse(languageValue);

  useEffect(() => {
    const color = d3
      .scaleOrdinal()
      .domain([...Object.keys(collection.nations), UnknownLabel])
      .range(d3.schemePaired) as (key: string) => string;
    const styles = Object.values(collection.nations).reduce<
      Record<number, VoyageGroupStyle>
    >(
      (prev, nat) => ({
        ...prev,
        [nat.code]: {
          label: nat.name,
          style: CustomShipFlagColors[nat.name] ?? color(nat.code + ''),
          isLeftoverGroup: nat.name === 'Other',
        },
      }),
      {},
    );
    styles[-1] = {
      label: UnknownLabel,
      style: CustomShipFlagColors[UnknownLabel] ?? color(UnknownLabel),
      isLeftoverGroup: true,
    };
    setStyles(
      createRenderStyles(collection, 200, (v) => v.flag?.code ?? -1, styles),
    );
  }, [collection, languageValue]);
  return (
    collection &&
    renderStyles && (
      <TimelapseMap
        collection={collection}
        initialSpeed={1}
        renderStyles={renderStyles}
        tanslateTimelapse={tanslateTimelapse}
      />
    )
  );
};

export const TimelapseMap = ({
  collection,
  initialSpeed,
  renderStyles,
  tanslateTimelapse,
}: TimelapseMapProps) => {
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [pauseWin, setPauseWin] = useState<VoyageRouteCollectionWindow | null>(
    null,
  );
  const [selected, setSelected] = useState<InterpolatedVoyageRoute | undefined>(
    undefined,
  );
  const [speed, setSpeed] = useState(initialSpeed);
  const [years, setYears] = useState<[number, number] | undefined>();
  const [userStartYear, setUserStartYear] = useState<number | null>(null);
  const window = useRef<VoyageRouteCollectionWindow | undefined>();

  const dispatch = useDispatch();
  useEffect(() => {
    if (!pauseWin) {
      // Clear selection when resuming playing.
      setSelected(undefined);
    }
  }, [pauseWin]);
  const { styleName } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );
  const { styleNamePeople } = useSelector(
    (state: RootState) => state.getPeopleEnlavedDataSetCollection,
  );
  let backgroundColor = styleNamePeople;
  if (checkPagesRouteForVoyages(styleName)) {
    backgroundColor = styleName;
  }
  if (styleNamePeople === AFRICANORIGINS) {
    backgroundColor = styleNamePeople;
  }
  const handleWindowChange = useCallback((win: VoyageRouteCollectionWindow) => {
    const nextYears = win.years();
    if (years !== nextYears) {
      setYears(nextYears);
    }
    if (pauseWin) {
      setPauseWin(win);
    }
    window.current = win;
  }, []);
  return collection.voyageRoutes.length == 0 ? (
    <div
      className="loading-logo"
      style={{
        backgroundColor: getMapBackgroundColor(backgroundColor),
        position: 'absolute',
        top: '120px',
        marginLeft: '30px',
        width: 'calc(-150px + 100vw)',
        height: 'calc(-150px + 100vh)',
      }}
    >
      <img src={LOADINGLOGO} alt="loading" />
    </div>
  ) : (
    <MapContainer
      center={MAP_CENTER}
      zoom={zoomLevel}
      className="lealfetMap-container"
      maxZoom={MAXIMUM_ZOOM}
      minZoom={MINIMUM_ZOOM}
      attributionControl={false}
      scrollWheelZoom={true}
      zoomControl={true}
      style={{
        position: 'absolute',
        top: '120px',
        marginLeft: '30px',
        width: 'calc(-150px + 100vw)',
        height: 'calc(-150px + 100vh)',
      }}
    >
      <HandleZoomEvent
        setZoomLevel={setZoomLevel}
        setRegionPlace={() => {}}
        zoomLevel={zoomLevel}
      />
      <TileLayer url={mappingSpecialists} />
      <CanvasAnimation
        collection={collection}
        speed={speed}
        paused={pauseWin !== null}
        renderStyles={renderStyles}
        userStartYear={userStartYear}
        onWindowChange={handleWindowChange}
      />
      {pauseWin !== null && (
        <InteractiveVoyageRoutesFrame
          selected={selected}
          window={pauseWin}
          renderStyles={renderStyles}
          onSelect={setSelected}
        />
      )}
      <div className="leaflet-popup-timelapseHelpPopup">
        <TimelapseUI
          collection={collection}
          selected={pauseWin !== null ? selected : undefined}
          years={years}
          tanslateTimelapse={tanslateTimelapse}
          paused={pauseWin !== null}
          speed={speed}
          onClearSelection={() => setSelected(undefined)}
          onPause={() => setPauseWin(window.current ?? null)}
          onPlay={() => setPauseWin(null)}
          onShowDetails={(selected) => {
            dispatch(openCardTarget({ id: selected.id, nodeClass: VOYAGE }));
          }}
          onSpeedChange={setSpeed}
        />
      </div>

      <TimelapseAggregateChart
        collection={collection}
        renderStyles={renderStyles}
        years={years}
        onYearChange={setUserStartYear}
        tanslateTimelapse={tanslateTimelapse}
      />
      <CardModal />
    </MapContainer>
  );
};
