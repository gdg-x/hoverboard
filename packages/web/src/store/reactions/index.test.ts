import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  resetReactions,
  selectAllOwnReactions,
  selectOwnReactionsState,
  selectOwnSessionReactions,
  selectSessionReactions,
  setUserReactions,
  toggled,
  unsyncedReactions,
  unwatchSessionReactions,
  watchSessionReactions,
} from '.';
import type { RootState } from '..';
import { saveReactions, subscribeToOwnReactions, subscribeToReactions } from '../../db/reactions';
import type { Reaction } from '../../models/reaction';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { setPendingIds } from '../sync';
import { selectUserId } from '../user';

vi.mock('../../db/reactions');
vi.mock('../dispatch');
vi.mock('../sync', () => ({ setPendingIds: vi.fn() }));
vi.mock('../snackbars', () => ({
  queueSnackbar: vi.fn((label: string) => ({ type: 'snackbars/queueSnackbar', payload: label })),
}));
vi.mock('../user', () => ({ selectUserId: vi.fn() }));

const reaction: Reaction = { id: 'ada', reactions: ['love'], userId: 'ada' };
const state = (reactions = reducer(undefined, { type: '@@INIT' })) =>
  ({ reactions }) as unknown as RootState;
const actions = () => vi.mocked(dispatch).mock.calls.map(([action]) => action);

afterEach(() => {
  resetReactions();
  vi.clearAllMocks();
});

describe('reactions reducer', () => {
  it('starts with no sessions and no own reactions', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual({
      bySession: {},
      own: new Initialized(),
      ownComplete: false,
    });
  });

  it("tracks each session's reactions", () => {
    const error = new Error('unavailable');
    let next = reducer(undefined, { type: 'reactions/sessionPending', payload: '101' });
    expect(next.bySession['101']).toStrictEqual(new Pending());

    next = reducer(next, {
      type: 'reactions/sessionSuccess',
      payload: { sessionId: '101', reactions: [reaction] },
    });
    next = reducer(next, {
      type: 'reactions/sessionFailure',
      payload: { sessionId: '102', error },
    });
    expect(next.bySession).toStrictEqual({
      '101': new Success([reaction]),
      '102': new Failure(error),
    });

    next = reducer(next, { type: 'reactions/sessionReset', payload: '101' });
    expect(Object.keys(next.bySession)).toEqual(['102']);
  });

  it("tracks the visitor's own reactions", () => {
    const error = new Error('denied');
    let next = reducer(undefined, { type: 'reactions/ownPending' });
    expect(next.own).toStrictEqual(new Pending());
    next = reducer(next, { type: 'reactions/ownSuccess', payload: { '101': ['love'] } });
    expect(next.own).toStrictEqual(new Success({ '101': ['love'] }));
    expect(next.ownComplete).toBe(false);
    next = reducer(next, { type: 'reactions/ownComplete' });
    expect(next.ownComplete).toBe(true);
    next = reducer(next, { type: 'reactions/ownFailure', payload: error });
    expect(next.own).toStrictEqual(new Failure(error));
    next = reducer(next, { type: 'reactions/ownReset' });
    expect(next.own).toStrictEqual(new Initialized());
    expect(next.ownComplete).toBe(false);
  });
});

describe('watchSessionReactions', () => {
  it("listens to a session's reactions once, until unwatched", () => {
    const unsubscribe = vi.fn();
    vi.mocked(subscribeToReactions).mockImplementation((_sessionId, onNext, onError) => {
      onNext([reaction]);
      onError(new Error('unavailable'));
      return unsubscribe;
    });

    watchSessionReactions('101');
    watchSessionReactions('101');

    expect(subscribeToReactions).toHaveBeenCalledOnce();
    expect(actions()).toEqual([
      { type: 'reactions/sessionPending', payload: '101' },
      { type: 'reactions/sessionSuccess', payload: { sessionId: '101', reactions: [reaction] } },
      {
        type: 'reactions/sessionFailure',
        payload: { sessionId: '101', error: new Error('unavailable') },
      },
    ]);

    unwatchSessionReactions('101');

    expect(unsubscribe).toHaveBeenCalled();
    expect(actions().at(-1)).toEqual({ type: 'reactions/sessionReset', payload: '101' });
  });

  it('reads a session that no page watches as not loaded', () => {
    expect(selectSessionReactions(state(), '999')).toStrictEqual(new Initialized());
  });
});

describe('unsyncedReactions', () => {
  it('is empty when nothing is pending', () => {
    expect(unsyncedReactions({ '101': ['love'] }, false, {})).toEqual([]);
  });

  it('lists every session before the server has answered', () => {
    expect(unsyncedReactions({ '101': ['love'], '102': ['funny'] }, true, undefined)).toEqual([
      '101',
      '102',
    ]);
  });

  it('lists the sessions whose reactions changed, were added or were removed', () => {
    expect(
      unsyncedReactions({ '101': ['love', 'funny'], '102': ['applause'], '104': ['funny'] }, true, {
        '101': ['funny', 'love'],
        '102': ['love'],
        '103': ['love'],
      }),
    ).toEqual(['102', '104', '103']);
  });
});

describe("the visitor's own reactions", () => {
  beforeEach(() => {
    vi.mocked(getState).mockReturnValue(state());
  });

  it('start listening the first time they are read while signed in, and report what is unsynced', () => {
    vi.mocked(selectUserId).mockReturnValue('ada');
    vi.mocked(subscribeToOwnReactions).mockImplementation((_userId, onNext) => {
      onNext({ '101': ['love'] }, false, false);
      onNext({ '101': ['love', 'funny'] }, true, false);
      return vi.fn();
    });

    selectOwnReactionsState(state());
    selectOwnReactionsState(state());

    expect(subscribeToOwnReactions).toHaveBeenCalledOnce();
    expect(subscribeToOwnReactions).toHaveBeenCalledWith(
      'ada',
      expect.any(Function),
      expect.any(Function),
    );
    expect(vi.mocked(setPendingIds).mock.calls).toEqual([
      ['reactions', []],
      ['reactions', ['101']],
    ]);
    expect(actions()).toEqual([
      { type: 'reactions/ownPending', payload: undefined },
      { type: 'reactions/ownSuccess', payload: { '101': ['love'] } },
      { type: 'reactions/ownSuccess', payload: { '101': ['love', 'funny'] } },
    ]);
  });

  it('report a listener error', () => {
    vi.mocked(selectUserId).mockReturnValue('ada');
    vi.mocked(subscribeToOwnReactions).mockImplementation((_userId, _onNext, onError) => {
      onError(new Error('denied'));
      return vi.fn();
    });

    selectOwnReactionsState(state());

    expect(actions().at(-1)).toEqual({
      type: 'reactions/ownFailure',
      payload: new Error('denied'),
    });
  });

  it("aren't listened to while signed out", () => {
    vi.mocked(selectUserId).mockReturnValue(undefined);

    expect(selectOwnReactionsState(state())).toStrictEqual(new Initialized());
    expect(subscribeToOwnReactions).not.toHaveBeenCalled();
  });

  it('mark them complete once the server answers', () => {
    vi.mocked(selectUserId).mockReturnValue('ada');
    let complete = false;
    vi.mocked(getState).mockImplementation(() =>
      state({ ...reducer(undefined, { type: '@@INIT' }), ownComplete: complete }),
    );
    vi.mocked(subscribeToOwnReactions).mockImplementation((_userId, onNext) => {
      onNext({ '101': ['love'] }, false, false);
      onNext({ '101': ['love'], '102': ['funny'] }, false, true);
      complete = true;
      onNext({ '101': ['love'] }, false, true);
      return vi.fn();
    });

    selectOwnReactionsState(state());

    expect(actions().filter(({ type }) => type === 'reactions/ownComplete')).toHaveLength(1);
    expect(actions().findIndex(({ type }) => type === 'reactions/ownComplete')).toBe(3);
  });

  it('are all known only once the server has answered', () => {
    const cached = reducer(undefined, {
      type: 'reactions/ownSuccess',
      payload: { '101': ['love'] },
    });
    const complete = reducer(cached, { type: 'reactions/ownComplete' });

    expect(selectAllOwnReactions(state(cached))).toBeUndefined();
    expect(selectAllOwnReactions(state(complete))).toEqual({ '101': ['love'] });
    expect(
      selectAllOwnReactions(state(reducer(undefined, { type: 'reactions/ownComplete' }))),
    ).toBeUndefined();
  });

  it("are a session's reactions once loaded, and none before", () => {
    const loaded = state(
      reducer(undefined, { type: 'reactions/ownSuccess', payload: { '101': ['love'] } }),
    );

    expect(selectOwnSessionReactions(loaded, '101')).toEqual(['love']);
    expect(selectOwnSessionReactions(loaded, '102')).toEqual([]);
    expect(selectOwnSessionReactions(state(), '101')).toEqual([]);
  });

  it('stop, with what the server confirmed, when the visitor signs out', () => {
    const unsubscribe = vi.fn();
    vi.mocked(selectUserId).mockReturnValue('ada');
    vi.mocked(subscribeToOwnReactions).mockReturnValue(unsubscribe);
    selectOwnReactionsState(state());

    resetReactions();

    expect(unsubscribe).toHaveBeenCalled();
    expect(actions().at(-1)).toEqual({ type: 'reactions/ownReset', payload: undefined });
  });
});

describe('toggled', () => {
  it('adds a reaction, in the picker’s order', () => {
    expect(toggled(['funny'], 'love')).toEqual(['love', 'funny']);
  });

  it('takes a reaction away', () => {
    expect(toggled(['love', 'funny'], 'love')).toEqual(['funny']);
  });
});

describe('setUserReactions', () => {
  it("saves the reactions in the picker's order, once each", () => {
    setUserReactions('101', 'ada', ['funny', 'love', 'funny']);

    expect(saveReactions).toHaveBeenCalledWith(
      '101',
      'ada',
      ['love', 'funny'],
      expect.any(Function),
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('says so when the server refuses them', () => {
    vi.mocked(saveReactions).mockImplementation((_sessionId, _userId, _reactions, onRejected) =>
      onRejected(new Error('permission-denied')),
    );

    setUserReactions('101', 'ada', ['love']);

    expect(queueSnackbar).toHaveBeenCalledWith("Couldn't save your reaction. Try again.");
  });
});
