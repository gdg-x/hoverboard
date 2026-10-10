import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Unsubscribe } from 'firebase/firestore';
import type { RootState } from '..';
import {
  type OwnReactions,
  saveReactions,
  subscribeToOwnReactions,
  subscribeToReactions,
} from '../../db/reactions';
import { type Reaction, REACTIONS, type ReactionId } from '../../models/reaction';
import { dispatch, getState } from '../dispatch';
import { queueSnackbar } from '../snackbars';
import { setPendingIds } from '../sync';
import { selectUserId } from '../user';

export type { OwnReactions };

export type SessionReactionsState = RemoteData<Error, Reaction[]>;

export interface ReactionsState {
  /** Everyone's reactions, newest first, by session ID, for the sessions a page watches. */
  bySession: Record<string, SessionReactionsState>;
  /** The visitor's own reactions in every session. */
  own: RemoteData<Error, OwnReactions>;
}

const initialState: ReactionsState = { bySession: {}, own: new Initialized() };

const slice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    sessionPending: (state, action: PayloadAction<string>) => {
      state.bySession[action.payload] = new Pending();
    },
    sessionSuccess: (
      state,
      action: PayloadAction<{ sessionId: string; reactions: Reaction[] }>,
    ) => {
      state.bySession[action.payload.sessionId] = new Success(action.payload.reactions);
    },
    sessionFailure: (state, action: PayloadAction<{ sessionId: string; error: Error }>) => {
      state.bySession[action.payload.sessionId] = new Failure(action.payload.error);
    },
    sessionReset: (state, action: PayloadAction<string>) => {
      delete state.bySession[action.payload];
    },
    ownPending: (state) => {
      state.own = new Pending();
    },
    ownSuccess: (state, action: PayloadAction<OwnReactions>) => {
      state.own = new Success(action.payload);
    },
    ownFailure: (state, action: PayloadAction<Error>) => {
      state.own = new Failure(action.payload);
    },
    ownReset: (state) => {
      state.own = new Initialized();
    },
  },
});

const {
  sessionPending,
  sessionSuccess,
  sessionFailure,
  sessionReset,
  ownPending,
  ownSuccess,
  ownFailure,
  ownReset,
} = slice.actions;

const sessionListeners = new Map<string, Unsubscribe>();
let ownListener: Unsubscribe | undefined;
// The visitor's reactions as the server last confirmed them, to tell which haven't synced.
let confirmed: OwnReactions | undefined;

/** Listens to everyone's reactions to a session, until `unwatchSessionReactions()`. */
export const watchSessionReactions = (sessionId: string): void => {
  if (sessionListeners.has(sessionId)) return;
  dispatch(sessionPending(sessionId));
  sessionListeners.set(
    sessionId,
    subscribeToReactions(
      sessionId,
      (reactions) => dispatch(sessionSuccess({ sessionId, reactions })),
      (error) => dispatch(sessionFailure({ sessionId, error })),
    ),
  );
};

export const unwatchSessionReactions = (sessionId: string): void => {
  sessionListeners.get(sessionId)?.();
  sessionListeners.delete(sessionId);
  dispatch(sessionReset(sessionId));
};

const sameReactions = (a: readonly ReactionId[] = [], b: readonly ReactionId[] = []) =>
  a.length === b.length && a.every((reaction) => b.includes(reaction));

/** The sessions whose reactions differ from the server's. All of them, before the server has answered. */
export const unsyncedReactions = (
  reactions: OwnReactions,
  pending: boolean,
  confirmedReactions: OwnReactions | undefined,
): string[] => {
  if (!pending) return [];
  if (!confirmedReactions) return Object.keys(reactions);
  const ids = new Set([...Object.keys(reactions), ...Object.keys(confirmedReactions)]);
  return [...ids].filter((id) => !sameReactions(reactions[id], confirmedReactions[id]));
};

const subscribeToOwn = () => {
  const userId = selectUserId(getState());
  if (!userId || ownListener) return;
  dispatch(ownPending());
  ownListener = subscribeToOwnReactions(
    userId,
    (reactions, pending) => {
      setPendingIds('reactions', unsyncedReactions(reactions, pending, confirmed));
      if (!pending) confirmed = reactions;
      dispatch(ownSuccess(reactions));
    },
    (error) => dispatch(ownFailure(error)),
  );
};

/** The reactions with `reaction` added, or taken away if it was there, in the picker's order. */
export const toggled = (reactions: readonly ReactionId[], reaction: ReactionId): ReactionId[] =>
  REACTIONS.filter((id) => (id === reaction ? !reactions.includes(id) : reactions.includes(id)));

/** Saves the visitor's reactions to a session. The listeners show them at once, and again if the server refuses them. */
export const setUserReactions = (
  sessionId: string,
  userId: string,
  reactions: readonly ReactionId[],
): void =>
  saveReactions(
    sessionId,
    userId,
    REACTIONS.filter((id) => reactions.includes(id)),
    () =>
      dispatch(
        queueSnackbar(
          msg("Couldn't save your reaction. Try again.", { id: 'store.reactions.failed' }),
        ),
      ),
  );

/** Stops listening to the visitor's own reactions, when they sign out. */
export const resetReactions = (): void => {
  ownListener?.();
  ownListener = undefined;
  confirmed = undefined;
  dispatch(ownReset());
};

export const selectSessionReactions = (
  state: RootState,
  sessionId: string,
): SessionReactionsState => state.reactions.bySession[sessionId] ?? new Initialized();

/** Starts listening, once, the first time it's read while signed in. */
export const selectOwnReactionsState = (state: RootState): ReactionsState['own'] => {
  if (state.reactions.own instanceof Initialized) subscribeToOwn();
  return state.reactions.own;
};

/** The visitor's reactions to a session. */
export const selectOwnSessionReactions = (state: RootState, sessionId: string): ReactionId[] => {
  const own = selectOwnReactionsState(state);
  return own instanceof Success ? (own.data[sessionId] ?? []) : [];
};

export default slice.reducer;
