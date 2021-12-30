import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { SpeakerWithTags } from '../../models/speaker';
import { mergeDataAndId } from '../../utils/firestore';
import {
  FETCH_SPEAKERS,
  FETCH_SPEAKERS_FAILURE,
  FETCH_SPEAKERS_SUCCESS,
  SpeakerActions,
} from './types';

type Subscription = RemoteData<Error, Unsubscribe>;
let subscription: Subscription = new Initialized();

export const unsubscribe = () => {
  if (subscription instanceof Success) {
    subscription.data();
  }
};

const subscribe = (path: string, dispatch: Dispatch<SpeakerActions>) => {
  const unsubscribe = onSnapshot(
    query(collection(db, path), orderBy('name', 'asc')),
    (snapshot) => {
      const payload = snapshot.docs.map<SpeakerWithTags>(mergeDataAndId);
      dispatch({ type: FETCH_SPEAKERS_SUCCESS, payload });
    },
    (payload) => {
      subscription = new Failure(payload);
      dispatch({ type: FETCH_SPEAKERS_FAILURE, payload });
    }
  );

  return new Success(unsubscribe);
};

export const fetchSpeakers = async (dispatch: Dispatch<SpeakerActions>) => {
  if (subscription instanceof Initialized) {
    subscription = new Pending();
    dispatch({ type: FETCH_SPEAKERS });

    subscription = subscribe('generatedSpeakers', dispatch);
  }
};
