import {
  ALLVOYAGESFILECARD,
  INDIANOCEANANDASIANFILECARD,
  INTRAAMERICANFILECARD,
  TRANSATLANTICFILECARD,
} from '@/share/CONST_DATA';

const cardFileByDataset: Record<number, string> = {
  0: TRANSATLANTICFILECARD,
  1: INTRAAMERICANFILECARD,
  3: INDIANOCEANANDASIANFILECARD,
};

export const resolveVoyageCardFileName = (
  pageCardFileName: string,
  dataset: unknown,
): string => {
  if (pageCardFileName === ALLVOYAGESFILECARD) {
    return ALLVOYAGESFILECARD;
  }

  if (typeof dataset !== 'number' || !Number.isInteger(dataset)) {
    return pageCardFileName;
  }

  return cardFileByDataset[dataset] ?? pageCardFileName;
};
