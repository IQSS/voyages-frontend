import { Dispatch } from '@reduxjs/toolkit';
import { resetSlice as resetOptionsData } from './getOptionsDataSlice';
import { resetSlice as resetGeoTreeData } from './getGeoTreeDataSlice';
import { resetSlice as resetRangeSliderData } from './getRangeSliderSlice';
import { resetSlice as resetAutoCompleteData } from './getAutoCompleteSlice';
import { resetSlice as resetDataSetCollectionData } from './getDataSetCollectionSlice';
import { resetSlice as resetVoyagesFilter } from './getFilterSlice';
import { resetSlice as resetNodeEdgesAggroutesMapData } from './getNodeEdgesAggroutesMapDataSlice';
import { resetSlice as resetOptionDataPastEnslaved } from './getOptionsDataPastPeopleEnslavedSlice';
import { resetSlice as resetSliceGlobalSearch } from './getCommonGlobalSearchResultSlice';
import { resetSlice as resetPeopleEnslavedDataSetCollection } from './getPeopleEnslavedDataSetCollectionSlice';
import { resetSlice as resetPeopleEnslaversDataSetCollection } from './getPeopleEnslaversDataSetCollectionSlice';
import {
  resetSlice as resetScroolVoyages,
  resetSliceCurrentPageAndDialog,
} from './getScrollPageSlice';
import { resetSlice as resetScrollEnslaved } from './getScrollEnslavedPageSlice';
import { resetAllStateSlice as resetEstimateAssesment } from './getEstimateAssessmentSlice';
import { resetSlice as resetAllStateSliceDataVoyage } from './getDataSetCollectionSlice';
import { resetAllStateSlice as resetAllStateSliceDataEnslaved } from './getPeopleEnslavedDataSetCollectionSlice';
import { resetAllStateSlice as resetAllStateSliceDataEnslavers } from './getPeopleEnslaversDataSetCollectionSlice';
import { resetSliceSaveSearch } from './getSaveSearchSlice';
import { resetSliceShowHideFilter } from './getShowFilterObjectSlice';
import { resetSliceTable } from './getTableSlice';
import { clearSavedData } from '@/utils/supabase/authStorage';

export const resetAll = () => (dispatch: Dispatch) => {
  dispatch(resetOptionsData());
  dispatch(resetGeoTreeData());
  dispatch(resetRangeSliderData());
  dispatch(resetAutoCompleteData());
  dispatch(resetDataSetCollectionData());
  dispatch(resetVoyagesFilter());
  dispatch(resetNodeEdgesAggroutesMapData());
  dispatch(resetOptionDataPastEnslaved());
  dispatch(resetPeopleEnslavedDataSetCollection());
  dispatch(resetPeopleEnslaversDataSetCollection());
  dispatch(resetScroolVoyages());
  dispatch(resetScrollEnslaved());
  dispatch(resetEstimateAssesment());
  dispatch(resetSliceSaveSearch());
  dispatch(resetSliceShowHideFilter());
  dispatch(resetSliceTable());
};

export const resetAllStateToInitailState = () => (dispatch: Dispatch) => {
  dispatch(resetOptionsData());
  dispatch(resetGeoTreeData());
  dispatch(resetRangeSliderData());
  dispatch(resetAutoCompleteData());
  dispatch(resetAllStateSliceDataVoyage());
  dispatch(resetVoyagesFilter());
  dispatch(resetNodeEdgesAggroutesMapData());
  dispatch(resetOptionDataPastEnslaved());
  dispatch(resetAllStateSliceDataEnslaved());
  dispatch(resetAllStateSliceDataEnslavers());
  dispatch(resetSliceCurrentPageAndDialog());
  dispatch(resetScrollEnslaved());
  dispatch(resetSliceGlobalSearch());
  dispatch(resetEstimateAssesment());
  dispatch(resetSliceSaveSearch());
  dispatch(resetSliceShowHideFilter());
  dispatch(resetSliceTable());

  // Clear the saved data, keeping the sign-in.
  clearSavedData();
};
