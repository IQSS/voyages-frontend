import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import { isAxiosError } from 'axios';

import { assignedVoyageId } from '@/components/PresentationComponents/Contribute/utils/assignedVoyageId';
import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';

const STATUS_LABEL: Record<number, string> = {
  [ContributionStatus.WorkInProgress]: 'work in progress',
  [ContributionStatus.Submitted]: 'submitted',
  [ContributionStatus.Accepted]: 'accepted',
  [ContributionStatus.Published]: 'published',
};

export type VoyageIdCheck =
  | { status: 'free' }
  | { status: 'taken' | 'failed'; reason: string };

/**
 * Whether a new voyage can take `voyageId`: not if another contribution (not
 * rejected) goes by it, or a stored voyage has it. A check that cannot be made
 * is reported as failed, never as free.
 */
export const checkVoyageId = async (
  voyageId: string,
  contributionId: string,
): Promise<VoyageIdCheck> => {
  const failed: VoyageIdCheck = {
    status: 'failed',
    reason: `Could not check whether Voyage ID ${voyageId} is free. Change the ID or reload to try again.`,
  };
  try {
    // Matched exactly by the server, so every contribution with this ID is
    // among the few rows returned.
    const response = await fetchContributionsData(
      1,
      50,
      `voyage_id=${encodeURIComponent(voyageId)}`,
    );
    const other = ((response?.data ?? []) as Contribution[]).find(
      (c) =>
        c.id !== contributionId &&
        c.status !== ContributionStatus.Rejected &&
        String(assignedVoyageId(c)) === voyageId,
    );
    if (other) {
      return {
        status: 'taken',
        reason: `Voyage ID ${voyageId} is already used by another contribution (${STATUS_LABEL[other.status] ?? 'open'}).`,
      };
    }
  } catch {
    return failed;
  }
  try {
    const stored = await fetchSubmitEditVoaygesForm(voyageId);
    if (stored.status === 200 && stored.data) {
      return {
        status: 'taken',
        reason: `Voyage ID ${voyageId} already exists in the database.`,
      };
    }
  } catch (error) {
    // 404: no stored voyage has this ID. Anything else is not an answer.
    if (!(isAxiosError(error) && error.response?.status === 404)) {
      return failed;
    }
  }
  return { status: 'free' };
};
