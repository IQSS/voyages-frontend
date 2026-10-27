import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchTreeSelectedContributeLocation = async () => {
  const response = await axios.get(`${BASEURL}/contrib/location_tree`, {
    headers: {
      Authorization: AUTHTOKEN,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
