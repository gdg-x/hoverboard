import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isBillingEnabled } from '../lib/billing.js';
import { UsageError } from '../lib/command.js';
import { readExport, writeExport } from '../lib/data-format.js';
import {
  type AuthUser,
  createSchedule,
  deleteSchedule,
  exportUsers,
  importUsers,
  listManagedBackups,
  listSchedules,
  pitrEnabled,
  setPitr,
} from '../lib/firebase-backups.js';
import { confirmChange } from '../lib/prompt.js';
import { setTarget } from '../lib/target.js';
import {
  localBackups,
  runBackupCreate,
  runBackupList,
  runBackupRestore,
  runBackupSchedule,
  wantedSchedule,
} from './backup.js';
import { exportDocuments } from './data-export.js';
import { importDocuments } from './data-import.js';

vi.mock('../lib/firestore.js', () => ({ firestore: {} }));
vi.mock('./data-export.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./data-export.js')>()),
  exportDocuments: vi.fn(),
}));
vi.mock('./data-import.js', () => ({ importDocuments: vi.fn() }));
vi.mock('../lib/billing.js', () => ({ isBillingEnabled: vi.fn() }));
vi.mock('../lib/prompt.js', () => ({ confirmChange: vi.fn() }));
vi.mock('../lib/firebase-backups.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/firebase-backups.js')>()),
  listSchedules: vi.fn(),
  createSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  listManagedBackups: vi.fn(),
  pitrEnabled: vi.fn(),
  setPitr: vi.fn(),
  exportUsers: vi.fn(),
  importUsers: vi.fn(),
}));
vi.mock('../utils/firebase-project.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/firebase-project.js')>()),
  resolveFirebaseProjectId: () => 'fest-2027',
}));

const meta = {
  hoverboard: '4.0.0',
  projectId: 'demo-hoverboard',
  createdAt: '2027-10-15T09:00:00.000Z',
  command: 'hb backup create',
};
const team = (title: string) => ({ title });
const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');

const dirs: string[] = [];
let repo: string;

const backupsFolder = () => join(repo, '.firebase/backups');
const backups = () => (existsSync(backupsFolder()) ? readdirSync(backupsFolder()) : []);

/** A backup in .firebase/backups, with Auth users when given. */
const backupOf = (
  name: string,
  documents: { path: string; data: Record<string, unknown> }[],
  extra: { scope?: 'all' | 'changes'; created?: string[]; users?: AuthUser[] } = {},
) => {
  const folder = join(backupsFolder(), name);
  writeExport(folder, documents, {
    ...meta,
    ...(extra.scope ? { scope: extra.scope } : {}),
    ...(extra.created ? { created: extra.created } : {}),
  });
  if (extra.users) {
    mkdirSync(join(folder, 'auth'));
    writeFileSync(join(folder, 'auth/users.json'), JSON.stringify({ users: extra.users }));
    const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8')) as object;
    writeFileSync(
      join(folder, 'manifest.json'),
      JSON.stringify({ ...manifest, auth: { file: 'auth/users.json', users: extra.users.length } }),
    );
  }
  return folder;
};

/** The users `firebase auth:export` writes for the project. */
const usersInProject = (users: AuthUser[]) =>
  vi
    .mocked(exportUsers)
    .mockImplementation(async (_repo, _project, file) =>
      writeFileSync(file, JSON.stringify({ users })),
    );

/** The users each `firebase auth:import` got. */
const imported = () => {
  const files: AuthUser[][] = [];
  vi.mocked(importUsers).mockImplementation(async (_repo, _project, file) => {
    files.push((JSON.parse(readFileSync(file, 'utf8')) as { users: AuthUser[] }).users);
  });
  return files;
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-backup-'));
  dirs.push(repo);
  mkdirSync(join(repo, '.git'));
  mkdirSync(join(repo, 'packages/config'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{ "version": "4.0.0" }');
  writeFileSync(join(repo, 'packages/config/site.json'), '{ "schemaVersion": 1 }');
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.mocked(exportDocuments).mockResolvedValue([
    { path: 'team/ada', data: team('Ada') },
    { path: 'subscribers/a', data: { email: 'a@example.com' } },
  ]);
  vi.mocked(importDocuments).mockResolvedValue({ ok: true, written: 1, deleted: 0 });
  vi.mocked(confirmChange).mockResolvedValue(true);
  vi.mocked(isBillingEnabled).mockResolvedValue(true);
  vi.mocked(listSchedules).mockResolvedValue([]);
  vi.mocked(pitrEnabled).mockResolvedValue(false);
  vi.mocked(listManagedBackups).mockResolvedValue([]);
  usersInProject([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  setTarget('emulator');
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('runBackupCreate', () => {
  it('backs up every document of the emulator, without Auth users', async () => {
    const result = await runBackupCreate();

    expect(exportDocuments).toHaveBeenCalledWith({}, { all: true });
    expect(exportUsers).not.toHaveBeenCalled();
    const [name] = backups();
    const { manifest, documents } = readExport(join(backupsFolder(), name!));
    expect(manifest).toMatchObject({ scope: 'all', command: 'hb backup create' });
    expect(manifest.auth).toBeUndefined();
    expect(documents).toHaveLength(2);
    expect(result).toEqual({ ok: true, folder: `.firebase/backups/${name}`, documents: 2 });
    expect(output()).toContain(`Restore with: ./hb backup restore .firebase/backups/${name}\n`);
    expect(output()).toContain('personal data');
  });

  it('also backs up the Auth users of production', async () => {
    setTarget('production');
    usersInProject([{ localId: 'u1' }, { localId: 'u2' }]);

    const result = await runBackupCreate();

    const folder = join(backupsFolder(), backups()[0]!);
    expect(exportUsers).toHaveBeenCalledWith(repo, 'fest-2027', join(folder, 'auth/users.json'));
    expect(readExport(folder).manifest).toMatchObject({
      projectId: 'fest-2027',
      auth: { file: 'auth/users.json', users: 2 },
    });
    expect(result).toMatchObject({ ok: true, documents: 2, users: 2 });
    expect(output()).toContain('--production');
  });

  it('leaves the Auth users out with auth false', async () => {
    setTarget('production');

    await runBackupCreate({ auth: false });

    expect(exportUsers).not.toHaveBeenCalled();
  });

  it('fails, and keeps the documents, when the users can not be exported', async () => {
    setTarget('production');
    vi.mocked(exportUsers).mockRejectedValue(new Error('Not logged in.'));

    expect(await runBackupCreate()).toBe(false);

    expect(output()).toContain("Couldn't back up the Auth users: Not logged in.");
    expect(readExport(join(backupsFolder(), backups()[0]!)).documents).toHaveLength(2);
  });
});

describe('runBackupList', () => {
  it('lists the local backups, and nothing from Firestore on the emulator', async () => {
    backupOf('2027-10-15T09-00-00.000Z', [{ path: 'team/ada', data: team('Ada') }], {
      scope: 'all',
      users: [{ localId: 'u1' }],
    });
    backupOf('2027-10-16T09-00-00.000Z', [{ path: 'team/ada', data: team('Ada') }], {
      scope: 'changes',
      created: [],
    });
    mkdirSync(join(backupsFolder(), '2026-01-01T00-00-00.000Z'));
    writeFileSync(join(backupsFolder(), '2026-01-01T00-00-00.000Z/documents.json'), '{}');

    const result = await runBackupList();

    expect(
      localBackups(repo).map(({ name, scope, documents, users }) => ({
        name,
        scope,
        documents,
        users,
      })),
    ).toEqual([
      {
        name: '2026-01-01T00-00-00.000Z',
        scope: 'changes',
        documents: undefined,
        users: undefined,
      },
      { name: '2027-10-15T09-00-00.000Z', scope: 'all', documents: 1, users: 1 },
      { name: '2027-10-16T09-00-00.000Z', scope: 'changes', documents: 1, users: undefined },
    ]);
    expect(output()).toContain(
      '  2027-10-15T09-00-00.000Z: all data, 1 document and 1 user from demo-hoverboard',
    );
    expect(listSchedules).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true });
  });

  it('says how to make one when there are none', async () => {
    await runBackupList();

    expect(output()).toContain('No backups in .firebase/backups. ./hb backup create makes one.');
  });

  it('lists the schedules and the backups in Firestore on production', async () => {
    setTarget('production');
    vi.mocked(listSchedules).mockResolvedValue([
      { name: 's1', retention: '604800s', dailyRecurrence: {} },
    ]);
    vi.mocked(pitrEnabled).mockResolvedValue(true);
    vi.mocked(listManagedBackups).mockResolvedValue([
      {
        name: 'projects/fest-2027/locations/nam5/backups/b1',
        snapshotTime: '2027-10-15T03:00:00Z',
        expireTime: '2027-10-22T03:00:00Z',
        state: 'READY',
        stats: { sizeBytes: '2048' },
      },
    ]);

    const result = await runBackupList();

    expect(output()).toContain('Scheduled backups of fest-2027: daily, kept 7 days');
    expect(output()).toContain('Point-in-time recovery: on.');
    expect(output()).toContain('2027-10-15T03:00:00Z: 2.0 KB, kept until 2027-10-22');
    expect(output()).toContain('projects/fest-2027/locations/nam5/backups/b1');
    expect(result).toMatchObject({ ok: true, pitr: true });
  });

  it('still lists the local backups when Firestore can not be read', async () => {
    setTarget('production');
    vi.mocked(listSchedules).mockRejectedValue(new Error('Billing is off.'));

    expect(await runBackupList()).toMatchObject({ ok: true });
    expect(output()).toContain("! Couldn't list the backups in Firestore: Billing is off.");
  });
});

describe('runBackupRestore', () => {
  it('replaces the collections of a backup of all the data, as it is', async () => {
    const folder = backupOf('full', [{ path: 'team/ada', data: team('Ada') }], { scope: 'all' });

    await runBackupRestore(folder);

    expect(importDocuments).toHaveBeenCalledWith(
      [{ path: 'team/ada', data: team('Ada') }],
      '.firebase/backups/full',
      {
        exact: true,
        replace: true,
        deletes: [],
        dryRun: false,
        yes: false,
        command: 'hb backup restore',
      },
    );
  });

  it('writes back the changes of a fix or import, and deletes what it created', async () => {
    backupOf('fix', [{ path: 'team/ada', data: team('Ada') }], {
      scope: 'changes',
      created: ['team/new'],
    });

    await runBackupRestore('fix', { dryRun: true });

    expect(importDocuments).toHaveBeenCalledWith(
      [{ path: 'team/ada', data: team('Ada') }],
      '.firebase/backups/fix',
      expect.objectContaining({ replace: false, deletes: ['team/new'], dryRun: true }),
    );
  });

  it('reads the documents.json of backups from before the data format', async () => {
    const folder = join(backupsFolder(), 'old');
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, 'documents.json'),
      JSON.stringify({ documents: { 'team/ada': team('Ada') }, created: ['team/new'] }),
    );

    await runBackupRestore(folder);

    expect(importDocuments).toHaveBeenCalledWith(
      [{ path: 'team/ada', data: team('Ada') }],
      '.firebase/backups/old',
      expect.objectContaining({ replace: false, deletes: ['team/new'] }),
    );
  });

  it("refuses a folder that isn't there or isn't a backup", async () => {
    await expect(runBackupRestore('nope')).rejects.toThrow(UsageError);
    mkdirSync(join(repo, 'empty'));
    await expect(runBackupRestore(join(repo, 'empty'))).rejects.toThrow("isn't a backup");
    expect(importDocuments).not.toHaveBeenCalled();
  });

  it('prints the steps for a backup in Firestore', async () => {
    const result = await runBackupRestore('projects/fest-2027/locations/nam5/backups/b1');

    expect(result).toEqual({ ok: true, managed: true });
    expect(output()).toContain(
      'firestore:databases:restore --database restored --backup ' +
        'projects/fest-2027/locations/nam5/backups/b1 --project fest-2027',
    );
    expect(importDocuments).not.toHaveBeenCalled();
  });

  it('only notes the Auth users on the emulator', async () => {
    backupOf('full', [], { scope: 'all', users: [{ localId: 'u1' }] });

    await runBackupRestore('full');

    expect(exportUsers).not.toHaveBeenCalled();
    expect(output()).toContain('has Auth users, which only restore to production.');
  });

  it('adds the users production no longer has, without the ones with a password', async () => {
    setTarget('production');
    backupOf('full', [], {
      scope: 'all',
      users: [
        { localId: 'gone', email: 'gone@example.com' },
        { localId: 'there', email: 'old@example.com' },
        { localId: 'password', passwordHash: 'x' },
      ],
    });
    usersInProject([{ localId: 'there', email: 'new@example.com' }]);
    const files = imported();

    const result = await runBackupRestore('full', { yes: true });

    expect(files).toEqual([[{ localId: 'gone', email: 'gone@example.com' }]]);
    expect(confirmChange).toHaveBeenCalledWith('Import 1 user into fest-2027?', true);
    expect(output()).toContain('1 to import, 1 already in fest-2027 (kept');
    expect(output()).toContain('1 user with a password left out.');
    expect(result).toMatchObject({ ok: true, users: { imported: 1, kept: 1 } });
  });

  it('overwrites the users that exist with overwriteUsers, after backing them up', async () => {
    setTarget('production');
    backupOf('full', [], {
      scope: 'all',
      users: [{ localId: 'there', email: 'old@example.com' }],
    });
    usersInProject([{ localId: 'there', email: 'new@example.com' }]);
    vi.mocked(importDocuments).mockResolvedValue({
      ok: true,
      backup: '.firebase/backups/replaced',
    });
    const files = imported();

    const result = await runBackupRestore('full', { overwriteUsers: true });

    expect(files).toEqual([[{ localId: 'there', email: 'old@example.com' }]]);
    const saved = readExport(join(backupsFolder(), 'replaced'));
    expect(saved.manifest).toMatchObject({ scope: 'changes', auth: { users: 1 } });
    expect(
      JSON.parse(readFileSync(join(backupsFolder(), 'replaced/auth/users.json'), 'utf8')),
    ).toEqual({ users: [{ localId: 'there', email: 'new@example.com' }] });
    expect(result).toMatchObject({ usersBackup: '.firebase/backups/replaced' });
    expect(output()).toContain(
      'Undo with: ./hb backup restore .firebase/backups/replaced --production --overwrite-users',
    );
  });

  it("doesn't import users in a dry run, or when told no", async () => {
    setTarget('production');
    backupOf('full', [], { scope: 'all', users: [{ localId: 'gone' }] });

    await runBackupRestore('full', { dryRun: true });
    expect(importUsers).not.toHaveBeenCalled();
    expect(output()).toContain('Dry run: would import 1 user.');

    vi.mocked(confirmChange).mockResolvedValue(false);
    expect(await runBackupRestore('full')).toBe(false);
    expect(importUsers).not.toHaveBeenCalled();
  });

  it('leaves the users alone with auth false, or when the documents were not restored', async () => {
    setTarget('production');
    backupOf('full', [], { scope: 'all', users: [{ localId: 'gone' }] });

    await runBackupRestore('full', { auth: false });
    vi.mocked(importDocuments).mockResolvedValue(false);
    expect(await runBackupRestore('full')).toBe(false);

    expect(exportUsers).not.toHaveBeenCalled();
  });
});

describe('wantedSchedule', () => {
  it('takes daily or weekly, with the retention in days', () => {
    expect(wantedSchedule({ daily: true })).toEqual({ retentionDays: 7 });
    expect(wantedSchedule({ weekly: true })).toEqual({ weekly: 'SUNDAY', retentionDays: 28 });
    expect(wantedSchedule({ weekly: 'monday', retention: '14' })).toEqual({
      weekly: 'MONDAY',
      retentionDays: 14,
    });
    expect(wantedSchedule({ disable: true })).toBeUndefined();
  });

  it('refuses options that do not go together, and days out of range', () => {
    expect(() => wantedSchedule({})).toThrow(UsageError);
    expect(() => wantedSchedule({ daily: true, weekly: true })).toThrow(UsageError);
    expect(() => wantedSchedule({ weekly: 'someday' })).toThrow('--weekly takes a day');
    expect(() => wantedSchedule({ daily: true, retention: '8' })).toThrow('from 1 to 7');
    expect(() => wantedSchedule({ weekly: true, retention: '0' })).toThrow('from 1 to 98');
    expect(() => wantedSchedule({ disable: true, retention: '7' })).toThrow(UsageError);
  });
});

describe('runBackupSchedule', () => {
  const daily = { name: 'daily', retention: '604800s', dailyRecurrence: {} };

  it('creates a schedule, after asking', async () => {
    const result = await runBackupSchedule({ daily: true });

    expect(confirmChange).toHaveBeenCalled();
    expect(createSchedule).toHaveBeenCalledWith(repo, 'fest-2027', { retentionDays: 7 });
    expect(setPitr).not.toHaveBeenCalled();
    expect(output()).toContain('Create: daily, kept 7 days');
    expect(result).toMatchObject({ ok: true, created: 1, deleted: 0 });
  });

  it('changes nothing in a dry run', async () => {
    await runBackupSchedule({ weekly: true, pitr: true, dryRun: true });

    expect(createSchedule).not.toHaveBeenCalled();
    expect(setPitr).not.toHaveBeenCalled();
    expect(output()).toContain('Create: weekly on sunday, kept 28 days');
    expect(output()).toContain('Point-in-time recovery: turn on');
  });

  it('keeps a schedule that matches', async () => {
    vi.mocked(listSchedules).mockResolvedValue([daily]);

    const result = await runBackupSchedule({ daily: true });

    expect(output()).toContain('Nothing to change.');
    expect(confirmChange).not.toHaveBeenCalled();
    expect(result).toMatchObject({ created: 0, deleted: 0 });
  });

  it('replaces a schedule that differs, and turns on point-in-time recovery', async () => {
    vi.mocked(listSchedules).mockResolvedValue([daily]);

    await runBackupSchedule({ daily: true, retention: '3', pitr: true, yes: true });

    expect(deleteSchedule).toHaveBeenCalledWith(repo, 'fest-2027', 'daily');
    expect(createSchedule).toHaveBeenCalledWith(repo, 'fest-2027', { retentionDays: 3 });
    expect(setPitr).toHaveBeenCalledWith(repo, 'fest-2027', true);
    expect(vi.mocked(deleteSchedule).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createSchedule).mock.invocationCallOrder[0]!,
    );
  });

  it('deletes the schedules and turns point-in-time recovery off with disable', async () => {
    vi.mocked(listSchedules).mockResolvedValue([daily]);
    vi.mocked(pitrEnabled).mockResolvedValue(true);
    vi.mocked(isBillingEnabled).mockResolvedValue(false);

    await runBackupSchedule({ disable: true, yes: true });

    expect(deleteSchedule).toHaveBeenCalledWith(repo, 'fest-2027', 'daily');
    expect(createSchedule).not.toHaveBeenCalled();
    expect(setPitr).toHaveBeenCalledWith(repo, 'fest-2027', false);
  });

  it('needs the Blaze plan to back up', async () => {
    vi.mocked(isBillingEnabled).mockResolvedValue(false);

    expect(await runBackupSchedule({ daily: true })).toBe(false);

    expect(output()).toContain('Scheduled backups need the Blaze plan');
    expect(listSchedules).not.toHaveBeenCalled();
  });

  it('changes nothing when told no', async () => {
    vi.mocked(confirmChange).mockResolvedValue(false);

    expect(await runBackupSchedule({ daily: true })).toBe(false);

    expect(createSchedule).not.toHaveBeenCalled();
  });
});
