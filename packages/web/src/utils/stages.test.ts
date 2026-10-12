import { describe, expect, it } from 'vitest';
import { type StageInputs, type TicketSaleDates, nextTicketSale, siteStages } from './stages';
import { zonedTime } from './time-zone';

const timezone = 'America/Los_Angeles';
const on = (day: string, time = '12:00') => zonedTime(day, time, timezone).getTime();

const ticket = (fields: Partial<TicketSaleDates> = {}): TicketSaleDates => ({
  available: true,
  soldOut: false,
  ...fields,
});

const inputs = (fields: Partial<StageInputs> = {}): StageInputs => ({
  event: { startDate: '2027-10-13', endDate: '2027-10-14', timezone },
  tickets: [],
  schedule: false,
  archived: false,
  ...fields,
});

describe('siteStages', () => {
  it('is only announced with no call for papers, tickets or schedule', () => {
    expect(siteStages(on('2027-01-01'), inputs())).toEqual({
      stages: ['announced'],
      next: { change: 'eventStarts', date: '2027-10-13' },
    });
  });

  it('takes talks from the day the call for papers opens to the end of the day it closes', () => {
    const callForPapers = { opens: '2027-01-10', closes: '2027-03-01' };

    expect(siteStages(on('2027-01-09'), inputs({ callForPapers }))).toEqual({
      stages: ['announced'],
      next: { change: 'callForPapersOpens', date: '2027-01-10' },
    });
    expect(siteStages(on('2027-01-10', '00:00'), inputs({ callForPapers }))).toEqual({
      stages: ['announced', 'callForPapers'],
      next: { change: 'callForPapersCloses', date: '2027-03-01' },
    });
    expect(siteStages(on('2027-03-01', '23:59'), inputs({ callForPapers })).stages).toContain(
      'callForPapers',
    );
    expect(siteStages(on('2027-03-02', '00:00'), inputs({ callForPapers })).stages).toEqual([
      'announced',
    ]);
  });

  it('takes talks at once without an opening day', () => {
    expect(
      siteStages(on('2026-12-01'), inputs({ callForPapers: { closes: '2027-03-01' } })).stages,
    ).toEqual(['announced', 'callForPapers']);
  });

  it('says when tickets go on sale, before the first sale opens', () => {
    const tickets = [
      ticket({ salesOpen: '2027-07-01' }),
      ticket({ salesOpen: '2027-02-07', salesClose: '2027-06-30' }),
    ];

    expect(siteStages(on('2027-01-01'), inputs({ tickets }))).toEqual({
      stages: ['announced', 'ticketSales'],
      ticketSales: 'notYetOnSale',
      next: { change: 'ticketsGoOnSale', date: '2027-02-07' },
    });
    expect(siteStages(on('2027-02-07'), inputs({ tickets })).ticketSales).toBe('onSale');
    // Between the early bird and the regular sales.
    expect(siteStages(on('2027-06-30', '23:59'), inputs({ tickets })).ticketSales).toBe('onSale');
  });

  it("doesn't count a ticket that isn't available or is sold out as coming", () => {
    const tickets = [
      ticket({ salesOpen: '2027-07-01', available: false }),
      ticket({ salesOpen: '2027-07-01', soldOut: true }),
    ];

    expect(siteStages(on('2027-01-01'), inputs({ tickets })).ticketSales).toBe('closed');
  });

  it('is sold out when every ticket is', () => {
    const tickets = [ticket({ soldOut: true }), ticket({ soldOut: true })];

    expect(siteStages(on('2027-08-01'), inputs({ tickets })).ticketSales).toBe('soldOut');
  });

  it('is closed after the last sale', () => {
    const tickets = [ticket({ salesClose: '2027-09-30' })];

    expect(siteStages(on('2027-10-01'), inputs({ tickets }))).toEqual({
      stages: ['announced', 'ticketSales'],
      ticketSales: 'closed',
      next: { change: 'eventStarts', date: '2027-10-13' },
    });
  });

  it('overlaps the call for papers, ticket sales and the schedule', () => {
    expect(
      siteStages(
        on('2027-02-15'),
        inputs({
          callForPapers: { closes: '2027-03-01' },
          tickets: [ticket()],
          schedule: true,
        }),
      ),
    ).toEqual({
      stages: ['announced', 'callForPapers', 'ticketSales', 'schedule'],
      ticketSales: 'onSale',
      next: { change: 'callForPapersCloses', date: '2027-03-01' },
    });
  });

  it('is live on the event days, in the event time zone, without the stages before', () => {
    const full = inputs({ tickets: [ticket()], schedule: true });

    // 23:30 on the 12th in Los Angeles is the 13th in UTC.
    expect(siteStages(on('2027-10-12', '23:30'), full).stages).not.toContain('live');
    expect(siteStages(on('2027-10-13', '00:00'), full)).toEqual({
      stages: ['live'],
      next: { change: 'eventEnds', date: '2027-10-14' },
    });
    expect(siteStages(on('2027-10-14', '23:59'), full).stages).toEqual(['live']);
  });

  it('has ended after the last day, with nothing next', () => {
    expect(siteStages(on('2027-10-15', '00:00'), inputs())).toEqual({ stages: ['ended'] });
  });

  it('is archived, with nothing next', () => {
    expect(siteStages(on('2028-01-01'), inputs({ archived: true }))).toEqual({
      stages: ['ended', 'archived'],
    });
  });
});

describe('nextTicketSale', () => {
  it('is the first coming sale day, while no ticket is on sale', () => {
    const coming = [ticket({ salesOpen: '2027-07-01' }), ticket({ salesOpen: '2027-02-07' })];

    expect(nextTicketSale(coming, on('2027-01-01'), timezone)).toBe('2027-02-07');
    expect(nextTicketSale(coming, on('2027-03-01'), timezone)).toBeUndefined();
    expect(nextTicketSale([ticket({ salesOpen: '2027-07-01' })], on('2027-07-01'), timezone)).toBe(
      undefined,
    );
    expect(nextTicketSale([], on('2027-01-01'), timezone)).toBeUndefined();
  });
});
