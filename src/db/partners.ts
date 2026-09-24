import {
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Partner } from '../models/partner';
import { PartnerGroupWithoutItems } from '../models/partner-group';
import { dataWithParentId, mergeDataAndId } from '../utils/firestore';

export const subscribeToPartners = (
  onNext: (payload: Partner[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  return onSnapshot(
    query(collectionGroup(db, 'items'), orderBy('order')),
    (snapshot) => {
      onNext(snapshot.docs.map<Partner>(dataWithParentId));
    },
    (error) => onError(error as Error),
  );
};

export const subscribeToPartnerGroups = (
  onNext: (payload: PartnerGroupWithoutItems[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, 'partners'), orderBy('order')),
    (snapshot) => {
      onNext(snapshot.docs.map<PartnerGroupWithoutItems>(mergeDataAndId));
    },
    (error) => onError(error as Error),
  );
};
