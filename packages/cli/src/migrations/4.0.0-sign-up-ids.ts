import { randomInt } from 'crypto';
import type { FirestoreDocument, Migration } from './types.js';

const COLLECTIONS = ['subscribers', 'potentialPartners'];

const plural = (amount: number, noun: string) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

const AUTO_ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** A random ID like the ones Firestore's `addDoc` makes. */
export const autoId = () =>
  Array.from({ length: 20 }, () => AUTO_ID_CHARACTERS[randomInt(AUTO_ID_CHARACTERS.length)]).join(
    '',
  );

/** Sign-ups whose ID is their email, or their email without punctuation as older sites wrote. */
const emailIds = (documents: FirestoreDocument[]) =>
  documents.filter(({ path, data }) => {
    const [collection, id, ...rest] = path.split('/');
    if (rest.length || !COLLECTIONS.includes(collection!) || typeof data?.['email'] !== 'string') {
      return false;
    }
    return id === data['email'] || id === data['email'].replace(/[^\w\s]/gi, '');
  });

const counts = (documents: FirestoreDocument[], verb = '') =>
  COLLECTIONS.flatMap((collection) => {
    const amount = documents.filter(({ path }) => path.startsWith(`${collection}/`)).length;
    const suffix = verb && ` ${verb}${amount === 1 ? 's' : ''}`;
    return amount ? [`${collection}: ${plural(amount, 'document')}${suffix}`] : [];
  });

/**
 * Before v4, the site saved sign-ups with the email as the document ID, so the email showed in
 * every link to them. This moves them to random IDs, as the site writes them now.
 */
export const signUpIds: Migration = {
  id: '4.0.0-sign-up-ids',
  description: 'Move sign-ups whose document ID is their email to random IDs.',
  reads: [],

  pending: (documents) => {
    const found = emailIds(documents);
    return found.length ? `${counts(found).join(', ')} with the email as the ID.` : undefined;
  },

  plan: (documents) => {
    const found = emailIds(documents);
    return {
      updates: [],
      creates: [],
      moves: found.map(({ path }) => ({ from: path, to: `${path.split('/')[0]}/${autoId()}` })),
      // The IDs are emails, so only the counts are shown.
      lines: counts(found, 'move').map((line) => `${line} to random IDs`),
      warnings: [],
    };
  },
};
