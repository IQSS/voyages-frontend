import { fetchTreeSelectedContributeLocation } from '@/fetch/contributeFetch/fetchTreeSelectedContributeLocation';
import { ContribuitLocation } from '@/share/InterfaceTypes';

import { useEnumeration, UseEnumerationOptions } from './useEnumeration';

export const useTreeSelectContributeLocation = (
  options?: UseEnumerationOptions,
) => {
  const {
    items: locationsList,
    loading,
    error,
  } = useEnumeration<ContribuitLocation>(
    'ContributeLocationTree',
    fetchTreeSelectedContributeLocation,
    options,
  );
  return { locationsList, loading, error };
};
