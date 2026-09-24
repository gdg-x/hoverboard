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
