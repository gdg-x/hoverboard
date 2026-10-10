import { Success } from '@abraham/remotedata';
import { doc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveFeaturedSessions, subscribeToFeaturedSessions } from './featured-sessions';
import { db } from '../firebase';
import { subscribeToDocument } from '../utils/firestore';

vi.mock('firebase/firestore');
vi.mock('../utils/firestore', () => ({ subscribeToDocument: vi.fn() }));

describe('db/featured-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listens to the visitor's bookmarks, without the document ID", () => {
    const onNext = vi.fn();
    const subscription = new Success(vi.fn());
    vi.mocked(subscribeToDocument).mockImplementation((_path, _onStart, next) => {
      next({ 'session-1': true, id: 'user-1' }, { pending: true });
      next(undefined, { pending: false });
      return subscription;
    });

    expect(subscribeToFeaturedSessions('user-1', vi.fn(), onNext, vi.fn())).toBe(subscription);

    expect(subscribeToDocument).toHaveBeenCalledWith(
      'featuredSessions/user-1',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    expect(onNext.mock.calls).toEqual([
      [{ 'session-1': true }, { pending: true }],
      [{}, { pending: false }],
    ]);
  });

  it('saves featured sessions for a user', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await saveFeaturedSessions('user-1', { 'session-1': true });

    expect(doc).toHaveBeenCalledWith(db, 'featuredSessions', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', { 'session-1': true });
  });
});
