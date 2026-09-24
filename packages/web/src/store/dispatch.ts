import type { UnknownAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '.';

let dispatchFn: AppDispatch | undefined;
let getStateFn: (() => RootState) | undefined;

/** Wires up the real store's dispatch/getState once the store is created.
 * Called once from `store/index.ts`. */
export const setDispatch = (fn: AppDispatch): void => {
  dispatchFn = fn;
};

export const setGetState = (fn: () => RootState): void => {
  getStateFn = fn;
};

/**
 * Lazily-bound dispatch. Slice modules should import this instead of
 * `store` from `store/index.ts` to avoid a circular dependency: every slice
 * is imported by `reducers.ts`, which is imported by `store/index.ts`, so a
 * slice importing `store` directly can be loaded before the store exists,
 * leaving its reducer unresolved when `combineReducers` runs.
 */
export const dispatch = (action: UnknownAction): void => {
  if (!dispatchFn) {
    throw new Error('dispatch used before the store was initialized');
  }
  dispatchFn(action);
};

/** Lazily-bound getState, mirroring `dispatch` above. */
export const getState = (): RootState => {
  if (!getStateFn) {
    throw new Error('getState used before the store was initialized');
  }
  return getStateFn();
};
