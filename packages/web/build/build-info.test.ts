import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildInfo } from './build-info';

describe('buildInfo', () => {
  const now = new Date('2027-10-15T09:00:00Z');

  it('has the short commit and the time', () => {
    expect(buildInfo(process.cwd(), now)).toEqual({
      sha: expect.stringMatching(/^[0-9a-f]{7,}$/),
      time: '2027-10-15T09:00:00.000Z',
    });
  });

  it('leaves out the commit outside a git checkout', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-build-'));
    try {
      expect(buildInfo(dir, now)).toEqual({ time: '2027-10-15T09:00:00.000Z' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
