import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, ScheduleMap } from '../utils/firestore.js';

export const saveGeneratedSchedule = (schedule?: Record<string, unknown> | ScheduleMap): void => {
  if (!schedule || isEmpty(schedule)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSchedule".');
    return;
  }

  for (let index = 0; index < Object.keys(schedule).length; index++) {
    const key = Object.keys(schedule)[index]!;
    getFirestore()
      .collection('generatedSchedule')
      .doc(key)
      .set(schedule[key] as WithFieldValue<DocumentData>);
  }
};
