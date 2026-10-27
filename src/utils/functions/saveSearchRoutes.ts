import {
  ASSESSMENT,
  ENSALVEDROUTE,
  ENSALVERSROUTE,
  ESTIMATES,
  VOYAGE,
  VOYAGEPATHENPOINT,
} from '@/share/CONST_DATA';

type SaveSearchPathInput = {
  currentBlockName?: string;
  endpointPath?: string;
  endpointPeopleDirect?: string;
  styleName?: string;
};

type SaveSearchPublicOriginInput = {
  hostname?: string;
  origin?: string;
};

type SaveSearchShareUrlInput = {
  id: string;
  location?: SaveSearchPublicOriginInput;
  routeSegment: string;
};

const SAVE_SEARCH_ENABLED_BLOCKS = new Set([
  '',
  VOYAGE,
  'people',
  'table',
  'bar',
  'pie',
  'scatter',
  'pivot',
  'map',
]);

const PRODUCTION_SAVED_SEARCH_ORIGIN = 'https://www.slavevoyages.com';
const APP_DEV_HOST_PATTERN = /^app-dev\.slavevoyages\.(org|com)$/i;

const hashForBlock = (currentBlockName?: string) =>
  currentBlockName ? `#${currentBlockName}` : '';

export const isSaveSearchEnabledBlock = (currentBlockName?: string) =>
  SAVE_SEARCH_ENABLED_BLOCKS.has(currentBlockName || '');

export const buildSaveSearchFrontEndPath = ({
  currentBlockName,
  endpointPath,
  endpointPeopleDirect,
  styleName,
}: SaveSearchPathInput) => {
  if (
    !styleName &&
    endpointPath !== ASSESSMENT &&
    endpointPeopleDirect !== ENSALVEDROUTE &&
    endpointPeopleDirect !== ENSALVERSROUTE
  ) {
    return '';
  }

  const hash = hashForBlock(currentBlockName);
  if (
    endpointPeopleDirect === ENSALVEDROUTE ||
    endpointPeopleDirect === ENSALVERSROUTE
  ) {
    return `/${endpointPeopleDirect}/${styleName}${hash}`;
  }

  if (endpointPath === VOYAGEPATHENPOINT) {
    return `/${endpointPath}/${styleName}${hash}`;
  }

  if (endpointPath === ASSESSMENT) {
    return `/${endpointPath}/${ESTIMATES}`;
  }

  return '';
};

const browserLocation = (): SaveSearchPublicOriginInput | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return {
    hostname: window.location.hostname,
    origin: window.location.origin,
  };
};

export const savedSearchPublicOrigin = (
  location = browserLocation(),
) => {
  const hostname = location?.hostname?.toLowerCase() || '';
  const origin = location?.origin?.replace(/\/+$/, '');
  if (origin && APP_DEV_HOST_PATTERN.test(hostname)) {
    return origin;
  }
  return PRODUCTION_SAVED_SEARCH_ORIGIN;
};

export const buildSavedSearchShareUrl = ({
  id,
  location,
  routeSegment,
}: SaveSearchShareUrlInput) =>
  `${savedSearchPublicOrigin(location)}/${routeSegment.replace(/^\/+|\/+$/g, '')}/${id}`;
