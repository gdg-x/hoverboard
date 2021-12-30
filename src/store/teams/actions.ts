import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { TeamWithoutMembers } from '../../models/team';
import { mergeDataAndId } from '../../utils/firestore';
import { FETCH_TEAMS, FETCH_TEAMS_FAILURE, FETCH_TEAMS_SUCCESS, TeamsActions } from './types';

type Subscription = RemoteData<Error, Unsubscribe>;
let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

const subscribe = (path: string, dispatch: Dispatch<TeamsActions>) => {
  const unsubscribe = onSnapshot(
    query(collection(db, path), orderBy('title', 'asc')),
    (snapshot) => {
      const payload = snapshot.docs.map<TeamWithoutMembers>(mergeDataAndId);
      dispatch({ type: FETCH_TEAMS_SUCCESS, payload });
    },
    (payload) => {
      subscription = new Failure(payload);
      dispatch({ type: FETCH_TEAMS_FAILURE, payload });
    }
  );

  return new Success(unsubscribe);
};

export const fetchTeams = async (dispatch: Dispatch<TeamsActions>) => {
  if (subscription instanceof Initialized) {
    subscription = new Pending();
    dispatch({ type: FETCH_TEAMS });

    subscription = subscribe('team', dispatch);
  }
};
