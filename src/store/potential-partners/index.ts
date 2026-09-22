import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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

const setPartner = async (data: DialogData) => {
  const id = data.email.replace(/[^\w\s]/gi, '');
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  await setDoc(doc(db, 'potentialPartners', id), partner);
};

export const addPotentialPartner = async (data: DialogData) => {
  dispatch(pending());

  try {
    await setPartner(data);

    dispatch(success());
  } catch (error) {
    dispatch(failure(error as Error));
  }
};

export default slice.reducer;
