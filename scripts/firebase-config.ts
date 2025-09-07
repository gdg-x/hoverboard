// https://github.com/import-js/eslint-plugin-import/issues/1810

import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../serviceAccount.json';

const credential = cert(serviceAccount as ServiceAccount);
initializeApp({ credential });
const firestore = getFirestore();

export { firestore };
