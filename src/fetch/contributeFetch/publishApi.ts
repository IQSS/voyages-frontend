import axios, { isAxiosError } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

/** A property the server could not reconcile, keyed by its backing field. */
export interface PublicationConflictChange {
  kind: 'direct';
  property: string;
  changed: string | number | boolean | null;
  isForeignKey?: boolean;
}

export interface PublicationConflict {
  entityRef: { type: 'existing' | 'new'; schema: string; id: string | number };
  incompatible: PublicationConflictChange[];
}

export interface PublicationValidation {
  kind: 'error' | 'warning';
  entityRef: { type: 'existing' | 'new'; schema: string; id: string | number };
  message: string;
  /** The contribution this came from. */
  tag?: string;
}

/**
 * Raised when the server refuses to publish.
 *
 * This is not a failed publication — nothing was written, and the request never
 * reached the voyage database. The editor has contributions to fix first, so it
 * has to be told apart from a publication that started and then broke.
 */
export class PublicationRejectedError extends Error {
  constructor(
    public readonly conflicts: PublicationConflict[],
    public readonly validation: PublicationValidation[],
    message: string,
  ) {
    super(message);
    this.name = 'PublicationRejectedError';
  }
}

export type PublicationMode = 'batch' | 'contribution';

export interface PublishAccepted {
  /** Idempotency key; poll with this. */
  publication_key: string;
  status: 'accepted' | 'processing' | 'completed';
  message?: string;
  /** Warnings that did not block publication. */
  validation?: PublicationValidation[];
}

/**
 * Ask the server to publish a batch or a single accepted contribution.
 *
 * The server keys the task on `${id}_${mode}`, so calling this twice for the
 * same target returns the run already in flight rather than starting a second
 * one — the caller should treat `accepted` and `processing` the same way.
 */
export const publish = async (
  id: string | number,
  mode: PublicationMode,
): Promise<PublishAccepted> => {
  try {
    const response = await axios.post<PublishAccepted>(
      `${BASEURLNODE}/publish`,
      { id, mode },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data ?? {};
      // A 400 carrying conflicts or validation is the pre-flight refusal, not a
      // malformed request; surface it as something the editor can act on.
      if (data.conflicts || data.validation) {
        throw new PublicationRejectedError(
          data.conflicts ?? [],
          data.validation ?? [],
          data.error ?? 'This batch cannot be published yet.',
        );
      }
      throw new Error(data.details || data.error || 'Could not publish.');
    }
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.message || 'Could not publish.',
      );
    }
    throw error;
  }
};

export interface PublicationStatus {
  publication_key: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  contribution_ids: string[];
  processed_operations: number;
  created_at: string | null;
  updated_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  message?: string;
  /** Present when the publication failed. */
  error?: string;
  /** Present on completion — temporary ids mapped to real database ids. */
  id_mappings?: Record<string, string | number>;
  success?: boolean;
}

/**
 * Check on a publication. The server moves its contributions to Published when
 * this reports completion, so the client must not write that status itself.
 */
export const pollPublication = async (
  publicationKey: string,
): Promise<PublicationStatus> => {
  try {
    const response = await axios.post<PublicationStatus>(
      `${BASEURLNODE}/publish_poll/${encodeURIComponent(publicationKey)}`,
      {},
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    // A failed publication comes back as 400 with the same body shape, so read
    // it rather than throwing away the reason.
    if (isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as PublicationStatus | undefined;
      if (data?.status) {
        return data;
      }
    }
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Could not check the publication.',
      );
    }
    throw error;
  }
};
