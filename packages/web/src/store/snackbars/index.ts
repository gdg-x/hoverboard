import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Snackbar } from '../../models/snackbar';

let id = 0;

const snackbarsSlice = createSlice({
  name: 'snackbars',
  initialState: [] as Snackbar[],
  reducers: {
    queueSnackbar(state, action: PayloadAction<string>) {
      state.push({
        id: id++,
        label: action.payload,
      });
    },
    queueComplexSnackbar(state, action: PayloadAction<Omit<Snackbar, 'id'>>) {
      state.push({
        id: id++,
        ...action.payload,
      });
    },
    removeSnackbar(state, action: PayloadAction<number>) {
      const index = state.findIndex((snackbar) => snackbar.id === action.payload);
      state.splice(index, 1);
    },
  },
});

export const { queueSnackbar, queueComplexSnackbar, removeSnackbar } = snackbarsSlice.actions;
export default snackbarsSlice.reducer;
