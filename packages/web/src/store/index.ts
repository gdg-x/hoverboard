import { configureStore } from '@reduxjs/toolkit';
import { isServer } from 'lit';
import { seedFromPage } from './content';
import { reducers } from './reducers';
import { setDispatch, setGetState } from './dispatch';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  reducer: reducers,
});

// Lets slice modules dispatch/read state without importing `store` (and
// therefore `reducers.ts`, which imports every slice) at their own module
// top level, which would create a circular dependency resolved in an
// undefined order.
setDispatch(store.dispatch);
setGetState(store.getState);

// Components read the store when they hydrate, so it must hold what the server rendered with.
if (!isServer) {
  seedFromPage(store.dispatch);
  document.addEventListener('astro:after-swap', () => seedFromPage(store.dispatch));
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
