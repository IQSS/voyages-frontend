import { Contribution } from '@slavevoyages/voyages-contribute';
import axios, { isAxiosError } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

import { PublicationConflict, PublicationValidation } from './publishApi';

/**
 * Raised when the server refuses to accept a submission.
 *
 * Not a failed submission — nothing was written, and the contribution is still
 * a draft the contributor can edit. That distinction is the whole point of
 * checking at submit time, so it has to survive the trip to the UI rather than
 * collapsing into a generic "failed to submit".
 *
 * The payload shape is the publication one because it comes from the same fold
 * (`foldCombinedChanges`) on the server; the types are shared rather than
 * duplicated so the report component can render either.
 */
export class SubmissionRejectedError extends Error {
  constructor(
    public readonly conflicts: PublicationConflict[],
    public readonly validation: PublicationValidation[],
    message: string,
  ) {
    super(message);
    this.name = 'SubmissionRejectedError';
  }
}

// Submit an already-saved contribution.
export const createSubmitChangeContribution = async (
  contribution: Contribution,
): Promise<Contribution> => {
  const { id, status } = contribution;
  try {
    const response = await axios.patch(
      `${BASEURLNODE}/contributions/${id}/change_status`,
      { id, status },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error submitting contribution:', error);

    if (isAxiosError(error)) {
      const data = error.response?.data ?? {};
      // A 400 carrying validation is the pre-flight refusal — a list of fields
      // to fill in, not a malformed request. Surface it as something the
      // contributor can act on instead of flattening it into a message.
      if (
        error.response?.status === 400 &&
        (data.conflicts || data.validation)
      ) {
        throw new SubmissionRejectedError(
          data.conflicts ?? [],
          data.validation ?? [],
          data.error ?? 'This contribution is not ready to submit yet.',
        );
      }
      const reason =
        [data.error, data.details].filter(Boolean).join(': ') || error.message;
      throw new Error(`Failed to submit contribution: ${reason}`);
    }

    throw error;
  }
};
