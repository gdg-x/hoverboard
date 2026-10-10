import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { currentTime, demoTime } from './clock';
import { DEMO_TIME_KEY } from './demo';
import { daysUntilStart, eventState } from './event-state';

// The demo event is on October 13 and 14, 2017, in Kyiv.
const event = { startDate: '2017-10-13', endDate: '2017-10-14', timezone: 'Europe/Kyiv' };

describe('demoTime', () => {
  it('is two weeks before the event', () => {
    const before = new Date(demoTime('before'));

    expect(eventState(before, event)).toBe('upcoming');
    expect(daysUntilStart(before, event)).toBe(14);
  });

  it('is 11:00 on the first day during the event', () => {
    expect(new Date(demoTime('during')).toISOString()).toBe('2017-10-13T08:00:00.000Z');
  });

  it('is two weeks after the event', () => {
    const after = new Date(demoTime('after'));

    expect(eventState(after, event)).toBe('over');
    expect(after.toISOString()).toBe('2017-10-28T09:00:00.000Z');
  });
});

describe('currentTime', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is the real time without a demo choice', () => {
    expect(Math.abs(currentTime() - Date.now())).toBeLessThan(1000);
  });

  it('moves to the time a demo site picked, and keeps ticking from there', async () => {
    setFeatures({ demo: true });
    localStorage.setItem(DEMO_TIME_KEY, 'during');
    vi.resetModules();
    const clock = await import('./clock');

    expect(Math.abs(clock.currentTime() - clock.demoTime('during'))).toBeLessThan(1000);
  });

  it('ignores the choice when the demo is off', async () => {
    setFeatures({ demo: false });
    localStorage.setItem(DEMO_TIME_KEY, 'during');
    vi.resetModules();
    const clock = await import('./clock');

    expect(Math.abs(clock.currentTime() - Date.now())).toBeLessThan(1000);
  });
});
