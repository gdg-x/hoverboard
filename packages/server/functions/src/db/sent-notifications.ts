import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// gRPC ALREADY_EXISTS, returned by `create()` when the document is present.
const ALREADY_EXISTS = 6;

const sentNotificationRef = (id: string) => getFirestore().collection('sentNotifications').doc(id);

/** Atomically records that a notification is being sent. Returns false if it was already claimed. */
export const claimSentNotification = async (id: string): Promise<boolean> => {
  try {
    await sentNotificationRef(id).create({ createdAt: FieldValue.serverTimestamp() });
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === ALREADY_EXISTS) return false;
    throw error;
  }
};

export const releaseSentNotification = async (id: string): Promise<void> => {
  await sentNotificationRef(id).delete();
};
