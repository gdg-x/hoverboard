import { describe, expect, it } from '@jest/globals';
import { updateSelectionBar } from './tab-selection-bar';

describe('updateSelectionBar', () => {
  it('does nothing when no bar element is provided', () => {
    expect(() => updateSelectionBar(null, null)).not.toThrow();
    expect(() => updateSelectionBar(undefined, undefined)).not.toThrow();
  });

  it('collapses the bar width when nothing is selected', () => {
    const bar = document.createElement('span');
    bar.style.left = '10px';
    bar.style.width = '20px';

    updateSelectionBar(bar, null);

    expect(bar.style.width).toBe('0px');
    expect(bar.style.left).toBe('10px');
  });

  it('positions the bar to match the selected element bounds', () => {
    const bar = document.createElement('span');
    const selected = document.createElement('div');
    Object.defineProperty(selected, 'offsetLeft', { value: 32, configurable: true });
    Object.defineProperty(selected, 'offsetWidth', { value: 64, configurable: true });

    updateSelectionBar(bar, selected);

    expect(bar.style.left).toBe('32px');
    expect(bar.style.width).toBe('64px');
  });
});
