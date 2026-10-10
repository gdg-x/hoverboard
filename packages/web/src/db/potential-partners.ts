import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { DialogData } from '../models/dialog-form';
import { write } from '../utils/firestore';

export const savePotentialPartner = (
  data: DialogData,
  onRejected: (error: Error) => void,
): void => {
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  write(() => addDoc(collection(db, 'potentialPartners'), partner), onRejected);
};
