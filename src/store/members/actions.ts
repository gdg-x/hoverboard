import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { collectionGroup, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Member } from '../../models/member';
import { dataWithParentId } from '../../utils/firestore';
import {
  FETCH_MEMBERS,
  FETCH_MEMBERS_FAILURE,
  FETCH_MEMBERS_SUCCESS,
  MembersActions,
} from './types';

type Subscription = RemoteData<Error, Unsubscribe>;
let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

const subscribe = (path: string, dispatch: Dispatch<MembersActions>) => {
  const unsubscribe = onSnapshot(
    query(collectionGroup(db, path), orderBy('name', 'asc')),
    (snapshot) => {
      const payload = snapshot.docs.map<Member>(dataWithParentId);
      dispatch({ type: FETCH_MEMBERS_SUCCESS, payload });
    },
    (payload) => {
      subscription = new Failure(payload);
      dispatch({ type: FETCH_MEMBERS_FAILURE, payload });
    }
  );

  return new Success(unsubscribe);
};

export const fetchMembers = () => async (dispatch: Dispatch<MembersActions>) => {
  if (subscription instanceof Initialized) {
    subscription = new Pending();
    dispatch({ type: FETCH_MEMBERS });

    subscription = subscribe('members', dispatch);
  }
};
