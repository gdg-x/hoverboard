import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { DialogData } from '../models/dialog-form';
import { write } from '../utils/firestore';

export const saveSubscriber = (data: DialogData, onRejected: (error: Error) => void): void => {
  const subscriber = {
    email: data.email,
    firstName: data.firstFieldValue || '',
    lastName: data.secondFieldValue || '',
  };

  write(() => addDoc(collection(db, 'subscribers'), subscriber), onRejected);
};
