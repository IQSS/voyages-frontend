import { Contribution } from '@slavevoyages/voyages-contribute';
import axios, { isAxiosError } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

// API function for creating/updating contribution
export const createSaveChangeContribution = async (
  contribution: Contribution,
): Promise<Contribution> => {
  try {
    const response = await axios.post(
      `${BASEURLNODE}/contributions`,
      contribution,
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error creating contribution:', error);

    if (isAxiosError(error)) {
      throw new Error(
        `Failed to create contribution: ${error.response?.data?.error || error.message}`,
      );
    }

    throw error;
  }
};
