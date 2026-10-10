import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  type SnapshotState,
  subscribeToDocument,
  type Subscription,
  write,
} from '../utils/firestore';

export interface UserTokens {
  id: string;
  tokens: {
    [key: string]: true;
  };
}

export type UserTokensData = Omit<UserTokens, 'id'>;

export const subscribeToNotificationsUsers = (
  uid: string,
  onStart: () => void,
  onNext: (payload: UserTokens | undefined, state: SnapshotState) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToDocument<UserTokens>(`notificationsUsers/${uid}`, onStart, onNext, onError);
};

export const saveNotificationsUsers = (
  uid: string,
  data: UserTokensData,
  onRejected: (error: Error) => void,
): void => write(() => setDoc(doc(db, 'notificationsUsers', uid), data), onRejected);
