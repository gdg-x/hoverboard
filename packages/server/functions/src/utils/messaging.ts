import { getMessaging, MulticastMessage, SendResponse } from 'firebase-admin/messaging';

/**
 * FCM error codes that indicate a device token is no longer valid and should be
 * removed from Firestore instead of retried.
 */
const INVALID_TOKEN_ERROR_CODES = [
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
];

export const isInvalidTokenError = (errorCode: string): boolean =>
  INVALID_TOKEN_ERROR_CODES.includes(errorCode);

// FCM rejects multicast requests with more than 500 tokens.
export const MULTICAST_BATCH_SIZE = 500;

export interface FailedSend {
  token: string;
  error: NonNullable<SendResponse['error']>;
}

/** Sends `data` to every token in batches of at most 500 and returns the per-token failures. */
export const sendToTokens = async (
  tokens: string[],
  data: MulticastMessage['data'],
): Promise<FailedSend[]> => {
  const failures: FailedSend[] = [];

  for (let start = 0; start < tokens.length; start += MULTICAST_BATCH_SIZE) {
    const batch = tokens.slice(start, start + MULTICAST_BATCH_SIZE);
    const { responses } = await getMessaging().sendEachForMulticast({ tokens: batch, data });
    responses.forEach((result, index) => {
      if (result.error) failures.push({ token: batch[index]!, error: result.error });
    });
  }

  return failures;
};
