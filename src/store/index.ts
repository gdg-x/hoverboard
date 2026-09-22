import { configureStore } from '@reduxjs/toolkit';
import { reducers } from './reducers';
import { setDispatch } from './dispatch';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  reducer: reducers,
});

// Lets slice modules dispatch without importing `store` (and therefore
// `reducers.ts`, which imports every slice) at their own module top level,
// which would create a circular dependency resolved in an undefined order.
setDispatch(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
