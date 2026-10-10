import type { Id } from './types';

/** The reactions a visitor can add to a session, in the order the picker shows them. */
export const REACTIONS = ['applause', 'love', 'insightful', 'mind-blown', 'funny'] as const;

export type ReactionId = (typeof REACTIONS)[number];

export const REACTION_EMOJI: Readonly<Record<ReactionId, string>> = {
  applause: '👏',
  love: '❤️',
  insightful: '💡',
  'mind-blown': '🤯',
  funny: '😂',
};

export const isReactionId = (value: string): value is ReactionId =>
  (REACTIONS as readonly string[]).includes(value);

/** A visitor's reactions to a session. Firestore: `sessions/{sessionId}/reactions/{userId}`. */
export interface ReactionData {
  reactions: ReactionId[];
  /** The document ID too. Collection group queries can't filter on the document ID. */
  userId: string;
  /** The server time of the last change. Missing while the write is pending. */
  updatedAt?: Date;
}

export type Reaction = Id & ReactionData;
