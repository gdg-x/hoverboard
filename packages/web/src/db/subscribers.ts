import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DialogData } from '../models/dialog-form';

export const saveSubscriber = async (data: DialogData): Promise<true> => {
  const id = data.email.replace(/[^\w\s]/gi, '');
  const subscriber = {
    email: data.email,
    firstName: data.firstFieldValue || '',
    lastName: data.secondFieldValue || '',
  };

  await setDoc(doc(db, 'subscribers', id), subscriber);

  return true;
};
