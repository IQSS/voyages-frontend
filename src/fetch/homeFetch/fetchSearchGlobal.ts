import axios from 'axios';
import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';

export const fetchSearchGlobal = async (
  dataSend: { [key: string]: string },
  signal: AbortSignal
) => {
  try {
    const response = await axios.post(`${BASEURL}/common/global/`, dataSend, {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
      signal: signal,
    });
    return response.data.results;
  } catch (error) {
    throw new Error('Failed to fetch fetchSearchGlobal data');
  }
};
