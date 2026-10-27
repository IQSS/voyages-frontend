/* eslint-disable indent */
/* eslint-disable import/order */
import { Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import CollectionTabVoyages from '@/components/NavigationComponents/CollectionTab/CollectionTabVoyages';
import HeaderVoyagesNavBar from '@/components/NavigationComponents/Header/HeaderVoyagesNavBar';
import BarGraph from '@/components/PresentationComponents/BarGraph/BarGraph';
import VoyagesMaps from '@/components/PresentationComponents/Map/MAPS';
import { VoyagesTimelapseMap } from '@/components/PresentationComponents/Map/TimelapseMap';
import PieGraph from '@/components/PresentationComponents/PieGraph/PieGraph';
import Scatter from '@/components/PresentationComponents/Scatter/Scatter';

import PivotTables from '@/components/PresentationComponents/PivotTables/PivotTables';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ALLVOYAGES,
  INDIANOCEANANDASIANSLAVETRADEDATABASE,
  INTRAAMERICAN,
  TRANSATLANTIC,
} from '@/share/CONST_DATA';
import {
  CurrentPageInitialState,
  TYPESOFBLOCKVOYAGES,
} from '@/share/InterfaceTypes';
import '@/style/page.scss';
import jsonDataVoyageCollection from '@/utils/flatfiles/voyages/voyages_collections.json';
import {
  pageVariantsFromBottom,
  pageVariantsFromTop,
} from '@/utils/functions/pageVariantsFromTop';
import { useEffect } from 'react';

import { usePageRouter } from '@/hooks/usePageRouter';
import {
  setBlocksMenuList,
  setStyleName,
  setTableVoyagesFlatfile,
  setVoyagesFilterMenuFlatfile,
} from '@/redux/getDataSetCollectionSlice';
import {
  setCurrentPage,
  setCurrentVoyagesBlockName,
} from '@/redux/getScrollPageSlice';
import Tables from '@/components/PresentationComponents/Tables/Tables';
import SummaryStatisticsTable from '@/components/PresentationComponents/Tables/SummaryStatisticsTable';
import { setCardFileName } from '@/redux/getCardFlatObjectSlice';
import MetaTag from '@/components/MetaTag/MetaTag';

const VoyagesPage = () => {
  const { styleName: styleVoyagesName, currentBlockName } = usePageRouter();
  const dispatch: AppDispatch = useDispatch();
  const { styleName } = useSelector(
    (state: RootState) => state.getDataSetCollection,
  );

  const { currentPage, currentVoyageBlockName } = useSelector(
    (state: RootState) => state.getScrollPage as CurrentPageInitialState,
  );

  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );

  // Add function to generate page title and description
  const getPageMetadata = () => {
    let baseTitle = '';
    let baseDescription = '';

    // Determine base title from style
    switch (styleVoyagesName) {
      case TRANSATLANTIC:
        baseTitle = 'Trans-Atlantic Slave Voyages';
        baseDescription =
          'Explore the Trans-Atlantic slave trade voyages database with detailed records, statistics, and visualizations.';
        break;
      case INTRAAMERICAN:
        baseTitle = 'Intra-American Slave Voyages';
        baseDescription =
          'Explore the Intra-American slave trade voyages database with detailed records, statistics, and visualizations.';
        break;
      case ALLVOYAGES:
        baseTitle = 'Slave Voyages';
        baseDescription =
          'Explore all slave trade voyages database with comprehensive records, statistics, and visualizations.';
        break;
      case INDIANOCEANANDASIANSLAVETRADEDATABASE:
        baseTitle = 'Indian Ocean';
        baseDescription =
          'Explore the Indian Ocean database\'s detailed records, statistics, and visualizations.';
        break;
      default:
        baseTitle = 'Slave Voyages';
        baseDescription = 'Explore the slave trade voyages database.';
    }

    // Add block-specific suffix if not on main voyages page
    if (
      currentVoyageBlockName &&
      currentVoyageBlockName !== TYPESOFBLOCKVOYAGES.voyagesEN
    ) {
      const blockTitles: Record<string, string> = {
        [TYPESOFBLOCKVOYAGES.summaryStatisticsEN]: 'Summary Statistics',
        [TYPESOFBLOCKVOYAGES.lineEN]: 'Line Graph',
        [TYPESOFBLOCKVOYAGES.barEN]: 'Bar Graph',
        [TYPESOFBLOCKVOYAGES.pieEN]: 'Pie Chart',
        [TYPESOFBLOCKVOYAGES.tableEN]: 'Pivot Tables',
        [TYPESOFBLOCKVOYAGES.mapEN]: 'Map',
        [TYPESOFBLOCKVOYAGES.timeLapseEN]: 'Timelapse Map',
      };

      const blockTitle = blockTitles[currentVoyageBlockName];
      if (blockTitle) {
        baseTitle = `${baseTitle} ${blockTitle}`;
      }
    }

    return {
      title: baseTitle,
      description: baseDescription,
    };
  };

  const { title: pageTitle, description: pageDescription } = getPageMetadata();

  useEffect(() => {
    if (styleVoyagesName) {
      dispatch(setStyleName(styleVoyagesName));
    }

    if (styleVoyagesName === TRANSATLANTIC) {
      dispatch(setBlocksMenuList(jsonDataVoyageCollection[0].blocks));
      dispatch(setCardFileName(jsonDataVoyageCollection[0].card_flatfile));
      dispatch(
        setTableVoyagesFlatfile(jsonDataVoyageCollection[0].table_flatfile),
      );
      dispatch(
        setVoyagesFilterMenuFlatfile(
          jsonDataVoyageCollection[0].filter_menu_flatfile,
        ),
      );
    } else if (styleVoyagesName === INTRAAMERICAN) {
      dispatch(setBlocksMenuList(jsonDataVoyageCollection[1].blocks));
      dispatch(setCardFileName(jsonDataVoyageCollection[1].card_flatfile));
      dispatch(
        setTableVoyagesFlatfile(jsonDataVoyageCollection[1].table_flatfile),
      );
      dispatch(
        setVoyagesFilterMenuFlatfile(
          jsonDataVoyageCollection[1].filter_menu_flatfile,
        ),
      );
    } else if (styleVoyagesName === ALLVOYAGES) {
      dispatch(setBlocksMenuList(jsonDataVoyageCollection[2].blocks));
      dispatch(setCardFileName(jsonDataVoyageCollection[2].card_flatfile));
      dispatch(
        setTableVoyagesFlatfile(jsonDataVoyageCollection[2].table_flatfile),
      );
      dispatch(
        setVoyagesFilterMenuFlatfile(
          jsonDataVoyageCollection[2].filter_menu_flatfile,
        ),
      );
    } else if (styleVoyagesName === INDIANOCEANANDASIANSLAVETRADEDATABASE) {
      dispatch(setBlocksMenuList(jsonDataVoyageCollection[3].blocks));
      dispatch(setCardFileName(jsonDataVoyageCollection[3].card_flatfile));
      dispatch(
        setTableVoyagesFlatfile(jsonDataVoyageCollection[3].table_flatfile),
      );
      dispatch(
        setVoyagesFilterMenuFlatfile(
          jsonDataVoyageCollection[3].filter_menu_flatfile,
        ),
      );
    }
    if (currentBlockName === 'voyages') {
      dispatch(setCurrentPage(1));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'sumstats') {
      dispatch(setCurrentPage(2));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'line') {
      dispatch(setCurrentPage(3));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'bar') {
      dispatch(setCurrentPage(4));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'pie') {
      dispatch(setCurrentPage(5));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'table') {
      dispatch(setCurrentPage(6));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (currentBlockName === 'map') {
      dispatch(setCurrentPage(7));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (
      styleVoyagesName === ALLVOYAGES &&
      currentBlockName === 'timelapse'
    ) {
      dispatch(setCurrentPage(1));
      dispatch(setCurrentVoyagesBlockName('voyages'));
    } else if (
      styleVoyagesName === TRANSATLANTIC &&
      currentBlockName === 'timelapse'
    ) {
      dispatch(setCurrentPage(8));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    } else if (
      styleVoyagesName === INTRAAMERICAN &&
      currentBlockName === 'timelapse'
    ) {
      dispatch(setCurrentPage(8));
      dispatch(setCurrentVoyagesBlockName(currentBlockName));
    }
  }, [
    dispatch,
    styleVoyagesName,
    styleName,
    currentBlockName,
    currentPage,
    currentVoyageBlockName,
  ]);

  const displayPage = (
    <motion.div
      initial={'initial'}
      animate={'animate'}
      variants={
        currentPage - 1 > -1 ? pageVariantsFromTop : pageVariantsFromBottom
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {currentPage === 1 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.voyagesEN && <Tables />}
      {currentPage === 2 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.summaryStatisticsEN && (
          <SummaryStatisticsTable />
        )}
      {currentPage === 3 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.lineEN && <Scatter />}
      {currentPage === 4 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.barEN && <BarGraph />}
      {currentPage === 5 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.pieEN && <PieGraph />}
      {currentPage === 6 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.tableEN && (
          <PivotTables />
        )}
      {currentPage === 7 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.mapEN && (
          <div style={{ padding: 30 }}>
            {' '}
            <VoyagesMaps />
          </div>
        )}
      {currentPage === 8 &&
        currentVoyageBlockName === TYPESOFBLOCKVOYAGES.timeLapseEN && (
          <VoyagesTimelapseMap />
        )}
    </motion.div>
  );
  const isTimelapsePage =
    currentPage === 8 &&
    currentVoyageBlockName === TYPESOFBLOCKVOYAGES.timeLapseEN;
  return (
    <div>
      <MetaTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <HeaderVoyagesNavBar />
      <Row
        className={
          isTimelapsePage ? 'voyages-home-page-timelapse' : 'voyages-home-page'
        }
        id="content-container"
        style={{
          position: 'relative',
          padding: inputSearchValue ? '0 20px' : '',
          zIndex: 1,
          top: inputSearchValue ? 40 : isTimelapsePage ? 22 : 10,
        }}
      >
        <CollectionTabVoyages />
        <Col id="content-container">{displayPage}</Col>
      </Row>
    </div>
  );
};

export default VoyagesPage;
