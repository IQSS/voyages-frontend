import { useEffect, useState } from 'react';
import '@/style/cards.scss';

import { Box } from '@mui/material';
import type { TabsProps } from 'antd';
import { Divider, Tabs } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import MetaTag from '@/components/MetaTag/MetaTag';
import VoyageCard from '@/components/PresentationComponents/Cards/Cards';
import CardModal from '@/components/PresentationComponents/Cards/CardModal';
import MAPS from '@/components/PresentationComponents/Map/MAPS';
import { fetchVoyageCard } from '@/fetch/voyagesFetch/fetchVoyageCard';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setValueVariable } from '@/redux/getCardFlatObjectSlice';
import { setCurrentBlockName } from '@/redux/getScrollEnslavedPageSlice';
import { RootState, AppDispatch } from '@/redux/store';
import { VOYAGESNODECLASS, VOYAGESNODE, ENSLAVERSNODE, ENSLAVEDNODE } from '@/share/CONST_DATA';
import { styleCard, styleTapMap, styleTapNetWorkGraph } from '@/styleMUI';
import { NetworkDiagramSlaveVoyagesSVG } from '@/components/PresentationComponents/NetworkGraph/NetworkDiagramSlaveVoyagesSVG';
import { setNetWorksID, setNetWorksKEY } from '@/redux/getPastNetworksGraphDataSlice';
import { fetchPastEnslaversCard } from '@/fetch/pastEnslaversFetch/fetchPastEnslaversCard';
import { fetchPastEnslavedCard } from '@/fetch/pastEnslavedFetch/fetchPastEnslavedCard';
import { generateVoyageDescription, generateVoyageTitle } from './generateVoyageTitle';
import { generateEnslaverDescription, generateEnslaverTitle } from './generateEnslaverTitle';
import { generateEnslavedDescription, generateEnslavedTitle } from './generateEnslavedTitle';

const TabsSelect = () => {
  const dispatch: AppDispatch = useDispatch();
  const { currentBlockName, voyageURLID: ID, endpointPath } = usePageRouter();
  const { variable, nodeTypeClass, cardRowID } = useSelector(
    (state: RootState) => state.getCardFlatObjectData,
  );

  const pageEntityClass = endpointPath || nodeTypeClass;
  const voyageId = cardRowID || ID;
  const initialTitle = voyageId
    ? `Voyage ${voyageId} - SlaveVoyages Database`
    : 'Slave Voyages Database';
  const initialDescription = voyageId
    ? `Explore detailed historical records for voyage ${voyageId}. View routes, dates, vessel information, and documentation from the SlaveVoyages database.`
    : 'Explore detailed records from the SlaveVoyages database.';

  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [pageDescription, setPageDescription] = useState(initialDescription);
  const [connectionsCount, setConnectionsCount] = useState<
    number | null | undefined
  >(undefined);
  const hideNetwork =
    connectionsCount !== undefined &&
    (connectionsCount === null || connectionsCount < 2);
  const navigate = useNavigate();
  console.log({pageTitle , pageDescription})

  const fetchMap: Record<string, any> = {
    [VOYAGESNODECLASS]: fetchVoyageCard,
    [VOYAGESNODE]: fetchVoyageCard,
    [ENSLAVERSNODE]: fetchPastEnslaversCard,
    [ENSLAVEDNODE]: fetchPastEnslavedCard
  };

  // Map of title generators by entity type
  const titleGenerators: Record<string, (data: any, id: string) => string> = {
    [VOYAGESNODECLASS]: generateVoyageTitle,
    [VOYAGESNODE]: generateVoyageTitle,
    [ENSLAVERSNODE]: generateEnslaverTitle,
    [ENSLAVEDNODE]: generateEnslavedTitle,
  };

  // Map of description generators by entity type
  const descriptionGenerators: Record<string, (data: any, id: string) => string> = {
    [VOYAGESNODECLASS]: generateVoyageDescription,
    [VOYAGESNODE]: generateVoyageDescription,
    [ENSLAVERSNODE]: generateEnslaverDescription,
    [ENSLAVEDNODE]:generateEnslavedDescription,
  };

  useEffect(() => {
    if (currentBlockName !== 'network') return;
    dispatch(setNetWorksID(Number(ID)));
    dispatch(
      setNetWorksKEY(
        pageEntityClass === 'voyage' ? 'voyages' : pageEntityClass,
      ),
    );
  }, [dispatch, currentBlockName, ID, pageEntityClass]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setConnectionsCount(undefined);
      const targetID = cardRowID || ID;
      if (!targetID) return;
      
      const fetchFn = fetchMap[pageEntityClass];
      if (!fetchFn) return;

      try {
        const numericID = typeof targetID === 'string' ? parseInt(targetID) : targetID;
        const response = await dispatch(fetchFn(numericID)).unwrap();
        if (cancelled) return;

        if (response?.data) {
          const count = response.data.connections_count;
          setConnectionsCount(typeof count === 'number' ? count : null);
          // Get the appropriate generators for this entity type
          const titleGenerator = titleGenerators[pageEntityClass];
          const descriptionGenerator = descriptionGenerators[pageEntityClass];

          // Generate SEO-optimized title and description
          const title = titleGenerator 
            ? titleGenerator(response.data, String(targetID))
            : `${pageEntityClass} ${targetID} - SlaveVoyages Database`;
            
          const description = descriptionGenerator
            ? descriptionGenerator(response.data, String(targetID))
            : `Explore detailed historical records for ${pageEntityClass} ${targetID}.`;

          setPageTitle(title);
          setPageDescription(description);
        }
      } catch (error) {
        if (cancelled) return;
        setConnectionsCount(null);
        console.log('Error fetching page data:', error);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [dispatch, pageEntityClass, cardRowID, ID]);

  useEffect(() => {
    if (!hideNetwork || currentBlockName !== 'network') return;
    dispatch(setValueVariable('variables'));
    dispatch(setCurrentBlockName('variables'));
    navigate(`/${pageEntityClass}/${ID}#variables`, { replace: true });
  }, [hideNetwork, currentBlockName, dispatch, navigate, pageEntityClass, ID]);

  const onChange = (key: string) => {
    dispatch(setValueVariable(key));
    dispatch(setCurrentBlockName(key));
    if (key === 'network') {
      dispatch(setNetWorksID(Number(ID)));
      const networkKEY =
        pageEntityClass === 'voyage' ? 'voyages' : pageEntityClass;
      dispatch(setNetWorksKEY(networkKEY));
    }
    navigate(`/${pageEntityClass}/${ID}#${key.toLowerCase()}`);
  };

  const allItems: NonNullable<TabsProps['items']> = [
    {
      key: 'variables',
      label: 'Variables',
      children: (
        <Box sx={styleCard}>
          <VoyageCard />
        </Box>
      ),
    },
    {
      key: 'map',
      label: 'Map',
      children: (
        <Box sx={styleTapMap}>
          <MAPS />
        </Box>
      ),
    },
    {
      key: 'network',
      label: 'Network graph',
      children: (
        <Box sx={styleTapNetWorkGraph}>
          <NetworkDiagramSlaveVoyagesSVG />
        </Box>
      ),
    },
    // {
    //   key: 'images',
    //   label: 'Images',
    //   children: (
    //     <Box sx={styleCard}>
    //       <div style={{ height: 500 }}>No images are available.</div>
    //     </Box>
    //   ),
    // },
  ];
  const items = hideNetwork
    ? allItems.filter((item) => item.key !== 'network')
    : allItems;

  return (
    <div>
      <MetaTag pageDescription={pageDescription} pageTitle={pageTitle} />
      <Divider />
      <Tabs
        defaultActiveKey={variable || currentBlockName}
        items={items}
        onChange={onChange}
        type="card"
        className="tab-container"
      />
      <CardModal />
    </div>
  );
};

export default TabsSelect;
