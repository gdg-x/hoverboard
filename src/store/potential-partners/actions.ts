import { Dispatch } from 'redux';
import { db } from '../db';
import { DialogForm } from '../dialogs/types';
import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  PotentialPartnerActions,
} from './types';

const setPotentialPartner = async (data: DialogForm): Promise<string> => {
  const id = data.email.replace(/[^\w]/gi, '');
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  // TODO: Fix collection path
  await db().collection('potentialPartnersx').doc(id).set(partner);
  return id;
};

export const addPotentialPartner = (data: DialogForm) => async (
  dispatch: Dispatch<PotentialPartnerActions>
) => {
  dispatch({
    type: ADD_POTENTIAL_PARTNER,
  });

  try {
    dispatch({
      type: ADD_POTENTIAL_PARTNER_SUCCESS,
      payload: await setPotentialPartner(data),
    });
  } catch (error) {
    dispatch({
      type: ADD_POTENTIAL_PARTNER_FAILURE,
      payload: error,
    });
  }
};
