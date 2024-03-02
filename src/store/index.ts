import { configureStore } from '@reduxjs/toolkit';
import { reducers } from './reducers';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  reducer: reducers,
});

export type RootState = ReturnType<typeof store.getState>;
