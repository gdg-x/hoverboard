import { FidMulticastMessage, getMessaging, SendResponse } from 'firebase-admin/messaging';

/**
 * FCM error codes that indicate a recipient is no longer valid and should be
 * removed from Firestore instead of retried.
 */
const INVALID_TOKEN_ERROR_CODES = [
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/installation-id-not-registered',
];

export const isInvalidTokenError = (errorCode: string): boolean =>
  INVALID_TOKEN_ERROR_CODES.includes(errorCode);

// FCM rejects multicast requests with more than 500 recipients.
export const MULTICAST_BATCH_SIZE = 500;

// Firebase Installation IDs are 22 character base64url strings; FCM registration tokens never match.
const FID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export const isFid = (recipient: string): boolean => FID_PATTERN.test(recipient);

export interface FailedSend {
  /** The Firebase Installation ID the send failed for. */
  token: string;
  error: NonNullable<SendResponse['error']>;
}

const chunk = <T>(items: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += MULTICAST_BATCH_SIZE) {
    chunks.push(items.slice(start, start + MULTICAST_BATCH_SIZE));
  }
  return chunks;
};

/**
 * Sends `data` to every Firebase Installation ID in batches of at most 500 and returns the failures.
 * Recipients that are not FIDs (legacy registration tokens) are not sent to and are reported as
 * invalid so callers remove them.
 */
export const sendToTokens = async (
  recipients: string[],
  data: FidMulticastMessage['data'],
): Promise<FailedSend[]> => {
  const fids = recipients.filter(isFid);
  const failures: FailedSend[] = recipients
    .filter((recipient) => !isFid(recipient))
    .map((token) => ({
      token,
      error: {
        code: 'messaging/invalid-registration-token',
        message: 'Legacy registration tokens are no longer supported.',
      } as FailedSend['error'],
    }));

  for (const batch of chunk(fids)) {
    const { responses } = await getMessaging().sendEachForMulticast({ fids: batch, data });
    responses.forEach((result, index) => {
      if (result.error) failures.push({ token: batch[index]!, error: result.error });
    });
  }

  return failures;
};
