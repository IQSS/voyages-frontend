import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

/** Why one contribution in a bulk decision did not move. */
export interface BulkStatusRefusal {
  id: string;
  /** The status the same refusal would have carried on its own request. */
  status: number;
  error: string;
  details?: string;
}

/**
 * What happened to each contribution named in one request.
 *
 * The server decides them one at a time and refuses them one at a time, so the
 * response is a tally rather than a single verdict — a request where most
 * contributions moved and a few did not is the ordinary case, not an error.
 */
export interface BulkStatusResult {
  requested: number;
  changed: string[];
  /** Already in the status asked for. Not a failure, and not a change either. */
  unchanged: string[];
  refused: BulkStatusRefusal[];
}

/**
 * The most ids one request may carry, mirroring the server's own cap. Kept
 * here so the caller can split the work before being refused for asking too
 * much at once.
 */
export const BULK_STATUS_LIMIT = 500;

export const bulkUpdateContributionStatus = async (
  contributionIds: string[],
  status: ContributionStatus,
): Promise<BulkStatusResult> => {
  try {
    const response = await axios.patch(
      `${BASEURLNODE}/contributions/bulk-status`,
      {
        contributionIds,
        status,
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data as BulkStatusResult;
  } catch (error) {
    console.error('Error bulk updating contribution status:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to bulk update status: ${error.response?.data?.details || error.response?.data?.error || error.message}`,
      );
    }

    throw error;
  }
};
