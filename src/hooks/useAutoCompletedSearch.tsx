import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAutoVoyageComplete } from '@/fetch/voyagesFetch/fetchAutoVoyageComplete';

import {
  IRootFilterObject,
  AutoCompleteOption,
  DataSuggestedValuesProps,
} from '@/share/InterfaceTypes';
import {
  checkPagesRouteForVoyages,
  checkPagesRouteForEnslaved,
  checkPagesRouteForEnslavers,
} from '@/utils/functions/checkPagesRoute';
import { fetchPastEnslavedAutoComplete } from '@/fetch/pastEnslavedFetch/fetchPastEnslavedAutoCompleted';
import { fetchPastEnslaversAutoCompleted } from '@/fetch/pastEnslaversFetch/fetchPastEnslaversAutoCompleted';

export const useAutoCompletedSearch = (
  dataSend: IRootFilterObject | undefined,
  autoList: AutoCompleteOption[],
  setAutoList: React.Dispatch<React.SetStateAction<AutoCompleteOption[]>>,
  query: string,
  pageNumber: number,
  styleName?: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setAutoList([]);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const source = axios.CancelToken.source();

    const fetchAutoListData = async () => {
      try {
        const response = await fetchAutoList();
        if (response) {
          const { suggested_values } = response as DataSuggestedValuesProps;

          setAutoList((prevAutoList) => {
            // Create a Set to track unique values
            const uniqueValues = new Set<string>();

            // Add previous values to the Set
            prevAutoList.forEach((item) => uniqueValues.add(item.value));

            // Add new values from suggested_values to the Set
            suggested_values.forEach((value) => uniqueValues.add(value.value));

            // Convert Set back to an array without duplicates
            const uniqueAutoList = Array.from(uniqueValues).map((value) => ({
              value,
            }));
            return uniqueAutoList;
          });
          setHasMore(autoList.length > 0);
          setLoading(false);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled:', error.message);
        } else {
          console.log('Error fetching data:', error);
        }
        setError(true);
      }
    };

    fetchAutoListData();

    return () => {
      // Cancel the request when the component unmounts or the effect is cleaned up
      source.cancel('Request canceled by cleanup.');
    };
  }, [pageNumber, query]); // Run effect when pageNumber changes

  const fetchAutoList = async () => {
    let response;
    if (checkPagesRouteForVoyages(styleName!)) {
      response = await fetchAutoVoyageComplete(dataSend);
    } else if (checkPagesRouteForEnslaved(styleName!)) {
      response = await fetchPastEnslavedAutoComplete(dataSend);
    } else if (checkPagesRouteForEnslavers(styleName!)) {
      response = await fetchPastEnslaversAutoCompleted(dataSend);
    }
    return response;
  };

  return { loading, error, autoList, hasMore };
};
