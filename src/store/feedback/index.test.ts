import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import reducer, {
  deleteFeedback,
  initialState,
  selectFeedbackById,
  setFeedback,
  subscribe,
} from '.';
import { db } from '../../firebase';
import { Feedback } from '../../models/feedback';
import { store } from '..';
import { RootState } from '..';

vi.mock('firebase/firestore');
vi.mock('..', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

const feedback: Feedback = {
  comment: 'Great talk',
  contentRating: 5,
  id: 'user-1',
  parentId: 'session-1',
  styleRating: 4,
  userId: 'user-1',
};

describe('feedback', () => {
  it('starts with Initialized sub-states', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialState);
  });

  it('subscribes and marks the feedback data as pending', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribe);

    const state = reducer(initialState, {
      type: 'feedback/subscribeToFeedback',
      payload: 'user-1',
    });

    expect(state.subscription).toStrictEqual(new Success(unsubscribe));
    expect(state.data).toStrictEqual(new Pending());
  });

  it('unsubscribes and resets all feedback sub-states', () => {
    const unsubscribe = vi.fn();
    const state = reducer(
      {
        set: new Success({ parentId: 'session-1', userId: 'user-1', id: 'user-1' }),
        subscription: new Success(unsubscribe),
        data: new Success([feedback]),
        delete: new Success({ parentId: 'session-1', userId: 'user-1', id: 'user-1' }),
      },
      {
        type: 'feedback/unsubscribeFromFeedback',
      },
    );

    expect(unsubscribe).toHaveBeenCalled();
    expect(state).toStrictEqual(initialState);
  });

  it('stores subscription success and failure payloads', () => {
    const error = new Error('boom');

    expect(
      reducer(initialState, {
        type: 'feedback/setSuccess',
        payload: [feedback],
      }).data,
    ).toStrictEqual(new Success([feedback]));

    expect(
      reducer(initialState, {
        type: 'feedback/setFailure',
        payload: error,
      }).data,
    ).toStrictEqual(new Failure(error));
  });

  it('handles async set and delete reducer transitions', () => {
    const savedId = { parentId: 'session-1', userId: 'user-1', id: 'user-1' };

    expect(reducer(initialState, setFeedback.pending('request-id', feedback)).set).toStrictEqual(
      new Pending(),
    );
    expect(
      reducer(initialState, setFeedback.fulfilled(savedId, 'request-id', feedback)).set,
    ).toStrictEqual(new Success(savedId));
    expect(
      reducer(initialState, {
        type: setFeedback.rejected.type,
        error: { message: 'save failed' },
      }).set,
    ).toStrictEqual(new Failure(new Error('save failed')));

    expect(
      reducer(
        initialState,
        deleteFeedback.pending('request-id', {
          parentId: 'session-1',
          userId: 'user-1',
          id: 'user-1',
        }),
      ).delete,
    ).toStrictEqual(new Pending());
    expect(
      reducer(initialState, deleteFeedback.fulfilled(savedId, 'request-id', savedId)).delete,
    ).toStrictEqual(new Success(savedId));
    expect(
      reducer(initialState, {
        type: deleteFeedback.rejected.type,
        error: { message: 'delete failed' },
      }).delete,
    ).toStrictEqual(new Failure(new Error('delete failed')));
  });
});

describe('feedback thunks and subscriptions', () => {
  it('subscribes to the feedback collection group and dispatches mapped snapshot data', () => {
    const unsubscribe = vi.fn();
    vi.mocked(collectionGroup).mockReturnValue('feedback-group' as never);
    vi.mocked(where).mockReturnValue('where-clause' as never);
    vi.mocked(query).mockReturnValue('query-ref' as never);
    vi.mocked(onSnapshot).mockImplementation((_query, next) => {
      (next as (snapshot: unknown) => void)({
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

    expect(subscribe('user-1')).toBe(unsubscribe);
    expect(collectionGroup).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feedback/setSuccess',
        payload: [feedback],
      }),
    );
  });

  it('dispatches subscription errors from Firestore', () => {
    const error = new Error('boom');
    vi.mocked(onSnapshot).mockImplementation((_query, _next, onError) => {
      (onError as unknown as (error: Error) => void)(error);
      return vi.fn();
    });

    subscribe('user-1');

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feedback/setFailure',
        payload: error,
      }),
    );
  });

  it('writes feedback documents and returns their id payload', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    const action = await setFeedback(feedback)(vi.fn(), vi.fn(), undefined);

    expect(doc).toHaveBeenCalledWith(db, 'sessions', 'session-1', 'feedback', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      comment: 'Great talk',
      contentRating: 5,
      styleRating: 4,
      userId: 'user-1',
    });
    expect(action.payload).toStrictEqual({
      parentId: 'session-1',
      userId: 'user-1',
      id: 'user-1',
    });
  });

  it('deletes feedback documents and returns their id payload', async () => {
    const id = { parentId: 'session-1', userId: 'user-1', id: 'user-1' };
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    const action = await deleteFeedback(id)(vi.fn(), vi.fn(), undefined);

    expect(doc).toHaveBeenCalledWith(db, 'sessions', 'session-1', 'feedback', 'user-1');
    expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
    expect(action.payload).toStrictEqual(id);
  });
});

describe('selectFeedbackById', () => {
  it('dispatches a lazy subscription and returns Pending when a signed-in user first reads feedback', () => {
    const state = {
      user: new Success({ uid: 'user-1' }),
      feedback: initialState,
    } as unknown as RootState;

    expect(selectFeedbackById(state, 'session-1')).toStrictEqual(new Pending());
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feedback/subscribeToFeedback',
        payload: 'user-1',
      }),
    );
  });

  it('returns the matching feedback when loaded', () => {
    const state = {
      user: new Success({ uid: 'user-1' }),
      feedback: {
        ...initialState,
        subscription: new Success(vi.fn()),
        data: new Success([feedback]),
      },
    } as unknown as RootState;

    expect(selectFeedbackById(state, 'session-1')).toStrictEqual(new Success(feedback));
    expect(selectFeedbackById(state, 'missing-session')).toStrictEqual(new Success(false));
  });

  it('returns Pending while subscribed but data has not arrived yet', () => {
    const state = {
      user: new Success({ uid: 'user-1' }),
      feedback: {
        ...initialState,
        subscription: new Success(vi.fn()),
        data: new Initialized(),
      },
    } as unknown as RootState;

    expect(selectFeedbackById(state, 'session-1')).toStrictEqual(new Pending());
  });

  it('returns the feedback failure when not subscribed', () => {
    const error = new Error('boom');
    const state = {
      user: new Initialized(),
      feedback: {
        ...initialState,
        data: new Failure(error),
      },
    } as unknown as RootState;

    expect(selectFeedbackById(state, 'session-1')).toStrictEqual(new Failure(error));
  });
});
