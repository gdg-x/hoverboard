import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToDocument, Subscription } from '../utils/firestore';

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
  onNext: (payload: UserTokens | undefined) => void,
  onError: (error: Error) => void,
): Subscription => {
  return subscribeToDocument<UserTokens>(`notificationsUsers/${uid}`, onStart, onNext, onError);
};

export const saveNotificationsUsers = async (uid: string, data: UserTokensData): Promise<void> => {
  await setDoc(doc(db, 'notificationsUsers', uid), data);
};
