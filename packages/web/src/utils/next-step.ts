import { type Feature, isFeatureEnabled } from '../config/features';
import { callForPapers } from '../config/site';
import type { Ticket } from '../models/ticket';
import { type ContentPresence, hasContent } from './content-presence';
import { onDates } from './dates';
import type { EventState } from './event-state';

/** What a visitor can do next, in the order the hero and the header offer it. */
export type NextStep =
  'submitTalk' | 'tickets' | 'watchLive' | 'onNow' | 'schedule' | 'updates' | 'videos' | 'photos';

export interface NextStepContext {
  eventState: EventState;
  presence: ContentPresence;
  /** Whether the call for papers is open. */
  callForPapers: boolean;
  /** The ticket to buy: on sale, with a link. */
  ticket: Ticket | undefined;
  attendance: 'inPerson' | 'online' | 'hybrid';
  /** `event.stream`. */
  stream: string | undefined;
}

/** Whether the call for papers is open at `time`, from `opens` to the end of `closes`. */
export const callForPapersOpen = (time: number, call = callForPapers): boolean =>
  !!call && onDates(time, { from: call.opens, until: call.closes });

/** Whether a ticket can be bought at `time`: available, not sold out, and in its sale dates. */
export const onSale = (ticket: Ticket, time: number): boolean =>
  ticket.available &&
  !ticket.soldOut &&
  onDates(time, { from: ticket.salesOpen, until: ticket.salesClose });

/** The first ticket on sale at `time`, with a link. */
export const ticketOnSale = (tickets: readonly Ticket[], time: number): Ticket | undefined =>
  tickets.find((ticket) => ticket.url && onSale(ticket, time));

/**
 * The steps to offer, most important first. A step is only offered when its feature is on and the
 * build found its content, so it never leads to an empty page.
 */
export const nextSteps = ({
  eventState,
  presence,
  callForPapers: callOpen,
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
  const upcoming = (): NextStep[] => {
    if (has('tickets') && ticket) {
      return ['tickets', ...(has('schedule') ? (['schedule'] as const) : [])];
    }
    if (has('schedule')) return ['schedule', ...updates];
    return updates;
  };
  return callOpen ? ['submitTalk', ...upcoming()] : upcoming();
};

/** The header's step. Most visitors to a hybrid event are at the venue, so it skips the stream. */
export const headerStep = (context: NextStepContext): NextStep | undefined =>
  nextSteps(context).find((step) => !(step === 'watchLive' && context.attendance === 'hybrid'));
