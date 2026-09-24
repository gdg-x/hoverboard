import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { savePotentialPartner } from '../../db/potential-partners';
import { DialogData } from '../../models/dialog-form';
import { dispatch } from '../dispatch';

export type PotentialPartnersState = RemoteData<Error, true>;

export const initialPotentialPartnersState: PotentialPartnersState = new Initialized();
const initialState = initialPotentialPartnersState;

const slice = createSlice({
  name: 'potentialPartners',
  initialState: initialState as PotentialPartnersState,
  reducers: {
    pending: (): PotentialPartnersState => new Pending(),
    failure: (_state, action: PayloadAction<Error>): PotentialPartnersState =>
      new Failure(action.payload),
    success: (): PotentialPartnersState => new Success(true),
  },
});

const { pending, failure, success } = slice.actions;

export const addPotentialPartner = async (data: DialogData) => {
  dispatch(pending());

  try {
    await savePotentialPartner(data);

    dispatch(success());
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export default slice.reducer;
