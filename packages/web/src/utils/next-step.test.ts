import { afterEach, describe, expect, it } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import type { Ticket } from '../models/ticket';
import {
  type NextStepContext,
  callForPapersOpen,
  headerStep,
  nextSteps,
  onSale,
  ticketOnSale,
} from './next-step';

const ticket = { name: 'Regular', url: 'https://example.com/t', available: true } as Ticket;
// Noon UTC, the same day in the demo's time zone.
const on = (day: string) => Date.parse(`${day}T12:00:00Z`);

const context = (overrides: Partial<NextStepContext> = {}): NextStepContext => ({
  eventState: 'upcoming',
  presence: {},
  callForPapers: false,
  ticket: undefined,
  attendance: 'inPerson',
  stream: undefined,
  ...overrides,
});

describe('nextSteps', () => {
  afterEach(() => setFeatures());

  it('offers to submit a talk first while the call for papers is open', () => {
    expect(nextSteps(context({ callForPapers: true, ticket }))).toEqual([
      'submitTalk',
      'tickets',
      'schedule',
    ]);
    expect(nextSteps(context({ callForPapers: true, presence: { schedule: false } }))).toEqual([
      'submitTalk',
      'updates',
    ]);
  });

  it('offers a ticket on sale, then the schedule', () => {
    expect(nextSteps(context({ ticket }))).toEqual(['tickets', 'schedule']);
    expect(nextSteps(context({ ticket, presence: { schedule: false } }))).toEqual(['tickets']);
  });

  it('offers the schedule, then updates, without a ticket on sale', () => {
    expect(nextSteps(context())).toEqual(['schedule', 'updates']);
  });

  it('offers only updates before the schedule is out, or nothing without subscribe', () => {
    const presence = { schedule: false, tickets: false };

    expect(nextSteps(context({ ticket, presence }))).toEqual(['updates']);
    setFeatures({ subscribe: false });
    expect(nextSteps(context({ presence }))).toEqual([]);
  });

  it("doesn't offer tickets when the feature is off", () => {
    setFeatures({ tickets: false });

    expect(nextSteps(context({ ticket }))).toEqual(['schedule', 'updates']);
  });

  it('offers the stream and then what is on during an online or hybrid event', () => {
    const live = { eventState: 'live', stream: 'https://example.com/live' } as const;

    expect(nextSteps(context({ ...live, attendance: 'online' }))).toEqual(['watchLive', 'onNow']);
    expect(nextSteps(context({ ...live, attendance: 'hybrid' }))).toEqual(['watchLive', 'onNow']);
    expect(nextSteps(context({ ...live, attendance: 'inPerson' }))).toEqual(['onNow']);
    expect(nextSteps(context({ eventState: 'live', attendance: 'online' }))).toEqual(['onNow']);
    expect(nextSteps(context({ eventState: 'live', presence: { schedule: false } }))).toEqual([]);
  });

  it('offers the videos, the photos and updates after the event', () => {
    expect(nextSteps(context({ eventState: 'over', ticket }))).toEqual([
      'videos',
      'photos',
      'updates',
    ]);
    expect(nextSteps(context({ eventState: 'over', presence: { videos: false } }))).toEqual([
      'photos',
      'updates',
    ]);
  });
});

describe('headerStep', () => {
  const live = { eventState: 'live', stream: 'https://example.com/live' } as const;

  it('is the first step', () => {
    expect(headerStep(context({ ticket }))).toBe('tickets');
    expect(headerStep(context({ ...live, attendance: 'online' }))).toBe('watchLive');
    expect(headerStep(context({ presence: { schedule: false }, eventState: 'live' }))).toBe(
      undefined,
    );
  });

  it('skips the stream at a hybrid event, where most visitors are at the venue', () => {
    expect(headerStep(context({ ...live, attendance: 'hybrid' }))).toBe('onNow');
  });
});

describe('ticketOnSale', () => {
  it('is the first available ticket that is not sold out and has a link', () => {
    const tickets = [
      { ...ticket, name: 'Early', available: false },
      { ...ticket, name: 'Sold', soldOut: true },
      { ...ticket, name: 'No link', url: '' },
      ticket,
    ];

    expect(ticketOnSale(tickets, on('2027-01-01'))).toBe(ticket);
    expect(ticketOnSale(tickets.slice(0, 3), on('2027-01-01'))).toBeUndefined();
  });
});

describe('onSale', () => {
  const dated = { ...ticket, salesOpen: '2027-07-01', salesClose: '2027-09-30' };

  it('is on sale from the first day of sales to the last, both included', () => {
    expect(onSale(dated, on('2027-06-30'))).toBe(false);
    expect(onSale(dated, on('2027-07-01'))).toBe(true);
    expect(onSale(dated, on('2027-09-30'))).toBe(true);
    expect(onSale(dated, on('2027-10-01'))).toBe(false);
  });

  it('is never on sale when not available or sold out', () => {
    expect(onSale({ ...dated, available: false }, on('2027-08-01'))).toBe(false);
    expect(onSale({ ...dated, soldOut: true }, on('2027-08-01'))).toBe(false);
  });
});

describe('callForPapersOpen', () => {
  const call = { url: 'https://example.com/cfp', opens: '2027-01-10', closes: '2027-03-01' };

  it('is open from the day it opens to the day it closes, both included', () => {
    expect(callForPapersOpen(on('2027-01-09'), call)).toBe(false);
    expect(callForPapersOpen(on('2027-01-10'), call)).toBe(true);
    expect(callForPapersOpen(on('2027-03-01'), call)).toBe(true);
    expect(callForPapersOpen(on('2027-03-02'), call)).toBe(false);
  });

  it('is open until it closes without an opening day, and never without a call', () => {
    const { opens: _, ...withoutOpens } = call;

    expect(callForPapersOpen(on('2026-01-01'), withoutOpens)).toBe(true);
    expect(callForPapersOpen(on('2027-01-10'), undefined)).toBe(false);
  });
});
