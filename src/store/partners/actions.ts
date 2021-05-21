import { collection, getDocs, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Partner } from '../../models/partner';
import { PartnerGroup } from '../../models/partner-group';
import { mergeId } from '../../utils/merge-id';
import { order } from '../../utils/order';
import { FETCH_PARTNERS, FETCH_PARTNERS_FAILURE, FETCH_PARTNERS_SUCCESS } from './types';

const getGroupPartners = async (group: PartnerGroup & { id: string }): Promise<PartnerGroup> => {
  const { docs } = await getDocs(query(collection(db, 'partners', group.id, 'items')));
  const items = docs.map<Partner>(mergeId).sort(order);

  return {
    ...group,
    items,
  };
};

const getPartnerGroups = async (): Promise<PartnerGroup[]> => {
  const { docs } = await getDocs(query(collection(db, 'partners')));
  const items = docs.map<PartnerGroup>(mergeId).sort(order);

  return Promise.all(items.map(getGroupPartners));
};

export const fetchPartners = () => async (dispatch: Dispatch) => {
  dispatch({
    type: FETCH_PARTNERS,
  });

  try {
    const partnerGroups = await getPartnerGroups();
    dispatch({
      type: FETCH_PARTNERS_SUCCESS,
      payload: partnerGroups,
    });
  } catch (error) {
    dispatch({
      type: FETCH_PARTNERS_FAILURE,
      payload: error,
    });
  }
};
