import { isServer } from 'lit';
import { describe, expect, it } from 'vitest';

describe('isServer', () => {
  it('is false under jsdom, so components take their browser path in tests', () => {
    expect(isServer).toBe(false);
  });
});
