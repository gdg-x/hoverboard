import data from '../../docs/default-firebase-data.json';
import { allKeys } from './utils';

type Ticket = import('./ticket').Ticket;

describe('ticket', () => {
  it('matches the shape of the default data', () => {
    const tickets: Ticket[] = Object.values(data['tickets']);
    const keys: Array<keyof Ticket> = [
      'available',
      'currency',
      'ends',
      'inDemand',
      'info',
      'name',
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
