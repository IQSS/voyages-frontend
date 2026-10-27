import { useEffect, useRef, useState } from 'react';
import { AppDispatch, RootState } from '@/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPastNetworksGraphApi } from '@/fetch/pastEnslavedFetch/fetchPastNetworksGraph';
import { setPastNetworksData } from '@/redux/getPastNetworksGraphDataSlice';
import { netWorkDataProps } from '@/share/InterfaceTypePastNetworks';
import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';
import { useDimensions } from '@/hooks/useDimensions';
import { NetworkDiagramDrawSVG } from './NetworkDiagramDrawSVG';

export const NetworkDiagramSlaveVoyagesSVG = ({
  widthPercentage = 92,
  heigthPercentage = 85,
}) => {

  const dispatch: AppDispatch = useDispatch();
  const graphRef = useRef(null);
  const graphSize = useDimensions(graphRef);

  const [isLoading, setIsLoading] = useState(false);
  const { data: netWorkData } = useSelector(
    (state: RootState) => state.getPastNetworksGraphData
  );

  const { networkID, networkKEY } = useSelector(
    (state: RootState) => state.getPastNetworksGraphData
  );
  const rootNodeRef = useRef({ networkID, networkKEY });

  const modalWidth = window.innerWidth;
  const modalHeight = window.innerHeight;
  const width = (modalWidth * widthPercentage) / 100;
  const height = (modalHeight * heigthPercentage) / 100;

  useEffect(() => {
    let subscribed = true;
    const { networkID: rootID, networkKEY: rootKEY } = rootNodeRef.current;
    const dataSend: { [key: string]: number[] } = {
      [rootKEY]: [Number(rootID)],
    };

    const fetchPastNetworksGraph = async () => {
      setIsLoading(true);
      try {
        const response = await dispatch(
          fetchPastNetworksGraphApi(dataSend)
        ).unwrap();

        if (response && subscribed) {
          setIsLoading(false);
          dispatch(setPastNetworksData(response as netWorkDataProps));
        }
      } catch (error) {
        setIsLoading(false);
        console.log('error', error);
      }
    };
    fetchPastNetworksGraph();
    return () => {
      subscribed = false;
    };
  }, [dispatch]);

  if (width === 0 || !netWorkData) {
    return null;
  }

  return isLoading ? (
    <div className="loading-logo">
      <img src={LOADINGLOGO} />
    </div>
  ) : (
    <div style={{ width: `${width}px`, height: `${height}px` }} ref={graphRef}>
      <NetworkDiagramDrawSVG
        width={graphSize.width}
        height={graphSize.height}
      />
    </div>
  );
};
