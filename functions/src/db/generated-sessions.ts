import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, SessionMap } from '../utils/firestore.js';

export const saveGeneratedSessions = (sessions?: Record<string, unknown> | SessionMap): void => {
  if (!sessions || isEmpty(sessions)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSessions".');
    return;
  }

  for (let index = 0; index < Object.keys(sessions).length; index++) {
    const key = Object.keys(sessions)[index]!;
    getFirestore()
      .collection('generatedSessions')
      .doc(key)
      .set(sessions[key] as WithFieldValue<DocumentData>);
  }
};
