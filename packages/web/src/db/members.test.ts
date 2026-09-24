import { describe, expect, it, vi } from 'vitest';
import { subscribeToMembers } from './members';
import { subscribeToCollectionGroup } from '../utils/firestore';

vi.mock('../utils/firestore');

describe('db/members', () => {
  it('subscribes to members collection group', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToMembers(onStart, onNext, onError);

    expect(subscribeToCollectionGroup).toHaveBeenCalledWith('members', onStart, onNext, onError);
  });
});
