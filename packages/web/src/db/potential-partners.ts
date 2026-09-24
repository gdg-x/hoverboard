import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DialogData } from '../models/dialog-form';

export const savePotentialPartner = async (data: DialogData): Promise<void> => {
  const id = data.email.replace(/[^\w\s]/gi, '');
  const partner = {
    email: data.email,
    fullName: data.firstFieldValue || '',
    companyName: data.secondFieldValue || '',
  };

  await setDoc(doc(db, 'potentialPartners', id), partner);
};
