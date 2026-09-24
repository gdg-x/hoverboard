import { describe, expect, it } from 'vitest';
import { getSummary, notEmpty, validEmail } from './strings';

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

describe('getSummary', () => {
  it('returns the full text when there are no newlines or break tags', () => {
    expect(getSummary('A simple session description.')).toBe('A simple session description.');
  });

  it('truncates at the first newline', () => {
    expect(getSummary('First line\nSecond line\nThird line')).toBe('First line');
  });

  it('truncates at the first <br> tag', () => {
    expect(getSummary('First paragraph<br>Second paragraph')).toBe('First paragraph');
  });

  it('truncates at the first <br/> tag', () => {
    expect(getSummary('First paragraph<br/>Second paragraph')).toBe('First paragraph');
  });

  it('truncates at the first <br /> tag', () => {
    expect(getSummary('First paragraph<br />Second paragraph')).toBe('First paragraph');
  });

  it('truncates at whichever break delimiter comes first', () => {
    expect(getSummary('First part\nSecond part<br>Third part')).toBe('First part');
    expect(getSummary('First part<br>Second part\nThird part')).toBe('First part');
  });

  it('returns an empty string when given an empty string', () => {
    expect(getSummary('')).toBe('');
  });

  it('returns an empty string when called without arguments', () => {
    expect(getSummary()).toBe('');
  });
});
