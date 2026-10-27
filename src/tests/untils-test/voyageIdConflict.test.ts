import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const listContributions = vi.fn();
const fetchVoyage = vi.fn();
vi.mock('@/fetch/contributeFetch/fetchContributionsData', () => ({
  fetchContributionsData: (...args: unknown[]) => listContributions(...args),
}));
vi.mock('@/fetch/contributeFetch/fetchSubmitEditVoaygesForm', () => ({
  fetchSubmitEditVoaygesForm: (id: string) => fetchVoyage(id),
}));

const { checkVoyageId } = await import('@/utils/contribute/voyageIdConflict');
const { checkVoyageConflict, getConflictErrorMessage } =
  await import('@/utils/functions/voyageValidation');

// A new voyage contribution whose review assigned `voyageId`.
const assigned = (
  id: string,
  voyageId: number,
  status: ContributionStatus,
) => ({
  id,
  status,
  root: { type: 'new', schema: 'Voyage', id: `uuid-${id}` },
  changeSet: { changes: [] },
  reviews: [
    {
      stackOrder: 1,
      changeSet: {
        changes: [
          {
            type: 'update',
            entityRef: { type: 'new', schema: 'Voyage', id: `uuid-${id}` },
            changes: [
              {
                kind: 'direct',
                property: 'Voyage_voyage_id',
                changed: voyageId,
              },
            ],
          },
        ],
      },
    },
  ],
});

const notFound = () =>
  new AxiosError('Not found', '404', undefined, undefined, {
    status: 404,
    statusText: '',
    data: 'Entity not found',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() } as never,
  });

describe('checkVoyageId', () => {
  beforeEach(() => {
    listContributions.mockReset();
    fetchVoyage.mockReset();
    fetchVoyage.mockRejectedValue(notFound());
  });

  test('asks the server for that Voyage ID exactly', async () => {
    listContributions.mockResolvedValue({ data: [] });
    await checkVoyageId('500', 'mine');
    expect(listContributions.mock.calls[0][2]).toBe('voyage_id=500');
  });

  test('another open contribution with the same Voyage ID is taken', async () => {
    listContributions.mockResolvedValue({
      data: [assigned('other', 500, ContributionStatus.Submitted)],
    });
    expect(await checkVoyageId('500', 'mine')).toMatchObject({
      status: 'taken',
      reason: expect.stringMatching(/another contribution \(submitted\)/),
    });
  });

  test('this contribution and rejected ones do not count', async () => {
    listContributions.mockResolvedValue({
      data: [
        assigned('mine', 500, ContributionStatus.Submitted),
        assigned('old', 500, ContributionStatus.Rejected),
      ],
    });
    expect(await checkVoyageId('500', 'mine')).toEqual({ status: 'free' });
  });

  test('a stored voyage with that id is taken', async () => {
    listContributions.mockResolvedValue({ data: [] });
    fetchVoyage.mockResolvedValue({ status: 200, data: { entityRef: {} } });
    expect(await checkVoyageId('500', 'mine')).toMatchObject({
      status: 'taken',
      reason: expect.stringMatching(/already exists in the database/),
    });
  });

  test('a check that cannot be made is failed, not free', async () => {
    listContributions.mockRejectedValue(new Error('offline'));
    expect((await checkVoyageId('500', 'mine')).status).toBe('failed');

    listContributions.mockResolvedValue({ data: [] });
    fetchVoyage.mockRejectedValue(new Error('offline'));
    expect((await checkVoyageId('500', 'mine')).status).toBe('failed');
  });
});

describe('Edit Existing Voyage conflict check', () => {
  test('an accepted, unpublished edit of the voyage blocks a new one', async () => {
    const acceptedEdit = {
      id: 'a',
      status: ContributionStatus.Accepted,
      root: { type: 'existing', schema: 'Voyage', id: 191766 },
    };
    const acceptedQuery = `status=${ContributionStatus.Accepted}&`;
    listContributions.mockImplementation(
      async (_page: number, _limit: number, query: string) => ({
        data: query.startsWith(acceptedQuery) ? [acceptedEdit] : [],
      }),
    );
    const conflict = await checkVoyageConflict(191766, 'existing');
    expect(conflict).toMatchObject({
      hasConflict: true,
      status: ContributionStatus.Accepted,
    });
    expect(getConflictErrorMessage(ContributionStatus.Accepted).status).toBe(
      'accepted',
    );
  });
});
