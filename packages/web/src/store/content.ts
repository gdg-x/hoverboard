import { createAction } from '@reduxjs/toolkit';
import type { Day } from '../models/day';
import type { Member } from '../models/member';
import type { Partner } from '../models/partner';
import type { PartnerGroupWithoutItems } from '../models/partner-group';
import type { Photo } from '../models/photo';
import type { Post } from '../models/post';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { Session } from '../models/session';
import type { SpeakerWithTags } from '../models/speaker';
import type { TeamWithoutMembers } from '../models/team';
import type { Ticket } from '../models/ticket';
import type { Video } from '../models/video';

/** The public event content, by store key. The build reads it from Firestore. */
export interface Content {
  blog: Post[];
  gallery: Photo[];
  members: Member[];
  partnerGroups: PartnerGroupWithoutItems[];
  partners: Partner[];
  previousSpeakers: PreviousSpeaker[];
  schedule: Day[];
  sessions: Session[];
  speakers: SpeakerWithTags[];
  teams: TeamWithoutMembers[];
  tickets: Ticket[];
  videos: Video[];
}

/** Fills the store with content a page was built with, without subscribing to Firestore. */
export const seedContent = createAction<Partial<Content>>('content/seed');

const subscribers = new Map<string, () => void>();

export const registerContentSubscriber = (name: string, subscribe: () => void): void => {
  subscribers.set(name, subscribe);
};

/**
 * Subscribes to Firestore for seeded content, so the browser keeps it live. Seeded data stays in
 * the store until the first snapshot replaces it.
 */
export const subscribeToContent = (names: Iterable<string>): void => {
  for (const name of names) subscribers.get(name)?.();
};
