import { Dispatch } from 'redux';
import { db } from '../db';
import { DialogForm } from '../dialogs/types';
import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
} from './types';

export const addPotentialPartner = (data: DialogForm) => (dispatch: Dispatch) => {
  dispatch({
    type: ADD_POTENTIAL_PARTNER,
    payload: data,
  });

  const id = data.email.replace(/[^\w\s]/gi, '');
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  db()
    .collection('potentialPartners')
    .doc(id)
    .set(partner)
    .then(() => {
      dispatch({
        type: ADD_POTENTIAL_PARTNER_SUCCESS,
        payload: { partner },
      });
    })
    .catch((error) => {
      dispatch({
        type: ADD_POTENTIAL_PARTNER_FAILURE,
        payload: { error },
      });
    });
};
