import { Dispatch } from 'redux';
import { db } from '../db';
import { FETCH_PARTNERS, FETCH_PARTNERS_FAILURE, FETCH_PARTNERS_SUCCESS } from './types';

const _getPartnerItems = (groupId: string) =>
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

export const fetchPartners = () => (dispatch: Dispatch) => {
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
};
