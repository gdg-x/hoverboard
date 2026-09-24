import type { UnknownAction } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '.';
import type * as DispatchModule from './dispatch';

// `dispatch`/`getState` hold private module-level state (set once by the
// real store). Reset the module registry before each test so every test
// gets its own uninitialized copy instead of leaking state between tests.
let dispatchModule: typeof DispatchModule;

beforeEach(async () => {
  vi.resetModules();
  dispatchModule = await import('./dispatch');
});

describe('dispatch', () => {
  it('throws when used before the store is initialized', () => {
    expect(() => dispatchModule.dispatch({ type: 'anything' })).toThrow(
      'dispatch used before the store was initialized',
    );
  });

  it('forwards actions to the bound dispatch function once initialized', () => {
    const boundDispatch = vi.fn();
    const action: UnknownAction = { type: 'test/action' };
    dispatchModule.setDispatch(boundDispatch);

    dispatchModule.dispatch(action);

    expect(boundDispatch).toHaveBeenCalledWith(action);
  });
});

describe('getState', () => {
  it('throws when used before the store is initialized', () => {
    expect(() => dispatchModule.getState()).toThrow(
      'getState used before the store was initialized',
    );
  });

  it('returns the bound getState function result once initialized', () => {
    const state = { some: 'state' } as unknown as RootState;
    const boundGetState = vi.fn().mockReturnValue(state);
    dispatchModule.setGetState(boundGetState);

    expect(dispatchModule.getState()).toBe(state);
  });
});
