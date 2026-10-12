import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { currentTime } from './clock';
import { DEMO_TIME_KEY } from './demo';

const picked = '2017-10-13T08:00:00.000Z';

describe('currentTime', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is the real time without a demo choice', () => {
    expect(Math.abs(currentTime() - Date.now())).toBeLessThan(1000);
  });

  it('moves to the time a demo site picked, and keeps ticking from there', async () => {
    setFeatures({ demo: true });
    localStorage.setItem(DEMO_TIME_KEY, picked);
    vi.resetModules();
    const clock = await import('./clock');

    expect(Math.abs(clock.currentTime() - Date.parse(picked))).toBeLessThan(1000);
  });

  it('ignores the choice when the demo is off', async () => {
    setFeatures({ demo: false });
    localStorage.setItem(DEMO_TIME_KEY, picked);
    vi.resetModules();
    const clock = await import('./clock');

    expect(Math.abs(clock.currentTime() - Date.now())).toBeLessThan(1000);
  });
});
