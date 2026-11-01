/* eslint-disable indent */
import React, { useEffect } from 'react';

import { Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import MetaTag from '@/components/MetaTag/MetaTag';
import HeaderEnslaversNavBar from '@/components/NavigationComponents/Header/HeaderEnslaversNavBar';
import Tables from '@/components/PresentationComponents/Tables/Tables';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setCurrentBlockName } from '@/redux/getScrollEnslavedPageSlice';
import { setCurrentEnslaversPage } from '@/redux/getScrollEnslaversPageSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  allEnslavers,
  INTRAAMERICANTRADS,
  TRANSATLANTICTRADS,
} from '@/share/CONST_DATA';
import { TYPESOFBLOCKENSLAVED } from '@/share/InterfaceTypes';
import {
  pageVariantsFromBottom,
  pageVariantsFromTop,
} from '@/utils/functions/pageVariantsFromTop';

const EnslaversHomePage: React.FC = () => {
  const { currentEnslaversPage } = useSelector(
    (state: RootState) => state.getScrollEnslaversPage,
  );
  const { styleName: styleNameRoute } = usePageRouter();
  const { inputSearchValue } = useSelector(
    (state: RootState) => state.getCommonGlobalSearch,
  );
  const { currentBlockName, endpointPeopleDirect } = usePageRouter();
  const dispatch: AppDispatch = useDispatch();

  const getPageMetadata = () => {
    let baseTitle = '';
    let baseDescription = '';

    switch (styleNameRoute) {
      case TRANSATLANTICTRADS:
        baseTitle = 'Trans-Atlantic Slave Trader Names';
        baseDescription =
          'Explore the Trans-Atlantic Slave Trader Names database with detailed records of slave traders and their activities.';
        break;
      case INTRAAMERICANTRADS:
        baseTitle = 'Intra-American Slave Trader Names';
        baseDescription =
          'Explore the Intra-American Slave Trader Names database with detailed historical records and information.';
        break;
      case allEnslavers:
        baseTitle = 'Slave Trader Names';
        baseDescription =
          'Explore the comprehensive database of all slave traders with detailed records and historical information.';
        break;
      default:
        baseTitle = 'Slave Trader Names';
        baseDescription = 'Explore the slave traders database.';
    }

    if (currentBlockName === 'people') {
      if (!baseTitle.includes('Names')) {
        baseTitle = `${baseTitle} Names`;
      }
    }

    return {
      title: baseTitle,
      description: baseDescription,
    };
  };

  const { title: pageTitle, description: pageDescription } = getPageMetadata();
  useEffect(() => {
    if (currentBlockName === 'people') {
      dispatch(setCurrentEnslaversPage(1));
      dispatch(setCurrentBlockName(currentBlockName));
    }
  }, [dispatch, currentBlockName]);

  const displayPage = (
    <motion.div
      initial={'initial'}
      animate={'animate'}
      variants={
        currentEnslaversPage - 1 > -1
          ? pageVariantsFromTop
          : pageVariantsFromBottom
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {((currentEnslaversPage === 1 && currentBlockName === 'people') ||
        endpointPeopleDirect === 'past/enslaver') && <Tables />}
    </motion.div>
  );
  const headerHeight = 80;
  return (
    <div className="flex flex-col h-screen">
      <MetaTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <HeaderEnslaversNavBar />
      <div className="flex-1 relative">
        <div
          className="overflow-auto"
          style={{
            height: `calc(100vh - ${headerHeight}px - 200px)`,
            paddingTop: inputSearchValue ? '0.5rem' : '0',
          }}
        >
          <Grid id="content-container">
            <motion.div
              initial="initial"
              animate="animate"
              variants={
                currentEnslaversPage - 1 > -1
                  ? pageVariantsFromTop
                  : pageVariantsFromBottom
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {displayPage}
            </motion.div>
          </Grid>
        </div>
      </div>
    </div>
  );
};

export default EnslaversHomePage;
