import { fetchEnslavedOptionsList } from '@/fetch/pastEnslavedFetch/fetchPastEnslavedOptionsList';
import { fetchEnslaversOptionsList } from '@/fetch/pastEnslaversFetch/fetchPastEnslaversOptionsList';
import { fetchVoyageOptionsAPI } from '@/fetch/voyagesFetch/fetchVoyageOptionsAPI';
import { TableListPropsRequest } from '@/share/InterfaceTypes';
import {
  checkPagesRouteForEnslaved,
  checkPagesRouteForEnslavers,
  checkPagesRouteForVoyages,
} from '@/utils/functions/checkPagesRoute';
import { useQuery } from 'react-query';

export const useTableLists = (
  dataSend: TableListPropsRequest | undefined,
  styleName?: string,
) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tableLists', dataSend],
    queryFn: () => {
      if (checkPagesRouteForVoyages(styleName!)) {
        return fetchVoyageOptionsAPI(dataSend);
      } else if (checkPagesRouteForEnslaved(styleName!)) {
        return fetchEnslavedOptionsList(dataSend);
      } else if (checkPagesRouteForEnslavers(styleName!)) {
        return fetchEnslaversOptionsList(dataSend);
      }
    },
  });
  return { data, isLoading, isError };
};
