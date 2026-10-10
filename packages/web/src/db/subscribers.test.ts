import { addDoc, collection } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSubscriber } from './subscribers';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/subscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a subscriber under a random id', () => {
    vi.mocked(collection).mockReturnValue('collection-ref' as never);
    vi.mocked(addDoc).mockResolvedValue({ id: 'random-id' } as never);
    const subscriber = {
      email: 'ada.lovelace+subscribe@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    };

    saveSubscriber(subscriber, vi.fn());

    expect(collection).toHaveBeenCalledWith(db, 'subscribers');
    expect(addDoc).toHaveBeenCalledWith('collection-ref', subscriber);
  });
});
