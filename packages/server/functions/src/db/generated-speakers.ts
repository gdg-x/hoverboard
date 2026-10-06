import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, SpeakerMap } from '../utils/firestore.js';

export const saveGeneratedSpeakers = async (
  speakers?: Record<string, unknown> | SpeakerMap,
): Promise<void> => {
  if (!speakers || isEmpty(speakers)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSpeakers".');
    return;
  }

  await Promise.all(
    Object.keys(speakers).map((key) =>
      getFirestore()
        .collection('generatedSpeakers')
        .doc(key)
        .set(speakers[key] as WithFieldValue<DocumentData>),
    ),
  );
};
