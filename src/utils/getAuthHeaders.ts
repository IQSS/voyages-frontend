import store from '@/redux/store';

/**
 * Gets the appropriate Authorization header based on current auth state
 * @returns Authorization header string
 */
export const getAuthHeader = (): string => {
  const state = store.getState();
  const token = state.getAuthUserSlice?.user?.accessToken;

  if (token) {
    return `Bearer ${token}`;
  }

  // The Django public API token is never a contribution-service credential.
  return '';
};

/**
 * Gets headers object with Authorization header
 * @param additionalHeaders Additional headers to include
 * @returns Headers object
 */
export const getAuthHeaders = (
  additionalHeaders: Record<string, string> = {},
): Record<string, string> => {
  return {
    Authorization: getAuthHeader(),
    ...additionalHeaders,
  };
};
