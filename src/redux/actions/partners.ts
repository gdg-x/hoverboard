import {
  ADD_POTENTIAL_PARTNER,
  ADD_POTENTIAL_PARTNER_FAILURE,
  ADD_POTENTIAL_PARTNER_SUCCESS,
  FETCH_PARTNERS,
  FETCH_PARTNERS_FAILURE,
  FETCH_PARTNERS_SUCCESS,
} from '../constants';
import { db } from '../db';

const _getPartnerItems = (groupId) =>
  db()
    .collection('partners')
    .doc(groupId)
    .collection('items')
    .get()
    .then((snaps) => {
      return snaps.docs
        .map((snap) => Object.assign({}, snap.data(), { id: snap.id }))
        .sort((a, b) => a.order - b.order);
    });

export const partnersActions = {
  addPartner: (data) => (dispatch) => {
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
  },
  fetchPartners: () => (dispatch) => {
    dispatch({
      type: FETCH_PARTNERS,
    });

    db()
      .collection('partners')
      .get()
      .then((snaps) =>
        Promise.all(
          snaps.docs.map((snap) => Promise.all([snap.data(), snap.id, _getPartnerItems(snap.id)]))
        )
      )
      .then((groups) =>
        groups.map(([group, id, items]) => {
          return Object.assign({}, group, { id, items });
        })
      )
      .then((list) => {
        dispatch({
          type: FETCH_PARTNERS_SUCCESS,
          payload: {
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_PARTNERS_FAILURE,
          payload: { error },
        });
      });
  },
};
