import { createHash } from 'crypto';

/** A short, stable stand-in for an email, push token or user ID, so logs hold no personal data. */
export const logId = (value: string): string =>
  createHash('sha256').update(value).digest('hex').slice(0, 10);
