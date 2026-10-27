import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export const fetchEnumeration = async (schema: string) => {
  const response = await axios.get(`${BASEURLNODE}/enumerate/${schema}`, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};
