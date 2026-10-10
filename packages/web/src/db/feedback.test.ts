import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeFeedback, saveFeedback, subscribeToFeedback } from './feedback';
import { db } from '../firebase';
import type { Feedback, FeedbackId } from '../models/feedback';

vi.mock('firebase/firestore');

const feedback: Feedback = {
  comment: 'Great talk',
  contentRating: 5,
  id: 'user-1',
  parentId: 'session-1',
  styleRating: 4,
  userId: 'user-1',
};

describe('db/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to feedback collection group filtered by userId', () => {
    const unsubscribe = vi.fn();
    vi.mocked(collectionGroup).mockReturnValue('feedback-group' as never);
    vi.mocked(where).mockReturnValue('where-clause' as never);
    vi.mocked(query).mockReturnValue('query-ref' as never);
    vi.mocked(onSnapshot).mockImplementation((_q, onNext) => {
      (onNext as (snapshot: unknown) => void)({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              comment: 'Great talk',
              contentRating: 5,
              styleRating: 4,
              userId: 'user-1',
            }),
            ref: { parent: { parent: { id: 'session-1' } } },
          },
        ],
      });
      return unsubscribe;
    });

    const onNext = vi.fn();
    const onError = vi.fn();

    const unsub = subscribeToFeedback('user-1', onNext, onError);

    expect(unsub).toBe(unsubscribe);
    expect(collectionGroup).toHaveBeenCalledWith(db, 'feedback');
    expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(onNext).toHaveBeenCalledWith([feedback]);
  });

  it('forwards subscription error to onError', () => {
    const error = new Error('boom');
    vi.mocked(onSnapshot).mockImplementation((_q, _onNext, onError) => {
      (onError as unknown as (err: Error) => void)(error);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeToFeedback('user-1', vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('saves the feedback document', () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    saveFeedback(feedback, vi.fn());

    expect(doc).toHaveBeenCalledWith(db, 'sessions', 'session-1', 'feedback', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      contentRating: 5,
      styleRating: 4,
      comment: 'Great talk',
      userId: 'user-1',
    });
  });

  it('removes the feedback document', () => {
    const feedbackId: FeedbackId = { parentId: 'session-1', userId: 'user-1', id: 'user-1' };
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

    removeFeedback(feedbackId, vi.fn());

    expect(doc).toHaveBeenCalledWith(db, 'sessions', 'session-1', 'feedback', 'user-1');
    expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
  });
});
