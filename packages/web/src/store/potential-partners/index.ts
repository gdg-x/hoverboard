import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { savePotentialPartner } from '../../db/potential-partners';
import type { DialogData } from '../../models/dialog-form';
import { dispatch } from '../dispatch';
import { canWriteNow } from '../sync';

export type PotentialPartnersState = RemoteData<Error, true>;

export const initialPotentialPartnersState: PotentialPartnersState = new Initialized();
const initialState = initialPotentialPartnersState;

const slice = createSlice({
  name: 'potentialPartners',
  initialState: initialState as PotentialPartnersState,
  reducers: {
    failure: (_state, action: PayloadAction<Error>): PotentialPartnersState =>
      new Failure(action.payload),
    success: (): PotentialPartnersState => new Success(true),
  },
});

const { failure, success } = slice.actions;

/** Sends the form, without waiting for the server. Visitors without an account need the network. */
export const addPotentialPartner = (data: DialogData): void => {
  if (!canWriteNow()) {
    dispatch(failure(new Error('Offline')));
    return;
  }
  savePotentialPartner(data, (error) => dispatch(failure(error)));
  dispatch(success());
};

export default slice.reducer;
