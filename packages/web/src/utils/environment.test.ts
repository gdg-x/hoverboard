import { describe, expect, it } from 'vitest';
import { isLocalhost } from './environment';

describe('isLocalhost', () => {
  it('returns true when the hostname is localhost', () => {
    expect(location.hostname).toBe('localhost');
    expect(isLocalhost()).toBe(true);
  });
});
