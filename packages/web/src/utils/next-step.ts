import { type Feature, isFeatureEnabled } from '../config/features';
import type { Ticket } from '../models/ticket';
import { type ContentPresence, hasContent } from './content-presence';
import type { EventState } from './event-state';

/** What a visitor can do next, in the order the hero and the header offer it. */
export type NextStep =
  'tickets' | 'watchLive' | 'onNow' | 'schedule' | 'updates' | 'videos' | 'photos';

export interface NextStepContext {
  eventState: EventState;
  presence: ContentPresence;
  /** The ticket to buy: available, not sold out, with a link. */
  ticket: Ticket | undefined;
  attendance: 'inPerson' | 'online' | 'hybrid';
  /** `event.stream`. */
  stream: string | undefined;
}

/** The first ticket on sale. */
export const ticketOnSale = (tickets: readonly Ticket[]): Ticket | undefined =>
  tickets.find(({ available, soldOut, url }) => available && !soldOut && url);

/**
 * The steps to offer, most important first. A step is only offered when its feature is on and the
 * build found its content, so it never leads to an empty page.
 */
export const nextSteps = ({
  eventState,
  presence,
  ticket,
  attendance,
  stream,
}: NextStepContext): NextStep[] => {
  const has = (feature: Feature) => isFeatureEnabled(feature) && hasContent(presence, feature);
  const updates: NextStep[] = isFeatureEnabled('subscribe') ? ['updates'] : [];

  if (eventState === 'live') {
    return [
      ...(attendance !== 'inPerson' && stream ? (['watchLive'] as const) : []),
      ...(has('schedule') ? (['onNow'] as const) : []),
    ];
  }
  if (eventState === 'over') {
    return [
      ...(has('videos') ? (['videos'] as const) : []),
      ...(has('gallery') ? (['photos'] as const) : []),
      ...updates,
    ];
  }
  if (has('tickets') && ticket)
    return ['tickets', ...(has('schedule') ? (['schedule'] as const) : [])];
  if (has('schedule')) return ['schedule', ...updates];
  return updates;
};

/** The header's step. Most visitors to a hybrid event are at the venue, so it skips the stream. */
export const headerStep = (context: NextStepContext): NextStep | undefined =>
  nextSteps(context).find((step) => !(step === 'watchLive' && context.attendance === 'hybrid'));
