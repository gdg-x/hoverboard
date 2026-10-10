import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  deleteFeedback,
  initialState,
  selectFeedbackById,
  setFeedback,
  subscribe,
} from '.';
import {
  removeFeedback,
  saveFeedback,
  subscribeToFeedback as subscribeFeedback,
} from '../../db/feedback';
import type { Feedback } from '../../models/feedback';
import type { RootState } from '..';
import { dispatch } from '../dispatch';
import { setPendingIds } from '../sync';

vi.mock('../../db/feedback');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ setPendingIds: vi.fn() }));

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
    vi.mocked(subscribeFeedback).mockReturnValue(unsubscribe);

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
        subscription: new Success(unsubscribe),
        data: new Success([feedback]),
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
});

describe('feedback writes and subscriptions', () => {
  it('subscribes to the feedback collection group and dispatches mapped snapshot data', () => {
    const unsubscribe = vi.fn();
    vi.mocked(subscribeFeedback).mockImplementation((_userId, next) => {
      next([feedback], ['session-1']);
      return unsubscribe;
    });

    expect(subscribe('user-1')).toBe(unsubscribe);
    expect(setPendingIds).toHaveBeenCalledWith('feedback', ['session-1']);
    expect(subscribeFeedback).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feedback/setSuccess',
        payload: [feedback],
      }),
    );
  });

  it('dispatches subscription errors from Firestore', () => {
    const error = new Error('boom');
    vi.mocked(subscribeFeedback).mockImplementation((_userId, _next, onError) => {
      onError(error);
      return vi.fn();
    });

    subscribe('user-1');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feedback/setFailure',
        payload: error,
      }),
    );
  });

  it('writes and deletes feedback, passing on the rejection callback', () => {
    const id = { parentId: 'session-1', userId: 'user-1', id: 'user-1' };
    const onRejected = vi.fn();

    setFeedback(feedback, onRejected);
    deleteFeedback(id, onRejected);

    expect(saveFeedback).toHaveBeenCalledWith(feedback, onRejected);
    expect(removeFeedback).toHaveBeenCalledWith(id, onRejected);
  });
});

describe('selectFeedbackById', () => {
  it('dispatches a lazy subscription and returns Pending when a signed-in user first reads feedback', () => {
    const state = {
      user: new Success({ uid: 'user-1' }),
      feedback: initialState,
    } as unknown as RootState;

    expect(selectFeedbackById(state, 'session-1')).toStrictEqual(new Pending());
    expect(dispatch).toHaveBeenCalledWith(
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
