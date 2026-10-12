import type { Ticket } from '../models/ticket';
import { type EventDates, eventState } from './event-state';
import { onDays, wallClock } from './time-zone';

/** The stages of an event's site. Several can be active before the event. */
export type Stage =
  'announced' | 'callForPapers' | 'ticketSales' | 'schedule' | 'live' | 'ended' | 'archived';

/** Where ticket sales are, while the stage is active. */
export type TicketSales = 'notYetOnSale' | 'onSale' | 'soldOut' | 'closed';

/** The next change of stage that has a day: from the call for papers, the tickets or the event. */
export type StageChange =
  'callForPapersOpens' | 'callForPapersCloses' | 'ticketsGoOnSale' | 'eventStarts' | 'eventEnds';

export interface CallForPapersDates {
  opens?: string | undefined;
  closes: string;
}

export type TicketSaleDates = Pick<Ticket, 'available' | 'soldOut' | 'salesOpen' | 'salesClose'>;

export interface StageInputs {
  event: EventDates;
  callForPapers?: CallForPapersDates | undefined;
  /** The tickets, or none when the feature is off. */
  tickets: readonly TicketSaleDates[];
  /** Whether the schedule has days: it's published, and sessions have a day and times. */
  schedule: boolean;
  /** Whether the site is an archived edition. */
  archived: boolean;
}

export interface SiteStages {
  /** The active stages, in order. */
  stages: Stage[];
  ticketSales?: TicketSales;
  /** The next change, with its day (YYYY-MM-DD): the first day, or the last for an end. */
  next?: { change: StageChange; date: string };
}

/** Whether a ticket can be bought at `time`: available, not sold out, and in its sale dates. */
export const ticketSells = (ticket: TicketSaleDates, time: number, timeZone: string): boolean =>
  ticket.available &&
  !ticket.soldOut &&
  onDays(time, timeZone, { from: ticket.salesOpen, until: ticket.salesClose });

/** Whether the call for papers is open at `time`, from `opens` to the end of `closes`. */
export const callForPapersOpenAt = (
  call: CallForPapersDates | undefined,
  time: number,
  timeZone: string,
): boolean => !!call && onDays(time, timeZone, { from: call.opens, until: call.closes });

const dayAfter = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

const ENDS: readonly StageChange[] = ['callForPapersCloses', 'eventEnds'];

/** The stages the site is in at `time`, from its dates, config and content. */
export const siteStages = (
  time: number,
  { event, callForPapers, tickets, schedule, archived }: StageInputs,
): SiteStages => {
  const timeZone = event.timezone;
  const today = wallClock(new Date(time), timeZone).date;
  const state = eventState(new Date(time), event);
  const callOpen = callForPapersOpenAt(callForPapers, time, timeZone);
  const comingSales = tickets.flatMap(({ available, soldOut, salesOpen }) =>
    available && !soldOut && salesOpen && salesOpen > today ? [salesOpen] : [],
  );

  let ticketSales: TicketSales | undefined;
  if (state === 'upcoming' && tickets.length) {
    if (tickets.some((ticket) => ticketSells(ticket, time, timeZone))) ticketSales = 'onSale';
    else if (tickets.every(({ soldOut }) => soldOut)) ticketSales = 'soldOut';
    else if (comingSales.length) ticketSales = 'notYetOnSale';
    else ticketSales = 'closed';
  }

  const stages: Stage[] =
    state === 'upcoming'
      ? [
          'announced',
          ...(callOpen ? (['callForPapers'] as const) : []),
          ...(ticketSales ? (['ticketSales'] as const) : []),
          ...(schedule ? (['schedule'] as const) : []),
        ]
      : [state === 'live' ? 'live' : 'ended'];
  if (archived) stages.push('archived');

  const changes: { change: StageChange; date: string }[] = archived
    ? []
    : [
        ...(callForPapers?.opens && callForPapers.opens > today
          ? [{ change: 'callForPapersOpens' as const, date: callForPapers.opens }]
          : []),
        ...(callOpen && callForPapers
          ? [{ change: 'callForPapersCloses' as const, date: callForPapers.closes }]
          : []),
        ...(ticketSales === 'notYetOnSale'
          ? [{ change: 'ticketsGoOnSale' as const, date: comingSales.sort()[0]! }]
          : []),
        ...(state === 'upcoming'
          ? [{ change: 'eventStarts' as const, date: event.startDate }]
          : []),
        ...(state === 'live' ? [{ change: 'eventEnds' as const, date: event.endDate }] : []),
      ];
  // An end happens the day after its date.
  const when = ({ change, date }: { change: StageChange; date: string }) =>
    ENDS.includes(change) ? dayAfter(date) : date;
  const [next] = changes.sort((a, b) => when(a).localeCompare(when(b)));

  return { stages, ...(ticketSales ? { ticketSales } : {}), ...(next ? { next } : {}) };
};
