import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { DialogData } from '../models/dialog-form';

export const saveSubscriber = async (data: DialogData): Promise<true> => {
  const subscriber = {
    email: data.email,
    firstName: data.firstFieldValue || '',
    lastName: data.secondFieldValue || '',
  };

  await addDoc(collection(db, 'subscribers'), subscriber);

  return true;
};
