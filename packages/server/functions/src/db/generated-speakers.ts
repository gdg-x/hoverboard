import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, SpeakerMap } from '../utils/firestore.js';

export const saveGeneratedSpeakers = (speakers?: Record<string, unknown> | SpeakerMap): void => {
  if (!speakers || isEmpty(speakers)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSpeakers".');
    return;
  }

  for (let index = 0; index < Object.keys(speakers).length; index++) {
    const key = Object.keys(speakers)[index]!;
    getFirestore()
      .collection('generatedSpeakers')
      .doc(key)
      .set(speakers[key] as WithFieldValue<DocumentData>);
  }
};
