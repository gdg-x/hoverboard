import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmUpgradeTiming, inEventWeek } from './event-week.js';

const confirmMock = vi.hoisted(() => vi.fn());
vi.mock('../lib/prompt.js', () => ({ confirmChange: confirmMock }));

const event = { startDate: '2027-10-15', endDate: '2027-10-16', timezone: 'Europe/Kyiv' };

describe('inEventWeek', () => {
  it('is from a week before the first day to the last, in the event time zone', () => {
    expect(inEventWeek(event, new Date('2027-10-07T20:59:00Z'))).toBe(false);
    expect(inEventWeek(event, new Date('2027-10-07T21:00:00Z'))).toBe(true);
    expect(inEventWeek(event, new Date('2027-10-16T20:59:00Z'))).toBe(true);
    expect(inEventWeek(event, new Date('2027-10-16T21:00:00Z'))).toBe(false);
  });
});

describe('confirmUpgradeTiming', () => {
  let repo: string;
  const during = new Date('2027-10-15T09:00:00Z');

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'hoverboard-event-week-'));
    mkdirSync(join(repo, 'packages', 'config'), { recursive: true });
    writeFileSync(join(repo, 'packages', 'config', 'site.json'), JSON.stringify({ event }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    confirmMock.mockReset();
    rmSync(repo, { recursive: true, force: true });
  });

  it('goes on without asking outside the event week', async () => {
    expect(await confirmUpgradeTiming(repo, { now: new Date('2027-09-01T09:00:00Z') })).toBe(true);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('warns and asks during the event week, and stops when declined', async () => {
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect(await confirmUpgradeTiming(repo, { now: during })).toBe(true);
    expect(await confirmUpgradeTiming(repo, { now: during, yes: true })).toBe(false);

    expect(confirmMock).toHaveBeenLastCalledWith('Upgrade anyway?', true);
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain(
      'The event is on 2027-10-15 to 2027-10-16. An upgrade now could break the site',
    );
  });

  it('only warns on a dry run', async () => {
    expect(await confirmUpgradeTiming(repo, { now: during, dryRun: true })).toBe(true);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });
});
