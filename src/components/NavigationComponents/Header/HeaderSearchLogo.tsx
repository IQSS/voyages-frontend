import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import voyageLogo from '@/assets/sv-logo.png';
import AutoCompletedSearhBlog from '@/components/FilterComponents/AutoCompletedSearhBlog/AutoCompletedSearhBlog';
import GlobalSearchButton from '@/components/PresentationComponents/GlobalSearch/GlobalSearchButton';
import LanguagesDropdown from '@/components/SelectorComponents/DropDown/LanguagesDropdown';
import { setInputSearchValue } from '@/redux/getCommonGlobalSearchResultSlice';
import {
  setBlocksMenuList,
  setDataSetHeader,
  setStyleName,
  setTextIntro,
} from '@/redux/getDataSetCollectionSlice';
import {
  setDataSetPeopleEnslavedHeader,
  setPeopleEnslavedBlocksMenuList,
  setPeopleEnslavedFilterMenuFlatfile,
  setPeopleEnslavedStyleName,
  setPeopleEnslavedTextIntro,
  setPeopleTableEnslavedFlatfile,
} from '@/redux/getPeopleEnslavedDataSetCollectionSlice';
import { setCurrentEnslavedPage } from '@/redux/getScrollEnslavedPageSlice';
import { setCurrentPage } from '@/redux/getScrollPageSlice';
import { resetAllStateToInitailState } from '@/redux/resetAllSlice';
import { resetBlockNameAndPageName } from '@/redux/resetBlockNameAndPageName';
import { AppDispatch, RootState } from '@/redux/store';
import jsonDataPEOPLECOLLECTIONS from '@/utils/flatfiles/people/people_collections.json';
import jsonDataVoyageCollection from '@/utils/flatfiles/voyages/voyages_collections.json';

export default function HeaderLogoSearch() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { blogTitle, institutionName } = useParams();
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );
  const onChangePath = () => {
    dispatch(resetAllStateToInitailState());
    dispatch(resetBlockNameAndPageName());
    dispatch(setCurrentEnslavedPage(1));
    dispatch(setCurrentPage(1));
    dispatch(setInputSearchValue(''));
    dispatch(setDataSetHeader(jsonDataVoyageCollection[0].headers.label.en));
    dispatch(setTextIntro(jsonDataVoyageCollection[0].headers.text_introduce));
    dispatch(setStyleName(jsonDataVoyageCollection[0].style_name));
    dispatch(setBlocksMenuList(jsonDataVoyageCollection[0].blocks));
    dispatch(
      setDataSetPeopleEnslavedHeader(
        jsonDataPEOPLECOLLECTIONS[0].headers.label.en,
      ),
    );
    dispatch(
      setPeopleEnslavedTextIntro(
        jsonDataPEOPLECOLLECTIONS[0].headers.text_introduce,
      ),
    );
    dispatch(
      setPeopleEnslavedStyleName(jsonDataPEOPLECOLLECTIONS[0].style_name),
    );
    dispatch(
      setPeopleEnslavedBlocksMenuList(jsonDataPEOPLECOLLECTIONS[0].blocks),
    );
    dispatch(
      setPeopleEnslavedFilterMenuFlatfile(
        jsonDataPEOPLECOLLECTIONS[0].filter_menu_flatfile,
      ),
    );
    dispatch(
      setPeopleTableEnslavedFlatfile(
        jsonDataPEOPLECOLLECTIONS[0].table_flatfile,
      ),
    );
    const keysToRemove = Object.keys(localStorage);
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
    navigate('/');
  };

  return (
    <>
      <div className="nav-blog-header-logo nav-blog-header-sticky-logo ">
        <button
          onClick={onChangePath}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <img src={voyageLogo} alt={'voyages logo'} className="logo-blog" />
        </button>
        <div className="blog-header-search">
          <div className="search-autocomplete-blog">
            {inputSearchValue ? (
              <GlobalSearchButton />
            ) : !blogTitle ? (
              <AutoCompletedSearhBlog />
            ) : (
              ''
            )}
          </div>
          {!blogTitle && !institutionName && <LanguagesDropdown />}
        </div>
      </div>
    </>
  );
}
