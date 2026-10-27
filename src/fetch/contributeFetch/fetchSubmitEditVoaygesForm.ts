import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export const fetchSubmitEditVoaygesForm = async (voyageId: string) => {
  const response = await axios.get(
    `${BASEURLNODE}/materialize/Voyage/${voyageId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  );
  return response;
};
