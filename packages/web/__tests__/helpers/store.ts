import { vi } from 'vitest';
import { type RootState, store } from '../../src/store';

/**
 * Overrides parts of the store state for components that read it through `StoreController`, and
 * notifies subscribers. Undo with `vi.restoreAllMocks()`.
 */
export const setStoreState = (partial: Partial<RootState>) => {
  vi.spyOn(store, 'getState').mockReturnValue({ ...store.getState(), ...partial });
  store.dispatch({ type: 'test/state-overridden' });
};
