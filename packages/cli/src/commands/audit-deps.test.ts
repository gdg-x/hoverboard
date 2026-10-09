import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCEPTED_ADVISORIES, runAuditDeps, severeAdvisories } from './audit-deps.js';

const { captureCommandMock } = vi.hoisted(() => ({ captureCommandMock: vi.fn() }));

vi.mock('../lib/spawn.js', () => ({ captureCommand: captureCommandMock }));

const ACCEPTED_URL = Object.keys(ACCEPTED_ADVISORIES)[0] as string;

const advisory = (severity: string, url: string) => ({
  name: 'left-pad',
  severity,
  title: `A ${severity} problem`,
  url,
});

const report = (...via: (string | ReturnType<typeof advisory>)[]) => ({
  vulnerabilities: { 'left-pad': { via } },
});

const dirsToClean: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A repository whose root and packages/web have lockfiles. */
const makeRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  mkdirSync(join(dir, '.git'));
  mkdirSync(join(dir, 'packages/web'), { recursive: true });
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  writeFileSync(join(dir, 'packages/web/package-lock.json'), '{}');
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
};

const audits = (...reports: object[]) => {
  for (const r of reports) {
    captureCommandMock.mockReturnValueOnce({ status: 1, stdout: JSON.stringify(r), stderr: '' });
  }
};

describe('severeAdvisories', () => {
  it('keeps high and critical advisories once each, and skips the rest', () => {
    const high = advisory('high', 'https://github.com/advisories/GHSA-high');
    const critical = advisory('critical', 'https://github.com/advisories/GHSA-critical');
    const moderate = advisory('moderate', 'https://github.com/advisories/GHSA-moderate');

    expect(
      severeAdvisories('packages/web', {
        vulnerabilities: {
          'left-pad': { via: [high, moderate] },
          'right-pad': { via: ['left-pad', high, critical] },
        },
      }),
    ).toEqual([
      { pkg: 'packages/web', ...high },
      { pkg: 'packages/web', ...critical },
    ]);
  });
});

describe('runAuditDeps', () => {
  it('audits the production dependencies of each package with a lockfile', () => {
    const repo = makeRepo();
    audits(report(), report());
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runAuditDeps()).toBe(true);
    expect(captureCommandMock.mock.calls).toEqual([
      ['npm', ['audit', '--omit=dev', '--json'], join(repo, '.')],
      ['npm', ['audit', '--omit=dev', '--json'], join(repo, 'packages/web')],
    ]);
  });

  it('fails on a high advisory that is not accepted', () => {
    makeRepo();
    audits(report(), report(advisory('high', 'https://github.com/advisories/GHSA-new')));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runAuditDeps()).toBe(false);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('✘ packages/web: left-pad (high)'));
  });

  it('passes with only accepted advisories, and says why they are accepted', () => {
    makeRepo();
    audits(report(), report(advisory('high', ACCEPTED_URL)));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runAuditDeps()).toBe(true);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(
        `! Accepted packages/web: left-pad (high) A high problem ${ACCEPTED_URL}`,
      ),
    );
  });

  it('says when an accepted advisory is no longer reported', () => {
    makeRepo();
    audits(report(), report());
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runAuditDeps()).toBe(true);
    expect(log).toHaveBeenCalledWith(
      `! ${ACCEPTED_URL} is no longer reported. Remove it from the list.`,
    );
  });

  it('fails when npm audit does not return a report', () => {
    makeRepo();
    captureCommandMock.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'network error' });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(runAuditDeps()).toBe(false);
  });
});
