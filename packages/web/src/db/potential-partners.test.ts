import { addDoc, collection } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePotentialPartner } from './potential-partners';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/potential-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a potential partner under a random id', () => {
    vi.mocked(collection).mockReturnValue('collection-ref' as never);
    vi.mocked(addDoc).mockResolvedValue({ id: 'random-id' } as never);
    const partner = {
      email: 'ada.lovelace+partners@example.com',
      fullName: 'Ada',
      companyName: 'Analytical Engines',
    };

    savePotentialPartner(partner, vi.fn());

    expect(collection).toHaveBeenCalledWith(db, 'potentialPartners');
    expect(addDoc).toHaveBeenCalledWith('collection-ref', partner);
  });
});
