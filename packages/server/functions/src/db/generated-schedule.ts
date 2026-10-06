import { DocumentData, getFirestore, WithFieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { isEmpty, ScheduleMap } from '../utils/firestore.js';

export const saveGeneratedSchedule = async (
  schedule?: Record<string, unknown> | ScheduleMap,
): Promise<void> => {
  if (!schedule || isEmpty(schedule)) {
    logger.error('Attempting to write empty data to Firestore collection: "generatedSchedule".');
    return;
  }

  await Promise.all(
    Object.keys(schedule).map((key) =>
      getFirestore()
        .collection('generatedSchedule')
        .doc(key)
        .set(schedule[key] as WithFieldValue<DocumentData>),
    ),
  );
};
