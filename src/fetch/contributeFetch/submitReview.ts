/* eslint-disable @typescript-eslint/no-explicit-any */
// @/fetch/contributeFetch/submitReview.ts
import { Review } from '@slavevoyages/voyages-contribute';
import axios, { AxiosResponse } from 'axios';

import { BASEURLNODE } from '@/share/AUTH_BASEURL';
import { getAuthHeader } from '@/utils/getAuthHeaders';

export interface SubmitReviewPayload {
  changeSet: {
    id: string;
    author: string;
    title: string;
    comments: string;
    timestamp: number;
    changes: any[];
  };
}

export interface SubmitReviewResponse {
  id: string;
  status: number;
  reviews: Review[];
  // ... other contribution fields
}

/**
 * Submit a review for a contribution
 * @param contributionId - The ID of the contribution to review
 * @param review - The review object containing the changeSet
 * @returns The updated contribution with the new review
 */
export const submitReview = async (
  contributionId: string,
  review: Review,
): Promise<SubmitReviewResponse> => {
  try {
    const payload: SubmitReviewPayload = {
      changeSet: review.changeSet,
    };
    const response: AxiosResponse<SubmitReviewResponse> = await axios.post(
      `${BASEURLNODE}/contributions/${contributionId}/add_review`,
      payload,
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    // axios automatically parses JSON, so response.data contains the parsed data
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);

    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'Failed to submit review';
      throw new Error(errorMessage);
    }

    throw error;
  }
};
