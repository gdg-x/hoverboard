import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { DialogData } from '../models/dialog-form';

export const savePotentialPartner = async (data: DialogData): Promise<void> => {
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  await addDoc(collection(db, 'potentialPartners'), partner);
};
