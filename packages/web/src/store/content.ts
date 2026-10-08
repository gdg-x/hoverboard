import { createAction, type UnknownAction } from '@reduxjs/toolkit';
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

/** Clears content on the server between pages, so each page renders only what it was built with. */
export const resetContent = createAction('content/reset');

/** The id of the script element that carries a page's content to the browser. */
export const PAGE_CONTENT_ID = 'hb-content';

/** Content as JSON for a script element. `<` is escaped, so the data cannot end the element. */
export const serializeContent = (content: Partial<Content>): string =>
  JSON.stringify(content).replaceAll('<', '\\u003c');

const pageContent = (): Partial<Content> | undefined => {
  const json = document.getElementById(PAGE_CONTENT_ID)?.textContent;
  return json ? (JSON.parse(json) as Partial<Content>) : undefined;
};

/** Seeds the store with the content the page was built with. */
export const seedFromPage = (dispatch: (action: UnknownAction) => unknown): void => {
  const content = pageContent();
  if (content) dispatch(seedContent(content));
};

/**
 * Keeps the page's content live. Call it after the page hydrates: content that changed since the
 * build would otherwise render differently from the page's HTML.
 */
export const subscribeToPageContent = (): void => {
  subscribeToContent(Object.keys(pageContent() ?? {}));
};

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
