import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { PotentialPartner } from '../models/potential-partner';
import { write } from '../utils/firestore';

export const savePotentialPartner = (
  partner: PotentialPartner,
  onRejected: (error: Error) => void,
): void => {
  write(() => addDoc(collection(db, 'potentialPartners'), partner), onRejected);
};
