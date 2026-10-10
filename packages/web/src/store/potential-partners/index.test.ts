import { Failure, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, { addPotentialPartner, initialPotentialPartnersState } from '.';
import { savePotentialPartner } from '../../db/potential-partners';
import { dispatch } from '../dispatch';
import { canWriteNow } from '../sync';

vi.mock('../../db/potential-partners');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ canWriteNow: vi.fn(() => true) }));

describe('potential-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialPotentialPartnersState);
  });

  it('handles failure and success actions', () => {
    const error = new Error('failed');

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

  it('writes the partner document and dispatches success without waiting', () => {
    addPotentialPartner({
      email: 'ada.lovelace+partners@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Analytical Engines',
    });

    expect(savePotentialPartner).toHaveBeenCalledWith(
      {
        email: 'ada.lovelace+partners@example.com',
        firstFieldValue: 'Ada',
        secondFieldValue: 'Analytical Engines',
      },
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'potentialPartners/success' }),
    );
  });

  it('dispatches failure when the server refuses the partner', () => {
    const error = new Error('permission-denied');
    vi.mocked(savePotentialPartner).mockImplementation((_data, onRejected) => onRejected(error));

    addPotentialPartner({ email: 'ada@example.com' });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'potentialPartners/failure', payload: error }),
    );
  });

  it('needs the network, since the visitor has no account to sync it later', () => {
    vi.mocked(canWriteNow).mockReturnValueOnce(false);

    addPotentialPartner({ email: 'ada@example.com' });

    expect(savePotentialPartner).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'potentialPartners/failure' }),
    );
  });
});
