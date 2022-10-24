import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { TeamWithoutMembers } from '../../models/team';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import { FETCH_TEAMS, FETCH_TEAMS_FAILURE, FETCH_TEAMS_SUCCESS, TeamsActions } from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchTeams = async (dispatch: Dispatch<TeamsActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'team',
      () => dispatch({ type: FETCH_TEAMS }),
      (payload: TeamWithoutMembers[]) => dispatch({ type: FETCH_TEAMS_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_TEAMS_FAILURE, payload }),
      orderBy('title')
    );
  }
};
