import { describe, expect, it } from 'vitest';
import { autoId, signUpIds } from './4.0.0-sign-up-ids.js';

const subscriber = { email: 'ada@example.com', firstName: 'Ada', lastName: '' };
const documents = [
  { path: 'subscribers/adaexamplecom', data: subscriber },
  { path: 'subscribers/ada@example.com', data: subscriber },
  { path: 'subscribers/Xk3PqLm9TzR2aB7cD1eF', data: subscriber },
  {
    path: 'potentialPartners/gracecompanycom',
    data: { companyName: '', email: 'grace@company.com', fullName: '' },
  },
  { path: 'speakers/adaexamplecom', data: { email: 'ada@example.com' } },
];

describe('4.0.0-sign-up-ids', () => {
  it('is pending while a sign-up has its email, or its email without punctuation, as its ID', () => {
    expect(signUpIds.pending(documents)).toBe(
      'subscribers: 2 documents, potentialPartners: 1 document with the email as the ID.',
    );
    expect(signUpIds.pending(documents.slice(2))).toBe(
      'potentialPartners: 1 document with the email as the ID.',
    );
    expect(signUpIds.pending([documents[2]!, documents[4]!])).toBeUndefined();
  });

  it('moves them to random IDs in the same collection, without showing the emails', () => {
    const plan = signUpIds.plan(documents);

    expect(plan.moves?.map(({ from }) => from)).toEqual([
      'subscribers/adaexamplecom',
      'subscribers/ada@example.com',
      'potentialPartners/gracecompanycom',
    ]);
    expect(plan.moves?.map(({ to }) => to)).toEqual([
      expect.stringMatching(/^subscribers\/[A-Za-z0-9]{20}$/),
      expect.stringMatching(/^subscribers\/[A-Za-z0-9]{20}$/),
      expect.stringMatching(/^potentialPartners\/[A-Za-z0-9]{20}$/),
    ]);
    expect(plan.lines).toEqual([
      'subscribers: 2 documents move to random IDs',
      'potentialPartners: 1 document moves to random IDs',
    ]);
    expect(JSON.stringify(plan.lines)).not.toMatch(/ada|grace/);
  });

  it('makes IDs like addDoc does', () => {
    expect(new Set(Array.from({ length: 100 }, autoId)).size).toBe(100);
  });
});
