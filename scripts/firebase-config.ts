// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../serviceAccount.json';

const { FIRESTORE_EMULATOR_HOST } = process.env;

if (FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: 'demo-hoverboard' });
} else {
  const credential = cert(serviceAccount as ServiceAccount);
  initializeApp({ credential });
}

const firestore = getFirestore();

export { firestore };
