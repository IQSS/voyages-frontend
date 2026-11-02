import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';
import { PivotTablesPropsRequest } from '@/share/InterfaceTypes';

export const fetchPivotCrosstabsCSV = async (
  dataSend: PivotTablesPropsRequest,
): Promise<Blob> => {
  const response = await axios.post(
    `${BASEURL}/voyage/crosstabs/`,
    { ...dataSend, format: 'csv' },
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    },
  );
  return response.data as Blob;
};
