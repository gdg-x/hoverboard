import { Failure, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { addPotentialPartner, initialPotentialPartnersState } from '.';
import { savePotentialPartner } from '../../db/potential-partners';
import { dispatch } from '../dispatch';

vi.mock('../../db/potential-partners');
vi.mock('../dispatch');

describe('potential-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialPotentialPartnersState);
  });

  it('handles pending, failure, and success actions', () => {
    const error = new Error('failed');

    expect(
      reducer(initialPotentialPartnersState, { type: 'potentialPartners/pending' }),
    ).toStrictEqual(new Pending());
    expect(
      reducer(initialPotentialPartnersState, {
        type: 'potentialPartners/failure',
        payload: error,
      }),
    ).toStrictEqual(new Failure(error));
    expect(
      reducer(initialPotentialPartnersState, { type: 'potentialPartners/success' }),
    ).toStrictEqual(new Success(true));
  });

  it('writes the partner document and dispatches success', async () => {
    vi.mocked(savePotentialPartner).mockResolvedValue(undefined as never);

    await addPotentialPartner({
      email: 'ada.lovelace+partners@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Analytical Engines',
    });

    expect(savePotentialPartner).toHaveBeenCalledWith({
      email: 'ada.lovelace+partners@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Analytical Engines',
    });
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'potentialPartners/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'potentialPartners/success' }),
    );
  });

  it('dispatches failure when saving the partner fails', async () => {
    const error = new Error('write failed');

    vi.mocked(savePotentialPartner).mockRejectedValue(error);

    await addPotentialPartner({
      email: 'ada@example.com',
    });

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'potentialPartners/pending' }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'potentialPartners/failure', payload: error }),
    );
  });
});
