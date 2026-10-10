import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyDemoChoices,
  chooseDecorations,
  chooseDemo,
  chooseDemoAttendance,
  chooseDemoTime,
  DEMO_ATTENDANCE_KEY,
  DEMO_DECORATIONS_KEY,
  DEMO_DENSITY_KEY,
  DEMO_THEME_KEY,
  DEMO_TIME_KEY,
  demoScript,
  readDemoAttendance,
  readDemoChoices,
  readDemoTime,
} from './demo';

const root = document.documentElement;

describe('demo choices', () => {
  afterEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
    root.removeAttribute('data-density');
    root.removeAttribute('data-decorations');
  });

  it('reads the stored choices, or nothing when storage throws', () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');

    expect(readDemoChoices(() => localStorage)).toEqual({
      theme: 'spotlight',
      density: null,
      decorations: null,
    });
    expect(
      readDemoChoices(() => {
        throw new Error('blocked');
      }),
    ).toEqual({ theme: null, density: null, decorations: null });
  });

  it('sets and clears the attributes the theme CSS switches on', () => {
    applyDemoChoices(document, { theme: 'spotlight', density: 'roomy', decorations: 'off' });
    expect(root).toHaveAttribute('data-theme', 'spotlight');
    expect(root).toHaveAttribute('data-density', 'roomy');
    expect(root).toHaveAttribute('data-decorations', 'off');

    applyDemoChoices(document, { theme: null, density: null, decorations: 'on' });
    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-density');
    expect(root).not.toHaveAttribute('data-decorations');
  });

  it("keeps the site's decorations without a choice", () => {
    root.setAttribute('data-decorations', 'off');

    applyDemoChoices(document, { theme: null, density: null, decorations: null });

    expect(root).toHaveAttribute('data-decorations', 'off');
  });

  it('turns decorations off and on, storing only a choice that differs from the site', () => {
    chooseDecorations(false, true);
    expect(localStorage.getItem(DEMO_DECORATIONS_KEY)).toBe('off');
    expect(root).toHaveAttribute('data-decorations', 'off');

    chooseDecorations(true, true);
    expect(localStorage.getItem(DEMO_DECORATIONS_KEY)).toBeNull();
    expect(root).not.toHaveAttribute('data-decorations');
  });

  it('stores a choice and applies it, and forgets it with null', () => {
    chooseDemo('density', 'compact');
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBe('compact');
    expect(root).toHaveAttribute('data-density', 'compact');

    chooseDemo('density', null);
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBeNull();
    expect(root).not.toHaveAttribute('data-density');
  });

  it('reads how people attend, ignoring unknown values', () => {
    expect(readDemoAttendance()).toBeNull();
    localStorage.setItem(DEMO_ATTENDANCE_KEY, 'hybrid');
    expect(readDemoAttendance()).toBe('hybrid');
    localStorage.setItem(DEMO_ATTENDANCE_KEY, 'remote');
    expect(readDemoAttendance()).toBeNull();
  });

  it('stores how people attend, or forgets it, then reloads', () => {
    const reload = vi.fn();

    chooseDemoAttendance('online', reload);
    expect(localStorage.getItem(DEMO_ATTENDANCE_KEY)).toBe('online');
    expect(reload).toHaveBeenCalledTimes(1);

    chooseDemoAttendance(null, reload);
    expect(localStorage.getItem(DEMO_ATTENDANCE_KEY)).toBeNull();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('stores when it is, or forgets it, then reloads, and reads only known values', () => {
    const reload = vi.fn();
    expect(readDemoTime()).toBeNull();

    chooseDemoTime('during', reload);
    expect(localStorage.getItem(DEMO_TIME_KEY)).toBe('during');
    expect(readDemoTime()).toBe('during');
    expect(reload).toHaveBeenCalledTimes(1);

    chooseDemoTime(null, reload);
    expect(localStorage.getItem(DEMO_TIME_KEY)).toBeNull();
    expect(reload).toHaveBeenCalledTimes(2);

    localStorage.setItem(DEMO_TIME_KEY, 'tomorrow');
    expect(readDemoTime()).toBeNull();
  });

  it('applies the stored choices from the inline head script', () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');

    new Function(demoScript)();

    expect(root).toHaveAttribute('data-theme', 'spotlight');
  });
});
