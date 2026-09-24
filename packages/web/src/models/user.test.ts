import type { User as FirebaseUser } from 'firebase/auth';
import { describe, expect, it, vi } from 'vitest';
import { toUser } from './user';

describe('toUser', () => {
  it('converts a Firebase user to a plain User via toJSON', () => {
    const json = { uid: '123', displayName: 'Ada Lovelace', email: 'ada@example.com' };
    const firebaseUser = { toJSON: vi.fn().mockReturnValue(json) } as unknown as FirebaseUser;

    expect(toUser(firebaseUser)).toStrictEqual(json);
    expect(firebaseUser.toJSON).toHaveBeenCalled();
  });
});
