import { afterEach, describe, expect, it } from 'vitest';
import {
  applyDemoChoices,
  chooseDemo,
  DEMO_DENSITY_KEY,
  DEMO_THEME_KEY,
  demoScript,
  readDemoChoices,
} from './demo';

const root = document.documentElement;

describe('demo choices', () => {
  afterEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
    root.removeAttribute('data-density');
  });

  it('reads the stored theme and spacing, or nothing when storage throws', () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');

    expect(readDemoChoices(() => localStorage)).toEqual({ theme: 'spotlight', density: null });
    expect(
      readDemoChoices(() => {
        throw new Error('blocked');
      }),
    ).toEqual({ theme: null, density: null });
  });

  it('sets and clears the attributes the theme CSS switches on', () => {
    applyDemoChoices(document, { theme: 'spotlight', density: 'roomy' });
    expect(root).toHaveAttribute('data-theme', 'spotlight');
    expect(root).toHaveAttribute('data-density', 'roomy');

    applyDemoChoices(document, { theme: null, density: null });
    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-density');
  });

  it('stores a choice and applies it, and forgets it with null', () => {
    chooseDemo('density', 'compact');
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBe('compact');
    expect(root).toHaveAttribute('data-density', 'compact');

    chooseDemo('density', null);
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBeNull();
    expect(root).not.toHaveAttribute('data-density');
  });

  it('applies the stored choices from the inline head script', () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');

    new Function(demoScript)();

    expect(root).toHaveAttribute('data-theme', 'spotlight');
  });
});
