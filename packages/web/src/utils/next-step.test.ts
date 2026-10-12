import { afterEach, describe, expect, it } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import type { Ticket } from '../models/ticket';
import { type NextStepContext, headerStep, nextSteps, ticketOnSale } from './next-step';

const ticket = { name: 'Regular', url: 'https://example.com/t', available: true } as Ticket;

const context = (overrides: Partial<NextStepContext> = {}): NextStepContext => ({
  eventState: 'upcoming',
  presence: {},
  ticket: undefined,
  attendance: 'inPerson',
  stream: undefined,
  ...overrides,
});

describe('nextSteps', () => {
  afterEach(() => setFeatures());

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

    expect(ticketOnSale(tickets)).toBe(ticket);
    expect(ticketOnSale(tickets.slice(0, 3))).toBeUndefined();
  });
});
