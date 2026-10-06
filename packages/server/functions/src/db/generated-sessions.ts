import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, SessionMap } from '../utils/firestore.js';

export const saveGeneratedSessions = async (
  sessions?: Record<string, unknown> | SessionMap,
): Promise<void> => {
  if (!sessions || isEmpty(sessions)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSessions".');
    return;
  }

  await Promise.all(
    Object.keys(sessions).map((key) =>
      getFirestore()
        .collection('generatedSessions')
        .doc(key)
        .set(sessions[key] as WithFieldValue<DocumentData>),
    ),
  );
};
