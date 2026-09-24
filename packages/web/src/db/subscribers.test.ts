import { doc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSubscriber } from './subscribers';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/subscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a subscriber with sanitized email id', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    const result = await saveSubscriber({
      email: 'ada.lovelace+subscribe@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });

    expect(doc).toHaveBeenCalledWith(db, 'subscribers', 'adalovelacesubscribeexamplecom');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      email: 'ada.lovelace+subscribe@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(result).toBe(true);
  });

  it('uses default empty strings when fields are omitted', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    const result = await saveSubscriber({ email: 'ada@example.com' });

    expect(doc).toHaveBeenCalledWith(db, 'subscribers', 'adaexamplecom');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      email: 'ada@example.com',
      firstName: '',
      lastName: '',
    });
    expect(result).toBe(true);
  });
});
