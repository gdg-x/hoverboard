import { doc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePotentialPartner } from './potential-partners';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/potential-partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a potential partner with sanitized email id', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await savePotentialPartner({
      email: 'ada.lovelace+partners@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Analytical Engines',
    });

    expect(doc).toHaveBeenCalledWith(db, 'potentialPartners', 'adalovelacepartnersexamplecom');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      email: 'ada.lovelace+partners@example.com',
      fullName: 'Ada',
      companyName: 'Analytical Engines',
    });
  });

  it('uses default empty strings when fields are omitted', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await savePotentialPartner({ email: 'ada@example.com' });

    expect(doc).toHaveBeenCalledWith(db, 'potentialPartners', 'adaexamplecom');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      email: 'ada@example.com',
      fullName: '',
      companyName: '',
    });
  });
});
