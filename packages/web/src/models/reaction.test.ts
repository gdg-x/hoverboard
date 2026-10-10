/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import rules from '../../../storage/firestore.rules?raw';
import schema from '../../../storage/schemas/firestore.schema.json';
import { isReactionId, REACTION_EMOJI, REACTIONS } from './reaction';

describe('reactions', () => {
  it('are the ones the Firestore schema and rules accept', () => {
    expect(schema.$defs.reactionId.enum).toEqual(REACTIONS);
    const ruleList = /hasOnly\((\['applause'[^\]]*\])\)/.exec(rules)?.[1] ?? '';
    expect(JSON.parse(ruleList.replaceAll("'", '"'))).toEqual(REACTIONS);
  });

  it('each have an emoji', () => {
    expect(Object.keys(REACTION_EMOJI)).toEqual(REACTIONS);
  });

  it('tells reaction IDs from other text', () => {
    expect(isReactionId('mind-blown')).toBe(true);
    expect(isReactionId('thumbs-down')).toBe(false);
  });
});
