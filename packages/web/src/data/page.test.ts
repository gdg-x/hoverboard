import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import type { Speaker } from '../models/speaker';
import { store } from '../store';
import { seedPage } from './page';

vi.mock('../db/speakers');

describe('seedPage', () => {
  it("replaces the previous page's content and returns the new content", () => {
    seedPage({ speakers: [{ id: 'ada' }] as Speaker[] });
    const tickets = [{ name: 'Early bird' }] as never;

    const content = seedPage({ tickets });

    expect(content).toEqual({ tickets });
    expect(store.getState().tickets).toStrictEqual(new Success(tickets));
    expect(store.getState().speakers).toStrictEqual(new Initialized());
  });
});
