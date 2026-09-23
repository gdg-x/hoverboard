import { describe, expect, it } from 'vitest';
import { notEmpty, validEmail } from './strings';

describe('validEmail', () => {
  it('returns true for a valid email', () => {
    expect(validEmail('user@example.com')).toBe(true);
  });

  it('returns false for a missing @', () => {
    expect(validEmail('userexample.com')).toBe(false);
  });

  it('returns false for a missing domain', () => {
    expect(validEmail('user@')).toBe(false);
  });

  it('returns false for whitespace', () => {
    expect(validEmail('user @example.com')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(validEmail('')).toBe(false);
  });
});

describe('notEmpty', () => {
  it('returns true for a non-empty string', () => {
    expect(notEmpty('hello')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(notEmpty('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(notEmpty('   ')).toBe(false);
  });
});
