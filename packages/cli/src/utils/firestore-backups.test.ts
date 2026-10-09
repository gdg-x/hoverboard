import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { BACKUPS_PATH } from '../lib/firestore-fix.js';
import { checkFirestoreBackups } from './firestore-backups.js';

const NOW = Date.parse('2026-10-09T12:00:00.000Z');
const repos: string[] = [];

afterEach(() => {
  for (const repo of repos.splice(0)) rmSync(repo, { recursive: true, force: true });
});

const repoWith = (...backups: string[]): string => {
  const repo = mkdtempSync(join(tmpdir(), 'hoverboard-backups-'));
  repos.push(repo);
  for (const backup of backups) mkdirSync(join(repo, BACKUPS_PATH, backup), { recursive: true });
  return repo;
};

describe('checkFirestoreBackups', () => {
  it('passes without a backups folder', () => {
    const result = checkFirestoreBackups(repoWith(), NOW);
    expect(result).toMatchObject({ ok: true });
    expect(result.warning).toBeUndefined();
  });

  it('passes with recent backups', () => {
    const result = checkFirestoreBackups(repoWith('2026-10-01T08-00-00.000Z'), NOW);
    expect(result).toMatchObject({ ok: true, message: 'None older than 30 days.' });
    expect(result.warning).toBeUndefined();
  });

  it('warns about backups older than 30 days, with a command to delete each', () => {
    const repo = repoWith(
      '2026-09-08T11-00-00.000Z',
      '2026-08-01T08-00-00Z',
      '2026-10-01T08-00-00.000Z',
      'notes',
    );
    const result = checkFirestoreBackups(repo, NOW);
    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain(
      '2 backups are older than 30 days, the oldest from 2026-08-01',
    );
    expect(result.message).toContain(`rm -r ${BACKUPS_PATH}/2026-08-01T08-00-00Z\n`);
    expect(result.message).toContain(`rm -r ${BACKUPS_PATH}/2026-09-08T11-00-00.000Z`);
    expect(result.message).not.toContain('2026-10-01');
    expect(result.message).not.toContain('notes');
  });
});
