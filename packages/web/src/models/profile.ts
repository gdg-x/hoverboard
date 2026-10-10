import type { Id } from './types';

/** What other visitors see of a visitor. Firestore: `profiles/{userId}`. */
export interface ProfileData {
  /** The name the visitor picks. */
  name: string;
  /** The photo from the visitor's sign-in provider, or an empty string. */
  photoUrl: string;
  /** The server time of the last change. Missing while the write is pending. */
  updatedAt?: Date;
}

export type Profile = Id & ProfileData;
