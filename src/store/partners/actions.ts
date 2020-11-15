import { Dispatch } from 'redux';
import { Partner } from '../../models/partner';
import { PartnerGroup } from '../../models/partner-group';
import { db } from '../db';
import { mergeId, order } from '../utils';
import { FETCH_PARTNERS, FETCH_PARTNERS_FAILURE, FETCH_PARTNERS_SUCCESS } from './types';

const getGroupPartners = async (group: PartnerGroup & { id: string }): Promise<PartnerGroup> => {
  const { docs } = await db().collection('partners').doc(group.id).collection('items').get();
  const items = docs.map<Partner>(mergeId).sort(order);

  return {
    ...group,
    items,
  };
};

const getPartnerGroups = async (): Promise<PartnerGroup[]> => {
  const { docs } = await db().collection('partners').get();
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
