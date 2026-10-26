import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import axios from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

import { SubmissionRejectedError } from './createSubmitChangeContribution';

// API function for updating contribution status
export const updateContributionStatus = async (
  contributionId: string,
  status: ContributionStatus,
  decisionComments?: string,
) => {
  try {
    const response = await axios.patch(
      `${BASEURLNODE}/contributions/${contributionId}/change_status`,
      // `id` is sent in the body as well as the path because the endpoint reads
      // it from the body (`req.body.id`) and ignores its own `:id` route param.
      // Without it the lookup runs on `undefined` and every call 404s. Callers
      // that send a whole contribution work by accident, since that carries an
      // id already.
      { id: contributionId, status, decisionComments },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error updating contribution status:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      // A refusal from the readiness fold, not a failure. Accepting is the last
      // moment anyone can still edit a contribution, so an editor stopped here
      // needs the list of what is missing -- collapsing it into one sentence
      // leaves them with a decision they cannot act on.
      if (
        error.response?.status === 400 &&
        data &&
        (data.conflicts || data.validation)
      ) {
        throw new SubmissionRejectedError(
          data.conflicts ?? [],
          data.validation ?? [],
          data.error ?? 'This contribution is not ready yet.',
        );
      }
      const reason =
        [data?.error, data?.details].filter(Boolean).join(': ') ||
        error.message;
      throw new Error(`Failed to update status: ${reason}`);
    }

    throw error;
  }
};
