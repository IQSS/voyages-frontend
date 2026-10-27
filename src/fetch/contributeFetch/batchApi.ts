// Contribute/BatchComponent/utils/batchApi.ts
import {
  ContributionStatus,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

/**
 * A batch as the list endpoints send it.
 *
 * `/batches/:filter` used to left-join the contributions *and* their change
 * sets, so listing batches shipped every stored diff they held — tens of
 * megabytes, several seconds, for a screen that only renders numbers. It now
 * sends the counts instead, which is all any caller here ever read.
 *
 * Optional because only the list endpoints carry them — a batch returned from
 * create/update is the row alone.
 */
export interface BatchWithContributions extends PublicationBatch {
  contributionCount?: number;
  statusCounts?: Partial<Record<ContributionStatus, number>>;
}

export interface BatchResponse {
  filter: string;
  count: number;
  batches: BatchWithContributions[];
}

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: getAuthHeader(),
});

// Helper function to determine batch status
export const getBatchStatus = (
  batch: PublicationBatch,
): 'pending' | 'published' => {
  return batch.published !== null ? 'published' : 'pending';
};

/**
 * Read a batch's publication timestamp.
 *
 * `publication_batches.published` is a varchar column, so SQLite stores the
 * epoch number with text affinity and hands it back as `"1754732400000"`.
 * `new Date` on that string is an Invalid Date, so go through `Number` first
 * and fall back to string parsing in case the column ever holds an ISO date.
 */
export const parseBatchDate = (
  timestamp: number | string | null | undefined,
): Date | null => {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return null;
  }
  const epoch = Number(timestamp);
  const date = Number.isFinite(epoch) ? new Date(epoch) : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Helper function to format date
export const formatBatchDate = (timestamp: number | string | null): string => {
  return parseBatchDate(timestamp)?.toLocaleDateString() ?? 'Not published';
};

// API functions
export const batchApi = {
  // Create a new publication batch
  async createBatch(data: PublicationBatch): Promise<PublicationBatch> {
    const response = await fetch(`${BASEURLNODE}/create_batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create batch');
    }

    return response.json();
  },

  // Get batches by status filter
  async getBatches(
    filter: 'all' | 'pending' | 'published',
  ): Promise<BatchResponse> {
    const response = await fetch(`${BASEURLNODE}/batches/${filter}`, {
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batches');
    }

    return response.json();
  },

  // Assign contribution to batch
  async assignContributionToBatch(
    contributionId: string,
    batchId: number | null,
  ): Promise<unknown> {
    const response = await fetch(`${BASEURLNODE}/assign_to_batch`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        contribution_id: contributionId,
        batch_id: batchId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign contribution to batch');
    }

    return response.json();
  },

  // Bulk assign contributions to batch
  async bulkAssignContributionsToBatch(
    contributionIds: string[],
    batchId: number | null,
  ): Promise<unknown[]> {
    const promises = contributionIds.map((contributionId) =>
      this.assignContributionToBatch(contributionId, batchId),
    );

    const results = await Promise.allSettled(promises);
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      throw new Error(
        `Failed to assign ${failures.length} out of ${contributionIds.length} contributions`,
      );
    }

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<unknown>).value);
  },

  // Get pending batches (utility function)
  async getPendingBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('pending');
    return response.batches;
  },

  // Get published batches (utility function)
  async getPublishedBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('published');
    return response.batches;
  },

  // Get all batches (utility function)
  async getAllBatches(): Promise<BatchWithContributions[]> {
    const response = await this.getBatches('all');
    return response.batches;
  },

  // Update batch (rename and/or update comments)
  async updateBatch(
    batchId: number,
    data: Partial<PublicationBatch>,
  ): Promise<PublicationBatch> {
    const response = await fetch(`${BASEURLNODE}/edit_batch`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: batchId,
        title: data.title,
        comments: data.comments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to update batch');
    }

    return response.json();
  },

  // Delete a batch. By default its contributions are unassigned and kept;
  // pass deleteContributions=true to delete them along with the batch.
  async deleteBatch(
    batchId: number,
    deleteContributions = false,
  ): Promise<void> {
    const query = deleteContributions ? '?deleteContributions=true' : '';
    const response = await fetch(`${BASEURLNODE}/batches/${batchId}${query}`, {
      method: 'DELETE',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Failed to delete batch');
    }
    // Success returns 204 No Content
  },

  /**
   * Start a batch-wide bulk approve. The server gathers the batch's Submitted
   * contributions and accepts them in the background, so this returns a job id
   * to poll rather than the outcome — a big batch outlasts one request.
   */
  async approveBatch(batchId: number): Promise<ApproveBatchStart> {
    const response = await fetch(`${BASEURLNODE}/batches/${batchId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.details || 'Failed to start batch approval',
      );
    }
    return response.json();
  },

  async getApproveJob(jobId: string): Promise<ApproveJob> {
    const response = await fetch(
      `${BASEURLNODE}/batches/approve-jobs/${jobId}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.details || 'Failed to read approval progress',
      );
    }
    return response.json();
  },
};

/** What POST /batches/:id/approve returns: the job to poll. */
export interface ApproveBatchStart {
  jobId: string;
  total: number;
  batchId: number;
  batchTitle: string;
}

export interface BulkStatusRefusal {
  id: string;
  status: number;
  error: string;
  details?: string;
}

/** The aggregated tally a finished approve job carries. */
export interface BulkStatusOutcome {
  requested: number;
  changed: string[];
  unchanged: string[];
  refused: BulkStatusRefusal[];
}

/** A batch-approve job as GET /batches/approve-jobs/:jobId returns it. */
export interface ApproveJob {
  jobId: string;
  status: 'pending' | 'running' | 'failed' | 'completed';
  batchId: number;
  batchTitle: string;
  progress: { processed: number; total: number };
  result?: BulkStatusOutcome;
  failureReason?: string;
}
