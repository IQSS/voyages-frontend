import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import peopleIcon from '@/assets/people-cycle.svg';
import resourceIcon from '@/assets/resources.svg';
import timelapseIcon from '@/assets/timeLap_circle.svg';
import voyageIcon from '@/assets/voyage-cycle.svg';
import {
  setPathNameEnslaved,
  setPathNameVoyages,
} from '@/redux/getDataPathNameSlice';
import { setCurrentPage } from '@/redux/getScrollPageSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ALLENSLAVED,
  ALLVOYAGES,
  BLOGPAGE,
  PASTHOMEPAGE,
  TRANSATLANTICPAGE,
  TRANSATLANTICTIMELAPSE,
} from '@/share/CONST_DATA';
import { translationHomepage } from '@/utils/functions/translationLanguages';

const GlobalHomeNavigations = () => {
  const dispatch: AppDispatch = useDispatch();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translatedHomepage = translationHomepage(languageValue);

  const handleHomeSearch = () => {
    dispatch(setCurrentPage(1));
    dispatch(setPathNameVoyages(ALLVOYAGES));
    dispatch(resetAll());
    const keysToRemove = Object.keys(localStorage);
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  };
  return (
    <>
      <div className="voyages-people-places">
        <div className="place-page-box">
          <div className="voyages-people-places-title">
            {translatedHomepage.navigatorTitleVoyages}
          </div>
          <button
            type="button"
            onClick={() => {
              handleHomeSearch();
              window.location.assign(`${TRANSATLANTICPAGE}#voyages`);
            }}
            className="voyages-people-places-link-btn"
            aria-label={translatedHomepage.navigatorTitleVoyages}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <img
              src={voyageIcon}
              alt="Search by Vessels"
              style={{ opacity: 0.65 }}
            />
          </button>
          <div className="voyages-people-places-subtitle">
            {translatedHomepage.navigatorSubTitleVoyages}
          </div>
        </div>
        <div className="place-page-box">
          <div className="voyages-people-places-title">
            {translatedHomepage.navigatorTitlePeople}
          </div>
          <button
            type="button"
            className="voyages-people-places-link-btn"
            onClick={() => {
              const keysToRemove = Object.keys(localStorage);
              keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
              });
              dispatch(setPathNameEnslaved(ALLENSLAVED));
              window.location.assign(`/${PASTHOMEPAGE}`);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            aria-label={translatedHomepage.navigatorTitlePeople}
          >
            <img src={peopleIcon} alt="People" style={{ opacity: 0.65 }} />
          </button>
          <div className="voyages-people-places-subtitle">
            {translatedHomepage.navigatorSubTitlePeople}
          </div>
        </div>
        <div className="place-page-box">
          <div className="voyages-people-places-title">
            {translatedHomepage.navigatorTitleTimelapse}
          </div>
          <Link to={`${TRANSATLANTICTIMELAPSE}#timelapse`}>
            <img
              src={timelapseIcon}
              alt="Timelapse"
              style={{ opacity: 0.65 }}
            />
          </Link>
          <div className="voyages-people-places-subtitle">
            <div>{translatedHomepage.navigatorSubTitleTimelapse}</div>
            <div>{translatedHomepage.navigatorSubTitleTimelapseNewLine}</div>
          </div>
        </div>
        <div className="place-page-box">
          <div className="voyages-people-places-title">
            {translatedHomepage.navigatorTitleWriting}
          </div>
          <Link to={`/${BLOGPAGE}`}>
            <img
              src={resourceIcon}
              alt="Writing"
              width={129}
              style={{ opacity: 0.65 }}
            />
          </Link>
          <div className="voyages-people-places-subtitle">
            {translatedHomepage.navigatorSubTitleWriting}
          </div>
        </div>
      </div>
    </>
  );
};
export default GlobalHomeNavigations;
