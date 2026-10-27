import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  InitialStateTransatlanticCard,
  TransatlanticCardProps,
} from '@/share/InterfaceTypes';
import jsonDataVoyageCollection from '@/utils/flatfiles/voyages/voyages_collections.json';
import { CardTarget, normalizeCardTarget } from '@/utils/functions/cardTarget';

export type { CardTarget } from '@/utils/functions/cardTarget';

export const initialState: InitialStateTransatlanticCard = {
  cardData: [],
  isModalCard: false,
  cardRowID: 0,
  cardFileName: jsonDataVoyageCollection[0].card_flatfile,
  cardDataArray: [],
  nodeTypeClass: '',
  variable: '',
};
const getCardFlatObjectSlice = createSlice({
  name: 'getCardFlatObject',
  initialState,
  reducers: {
    setCardData: (state, action: PayloadAction<Record<string, any>[]>) => {
      state.cardData = action.payload;
    },
    setIsModalCard: (state, action: PayloadAction<boolean>) => {
      state.isModalCard = action.payload;
    },
    openCardTarget: (state, action: PayloadAction<CardTarget>) => {
      const target = normalizeCardTarget(action.payload);
      if (!target) return;
      state.cardRowID = target.id;
      state.nodeTypeClass = target.nodeClass;
      state.isModalCard = true;
    },
    setCardRowID: (state, action: PayloadAction<number>) => {
      state.cardRowID = action.payload;
    },
    setCardFileName: (state, action: PayloadAction<string>) => {
      state.cardFileName = action.payload;
    },
    setCardDataArray: (
      state,
      action: PayloadAction<TransatlanticCardProps[]>,
    ) => {
      state.cardDataArray = action.payload;
    },
    setNodeClass: (state, action: PayloadAction<string>) => {
      state.nodeTypeClass = action.payload;
    },
    setValueVariable: (state, action: PayloadAction<string>) => {
      state.variable = action.payload;
    },
  },
});

export const {
  setCardData,
  setIsModalCard,
  openCardTarget,
  setCardRowID,
  setValueVariable,
  setCardFileName,
  setCardDataArray,
  setNodeClass,
} = getCardFlatObjectSlice.actions;
export default getCardFlatObjectSlice.reducer;
