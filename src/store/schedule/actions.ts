import { Initialized, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { Day } from '../../models/day';
import { subscribeToCollection, Subscription } from '../../utils/firestore';
import {
  FETCH_SCHEDULE,
  FETCH_SCHEDULE_FAILURE,
  FETCH_SCHEDULE_SUCCESS,
  ScheduleActions,
} from './types';

let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

export const fetchSchedule = async (dispatch: Dispatch<ScheduleActions>) => {
  if (subscription instanceof Initialized) {
    subscription = subscribeToCollection(
      'generatedSchedule',
      () => dispatch({ type: FETCH_SCHEDULE }),
      (payload: Day[]) => dispatch({ type: FETCH_SCHEDULE_SUCCESS, payload }),
      (payload: Error) => dispatch({ type: FETCH_SCHEDULE_FAILURE, payload }),
      orderBy('date')
    );
  }
};
