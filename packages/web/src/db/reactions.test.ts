import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../firebase';
import {
  newestFirst,
  saveReactions,
  subscribeToOwnReactions,
  subscribeToReactions,
} from './reactions';

vi.mock('firebase/firestore');

const timestamp = (iso: string) => ({ toDate: () => new Date(iso) });

const snapshot = (sessionId: string, id: string, data: object) => ({
  id,
  data: vi.fn(() => data),
  ref: { parent: { parent: { id: sessionId } } },
});

type Listener = (snapshot: unknown) => void;

describe('db/reactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listens to a session's reactions, newest first, with pending times estimated", () => {
    const unsubscribe = vi.fn();
    vi.mocked(collection).mockReturnValue('reactions-ref' as never);
    const older = snapshot('101', 'ada', {
      reactions: ['love'],
      userId: 'ada',
      updatedAt: timestamp('2026-10-01T10:00:00Z'),
    });
    const newer = snapshot('101', 'grace', {
      reactions: ['applause', 'funny'],
      userId: 'grace',
      updatedAt: timestamp('2026-10-02T10:00:00Z'),
    });
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext) => {
      (onNext as unknown as Listener)({ docs: [older, newer] });
      return unsubscribe;
    });
    const onNext = vi.fn();

    expect(subscribeToReactions('101', onNext, vi.fn())).toBe(unsubscribe);

    expect(collection).toHaveBeenCalledWith(db, 'sessions', '101', 'reactions');
    expect(older.data).toHaveBeenCalledWith({ serverTimestamps: 'estimate' });
    expect(onNext).toHaveBeenCalledWith([
      {
        id: 'grace',
        reactions: ['applause', 'funny'],
        userId: 'grace',
        updatedAt: new Date('2026-10-02T10:00:00Z'),
      },
      {
        id: 'ada',
        reactions: ['love'],
        userId: 'ada',
        updatedAt: new Date('2026-10-01T10:00:00Z'),
      },
    ]);
  });

  it('reports listener errors', () => {
    const error = new Error('unavailable');
    vi.mocked(onSnapshot).mockImplementation((_ref, _onNext, onError) => {
      (onError as unknown as (error: Error) => void)(error);
      return vi.fn();
    });
    const onError = vi.fn();

    subscribeToReactions('101', vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('sorts reactions without a time last', () => {
    const dated = { id: 'a', reactions: [], userId: 'a', updatedAt: new Date(1) };
    const undated = { id: 'b', reactions: [], userId: 'b' };

    expect([undated, dated].sort(newestFirst)).toEqual([dated, undated]);
  });

  it("listens to the visitor's reactions in every session, and whether they've synced", () => {
    vi.mocked(collectionGroup).mockReturnValue('group' as never);
    vi.mocked(where).mockReturnValue('where' as never);
    vi.mocked(query).mockReturnValue('query' as never);
    vi.mocked(onSnapshot).mockImplementation((_query, _options, onNext) => {
      (onNext as unknown as Listener)({
        docs: [
          snapshot('101', 'ada', { reactions: ['love'], userId: 'ada' }),
          snapshot('102', 'ada', { reactions: ['funny', 'applause'], userId: 'ada' }),
        ],
        metadata: { hasPendingWrites: true },
      });
      return vi.fn();
    });
    const onNext = vi.fn();

    subscribeToOwnReactions('ada', onNext, vi.fn());

    expect(collectionGroup).toHaveBeenCalledWith(db, 'reactions');
    expect(where).toHaveBeenCalledWith('userId', '==', 'ada');
    expect(onSnapshot).toHaveBeenCalledWith(
      'query',
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function),
    );
    expect(onNext).toHaveBeenCalledWith({ '101': ['love'], '102': ['funny', 'applause'] }, true);
  });

  it("saves the visitor's reactions with the server's time", () => {
    vi.mocked(doc).mockReturnValue('reaction-ref' as never);
    vi.mocked(serverTimestamp).mockReturnValue('server-time' as never);
    vi.mocked(setDoc).mockResolvedValue();

    saveReactions('101', 'ada', ['love', 'funny'], vi.fn());

    expect(doc).toHaveBeenCalledWith(db, 'sessions', '101', 'reactions', 'ada');
    expect(setDoc).toHaveBeenCalledWith('reaction-ref', {
      reactions: ['love', 'funny'],
      userId: 'ada',
      updatedAt: 'server-time',
    });
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it('deletes the document when no reactions are left, and reports a rejection', async () => {
    const error = new Error('permission-denied');
    vi.mocked(doc).mockReturnValue('reaction-ref' as never);
    vi.mocked(deleteDoc).mockRejectedValue(error);
    const onRejected = vi.fn();

    saveReactions('101', 'ada', [], onRejected);

    expect(deleteDoc).toHaveBeenCalledWith('reaction-ref');
    expect(setDoc).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onRejected).toHaveBeenCalledWith(error));
  });
});
