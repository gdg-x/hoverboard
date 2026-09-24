import { doc, getDoc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFeaturedSessions, saveFeaturedSessions } from './featured-sessions';
import { db } from '../firebase';

vi.mock('firebase/firestore');

describe('db/featured-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches featured sessions for a user and returns data or empty object', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(getDoc).mockResolvedValue({
      data: () => ({ 'session-1': true }),
    } as never);

    const result = await fetchFeaturedSessions('user-1');

    expect(doc).toHaveBeenCalledWith(db, 'featuredSessions', 'user-1');
    expect(getDoc).toHaveBeenCalledWith('doc-ref');
    expect(result).toStrictEqual({ 'session-1': true });
  });

  it('returns empty object when doc has no data', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(getDoc).mockResolvedValue({
      data: () => undefined,
    } as never);

    const result = await fetchFeaturedSessions('user-1');

    expect(result).toStrictEqual({});
  });

  it('saves featured sessions for a user', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await saveFeaturedSessions('user-1', { 'session-1': true });

    expect(doc).toHaveBeenCalledWith(db, 'featuredSessions', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', { 'session-1': true });
  });
});
