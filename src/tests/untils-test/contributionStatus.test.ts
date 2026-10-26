import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createSubmitChangeContribution,
  SubmissionRejectedError,
} from '@/fetch/contributeFetch/createSubmitChangeContribution';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';

vi.mock('@/share/AUTH_BASEURL', () => ({
  BASEURLNODE: 'http://localhost:7127',
}));
vi.mock('@/utils/getAuthHeaders', () => ({
  getAuthHeader: () => 'Bearer contributor-token',
}));

const contribution: Contribution = {
  id: 'e5fe374e-d451-47c3-8b66-3f34a4dc6469',
  root: { schema: 'voyage', id: 20, type: 'existing' },
  changeSet: {
    id: 'changes',
    author: 'Contributor',
    comments: 'Contributor comments saved before submission',
    title: '',
    timestamp: 1,
    changes: [],
  },
  status: ContributionStatus.Submitted,
  reviews: [],
  media: [],
};

const apiError = (status: number, data: unknown) =>
  new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

beforeEach(() => {
  vi.spyOn(axios, 'patch');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('submitting a saved contribution', () => {
  test.each([null, '', 'Previous editorial comment', undefined])(
    'does not send saved decisionComments (%s) as an editorial update',
    async (decisionComments) => {
      const patch = vi.mocked(axios.patch).mockResolvedValue({
        data: contribution,
      });
      // The backend serializes nullable decisionComments despite the package
      // declaring it as an optional string.
      const saved = { ...contribution, decisionComments } as Contribution;

      await expect(createSubmitChangeContribution(saved)).resolves.toEqual(
        contribution,
      );

      expect(patch).toHaveBeenCalledWith(
        `http://localhost:7127/contributions/${contribution.id}/change_status`,
        { id: contribution.id, status: ContributionStatus.Submitted },
        {
          headers: {
            Authorization: 'Bearer contributor-token',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(saved.decisionComments).toBe(decisionComments);
    },
  );
});

test('an editorial decision still sends the editor comments', async () => {
  const patch = vi
    .mocked(axios.patch)
    .mockResolvedValue({ data: contribution });

  await updateContributionStatus(
    contribution.id,
    ContributionStatus.Accepted,
    'Sources checked',
  );

  expect(patch.mock.calls[0][1]).toEqual({
    id: contribution.id,
    status: ContributionStatus.Accepted,
    decisionComments: 'Sources checked',
  });
});

describe.each([
  {
    action: 'submitting a draft',
    request: () => createSubmitChangeContribution(contribution),
  },
  {
    action: 'recording an editorial decision',
    request: () =>
      updateContributionStatus(contribution.id, ContributionStatus.Accepted),
  },
])('errors when $action', ({ request }) => {
  test('keeps the server explanation for a permission refusal', async () => {
    vi.mocked(axios.patch).mockRejectedValueOnce(
      apiError(403, {
        error: 'Editor role required',
        details: 'Only an editor can record decision comments.',
      }),
    );

    await expect(request()).rejects.toThrow(
      'Editor role required: Only an editor can record decision comments.',
    );
  });

  test('preserves the structured readiness report', async () => {
    const validation = [
      {
        kind: 'error',
        entityRef: contribution.root,
        message: 'A required field is missing.',
      },
    ];
    vi.mocked(axios.patch).mockRejectedValueOnce(
      apiError(400, {
        error: 'Contribution is not ready.',
        validation,
      }),
    );

    const error = await request().catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(SubmissionRejectedError);
    expect(error).toMatchObject({
      message: 'Contribution is not ready.',
      conflicts: [],
      validation,
    });
  });
});
