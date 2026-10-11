import { describe, expect, it } from 'vitest';
import ticketDocuments from '../../../../docs/sample-data/collections/tickets.json';
import type { Ticket } from './ticket';
import { allKeys } from './utils';

describe('ticket', () => {
  it('matches the shape of the default data', () => {
    const tickets: Ticket[] = Object.values(ticketDocuments);
    // The query sorts by `order`, which the model doesn't read.
    const keys: Array<keyof Ticket | 'order'> = [
      'available',
      'currency',
      'ends',
      'inDemand',
      'info',
      'name',
      'order',
      'price',
      'primary',
      'regular',
      'soldOut',
      'starts',
      'url',
    ];

    expect(tickets).toHaveLength(5);
    expect(allKeys(tickets)).toStrictEqual(keys);
  });
});
