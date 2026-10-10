import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { Subscriber } from '../models/subscriber';
import { write } from '../utils/firestore';

export const saveSubscriber = (
  subscriber: Subscriber,
  onRejected: (error: Error) => void,
): void => {
  write(() => addDoc(collection(db, 'subscribers'), subscriber), onRejected);
};
