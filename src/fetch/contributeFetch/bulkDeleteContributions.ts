import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

import {
  BULK_STATUS_LIMIT,
  BulkStatusResult,
} from './bulkUpdateContributionStatus';

// Editor-only bulk delete on the Edit Requests table. The server answers with
// the same per-id tally shape as bulk-status (changed / unchanged / refused),
// so a request where most are deleted and a few are refused (e.g. Published
// contributions) is the ordinary case, not an error.
export { BULK_STATUS_LIMIT };

export const bulkDeleteContributions = async (
  contributionIds: string[],
): Promise<BulkStatusResult> => {
  try {
    const response = await axios.post(
      `${BASEURLNODE}/contributions/bulk-delete`,
      { contributionIds },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data as BulkStatusResult;
  } catch (error) {
    console.error('Error bulk deleting contributions:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to bulk delete: ${error.response?.data?.details || error.response?.data?.error || error.message}`,
      );
    }

    throw error;
  }
};
