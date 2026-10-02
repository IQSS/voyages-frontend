import { ContributionStatus } from '@slavevoyages/voyages-contribute';

import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';

export interface VoyageConflictResult {
  hasConflict: boolean;
  status?: number;
  contributionId?: string;
  conflictType?: 'new' | 'existing';
}

/**
 * Check if a voyage ID already exists in user's work-in-progress contributions
 * @param voyageId - The voyage ID to check
 * @param checkType - Type of conflict to check: 'new' (NewVoyages), 'existing' (EditExistingVoyage), or 'both'
 * @returns Promise with conflict information
 */
export const checkVoyageConflict = async (
  voyageId: string | number,
  checkType: 'new' | 'existing',
): Promise<VoyageConflictResult> => {
  try {
    // Narrowed to this voyage server-side. Asking for every contribution and
    // filtering here meant downloading the whole table — tens of megabytes once
    // a CSV import has run — and parsing it blocked the page long enough to
    // look frozen.
    const rootId = encodeURIComponent(String(voyageId));
    // Every status still open (not yet published or rejected); the backend
    // filters by role, so each status is requested explicitly.
    const [wipRes, submittedRes, acceptedRes] = await Promise.all([
      fetchContributionsData(
        1,
        100,
        `status=${ContributionStatus.WorkInProgress}&root_id=${rootId}`,
      ),
      fetchContributionsData(
        1,
        100,
        `status=${ContributionStatus.Submitted}&root_id=${rootId}`,
      ),
      fetchContributionsData(
        1,
        100,
        `status=${ContributionStatus.Accepted}&root_id=${rootId}`,
      ),
    ]);
    const wipContributions = [
      ...(wipRes?.data ?? []),
      ...(submittedRes?.data ?? []),
      ...(acceptedRes?.data ?? []),
    ];

    // Check for conflicts based on type
    for (const contrib of wipContributions) {
      const rootType = contrib.root?.type;
      const rootId = String(contrib.root?.id);
      const voyageIdStr = String(voyageId);

      // Check for 'new' type conflicts (NewVoyages)
      if (checkType === 'new' && rootType === 'new' && rootId === voyageIdStr) {
        return {
          hasConflict: true,
          status: contrib.status,
          contributionId: contrib.id,
          conflictType: 'new',
        };
      }

      // Check for 'existing' type conflicts (EditExistingVoyage)
      if (
        checkType === 'existing' &&
        rootType === 'existing' &&
        rootId === voyageIdStr
      ) {
        return {
          hasConflict: true,
          status: contrib.status,
          contributionId: contrib.id,
          conflictType: 'existing',
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking voyage conflict:', error);
    throw error;
  }
};

export interface ConflictErrorMessage {
  status: string;
  content: string;
}

/**
 * Get a user-friendly error message for voyage conflicts
 * @param conflictStatus - Type of conflict detected
 * @returns User-friendly error message with status
 */
export const getConflictErrorMessage = (
  conflictStatus: number,
): ConflictErrorMessage => {
  if (conflictStatus === ContributionStatus.Submitted) {
    return {
      status: 'submitted',
      content: `This voyage has already been submitted for evaluation. Please contact the editor at editors@slavevoyages.org for any further revisions or additional information you wish to contribute.`,
    };
  }

  if (conflictStatus === ContributionStatus.Accepted) {
    return {
      status: 'accepted',
      content: `This voyage has an accepted contribution that is not published yet. Please wait until it is published, or contact the editor at editors@slavevoyages.org.`,
    };
  }

  if (conflictStatus === ContributionStatus.WorkInProgress) {
    return {
      status: 'work-in-progress',
      content: `This voyage is already being edited in your work-in-progress contributions.\n Please complete or delete the existing contribution before creating a new one.`,
    };
  }

  return {
    status: 'conflict',
    content: 'This voyage already exists in your contributions.',
  };
};
