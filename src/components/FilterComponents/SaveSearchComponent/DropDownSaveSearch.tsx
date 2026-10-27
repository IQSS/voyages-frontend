/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { fetchCommonMakeSavedSearch } from '@/fetch/saveSearch/fetchCommonMakeSavedSearch';
import { usePageRouter } from '@/hooks/usePageRouter';
import {
  setListSaveSearchURL,
  setReloadTable,
  setRouteSaveSearch,
  setSaveSearchUrlID,
} from '@/redux/getSaveSearchSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { BASE_URL_FRONTEND } from '@/share/AUTH_BASEURL';
import {
  ASSESSMENT,
  ENSALVEDROUTE,
  ENSALVEDTYPE,
  ENSALVERSROUTE,
  ESTIMATES,
  VOYAGE,
  VOYAGEPATHENPOINT,
  allEnslavers,
} from '@/share/CONST_DATA';
import { SaveSearchRequest } from '@/share/InterfaceTypes';
import { filtersDataSend } from '@/utils/functions/filtersDataSend';
import { translationLanguagesSaveSearch } from '@/utils/functions/translationLanguages';
import {
  buildSavedSearchShareUrl,
  buildSaveSearchFrontEndPath,
} from '@/utils/functions/saveSearchRoutes';

const DropDownSaveSearch = () => {
  const dispatch: AppDispatch = useDispatch();
  const { endpointPath, styleName, endpointPeopleDirect, currentBlockName } =
    usePageRouter();
  const { filtersObj } = useSelector((state: RootState) => state.getFilter);

  const frontEndPath = useMemo(
    () =>
      buildSaveSearchFrontEndPath({
        currentBlockName,
        endpointPath,
        endpointPeopleDirect,
        styleName,
      }),
    [currentBlockName, endpointPath, endpointPeopleDirect, styleName],
  );

  const { saveSearchUrlID, listSaveSearchURL, routeSaveSearch } = useSelector(
    (state: RootState) => state.getSaveSearch,
  );

  let saveSearhURL: string = '';
  let endpointSaveSearch: string = '';
  if (endpointPeopleDirect === ENSALVEDROUTE) {
    endpointSaveSearch = endpointPeopleDirect;
    saveSearhURL = ENSALVEDTYPE;
  } else if (endpointPeopleDirect === ENSALVERSROUTE) {
    endpointSaveSearch = endpointPeopleDirect;
    saveSearhURL = allEnslavers;
  } else if (endpointPath === VOYAGEPATHENPOINT) {
    endpointSaveSearch = endpointPath;
    saveSearhURL = VOYAGE;
  } else if (endpointPath === ASSESSMENT) {
    endpointSaveSearch = endpointPath;
    saveSearhURL = ESTIMATES;
  }

  useEffect(() => {
    if (frontEndPath) {
      dispatch(setRouteSaveSearch(frontEndPath));
    }
  }, [dispatch, frontEndPath]);

  const filters = useMemo(
    () =>
      filtersDataSend(
        filtersObj,
        styleName!,
      ),
    [filtersObj, styleName]
  );
  
  const newFilters = useMemo(() => {
    return filters === undefined
      ? undefined
      : filters!.map((filter) => {
        const { ...filteredFilter } = filter;
        return filteredFilter;
      });
  }, [filters]);

  const dataSend: SaveSearchRequest = useMemo(()=>{
    return {
      endpoint: endpointSaveSearch,
      front_end_path: frontEndPath || routeSaveSearch,
      query: newFilters || [],
    };
  },[endpointSaveSearch, frontEndPath, routeSaveSearch, newFilters])
  
  const buildSavedSearchUrl = (id: string) =>
    buildSavedSearchShareUrl({
      id,
      routeSegment: saveSearhURL,
    });
  const handleSaveSearch = () => {
    fetchData();
  };

  const handleCopySaveSearch = (id: string) => {
    if (id) {
      const savedSearchUrl = buildSavedSearchUrl(id);
      navigator.clipboard.writeText(savedSearchUrl);
      alert(`Your URL ${savedSearchUrl} is copied`);
      dispatch(setReloadTable(false));
    }
  };

  const saveSearchToLocalStorage = (searchID: string) => {
    const saveID = { [searchID]: searchID };
    localStorage.setItem('saveSearchID', JSON.stringify(saveID));
  };

  const handleLoadSaveSearch = (id: string) => {
    if (styleName) {
      dispatch(setSaveSearchUrlID(id));
      // Trigger table reload
      dispatch(setReloadTable(true));
      setTimeout(() => {
        dispatch(setReloadTable(false));
      }, 200);

      saveSearchToLocalStorage(id);
    } else if (endpointSaveSearch === 'assessment') {
      window.location.href = `${BASE_URL_FRONTEND}/${endpointSaveSearch}/estimates`;

      // Reset state and ensure table is not reloaded
      dispatch(resetAll());
      dispatch(setReloadTable(false));
    }
  };

  const handleClearSaveSearch = () => {
    dispatch(setSaveSearchUrlID(''));
    dispatch(setListSaveSearchURL([]));
    dispatch(setReloadTable(false));
    localStorage.removeItem('saveSearchID');
  };

  const fetchData = async () => {
    try {
      const response = await dispatch(
        fetchCommonMakeSavedSearch(dataSend),
      ).unwrap();
      if (response) {
        const { id } = response;
        dispatch(setSaveSearchUrlID(id));
        const listSaveSearhID = listSaveSearchURL.filter(
          (searchID) => searchID !== id,
        );
        // const storedValue = localStorage.getItem('saveSearchID');
        dispatch(setListSaveSearchURL([...listSaveSearhID, id]));
        const saveID = {
          [id]: id,
        };
        const saveSearchID = JSON.stringify(saveID);
        localStorage.setItem('saveSearchID', saveSearchID);
      }
    } catch (error) {
      console.log('error', error);
    }
  };
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedSaveSearch = translationLanguagesSaveSearch(languageValue);

  return (
    <div
      id="current-searches"
      className="dropdown-menu search-menu search-submenu search-menu-singular dropdown-menu-right show"
    >
      <div className="popover-content">
        <div>
          <div className="v-panel-header">
            <div className="v-panel-title-container">
              <div className="v-panel-title">
                {translatedSaveSearch.saveSearchTitle}
              </div>{' '}
            </div>
            <div className="v-panel-description">
              {translatedSaveSearch.saveSearchDescription}
            </div>
          </div>
        </div>{' '}
        <div>
          <div className="v-form-group">
            <div className="flex-between">
              <div className="v-title">
                <span>
                  {translatedSaveSearch.saveSearchTitle}
                  <span> ({listSaveSearchURL?.length})</span>
                </span>
              </div>{' '}
              <div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleClearSaveSearch}
                >
                  {translatedSaveSearch.clearBtn}
                </button>{' '}
                <button
                  type="button"
                  className="btn btn-info btn-sm"
                  onClick={handleSaveSearch}
                >
                  {translatedSaveSearch.saveBtn}
                </button>
              </div>
            </div>{' '}
            <div className="v-description">
              <div>{translatedSaveSearch.hereDetail}</div>
            </div>{' '}
            {saveSearchUrlID && (
              <>
                <div className="flex-between v-saved-searches-header">
                  <div className="v-title">URL</div>
                </div>{' '}
                {listSaveSearchURL.map((id) => (
                  <div className="flex-between v-saved-searches-item" key={id}>
                    <div id="SzPhOxXs" className="url-searches-item">
                      {saveSearchUrlID && buildSavedSearchUrl(id)}
                    </div>{' '}
                    <div id="SzPhOxXs" className="url-searches-item"></div>
                    <div>
                      <button
                        onClick={() => handleLoadSaveSearch(id)}
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        {translatedSaveSearch.loadBtn}
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-info btn-sm"
                        onClick={() => handleCopySaveSearch(id)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropDownSaveSearch;
