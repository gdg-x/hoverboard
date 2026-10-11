import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command } from 'commander';
import { UsageError } from './lib/command.js';
import { target } from './lib/target.js';
import { createProgram, main } from './program.js';

const { runNotify, runDeploy } = vi.hoisted(() => ({ runNotify: vi.fn(), runDeploy: vi.fn() }));

vi.mock('./commands/notify.js', () => ({ runNotify }));
vi.mock('./commands/deploy.js', () => ({ runDeploy }));

const hb = (...args: string[]) => main(['node', 'hb', ...args]);

/** Every command that runs something, such as `data check`, by name. */
const leaves = (command: Command, prefix = ''): [string, Command][] =>
  command.commands.flatMap((child) => {
    const name = `${prefix}${child.name()}`;
    return child.commands.length ? leaves(child, `${name} `) : [[name, child]];
  });

const flags = (command: Command) => command.options.map((option) => option.long);

const notify = ['notify', '--title', 'Doors open', '--body', 'Welcome!'];

describe('hb', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    runNotify.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = undefined;
  });

  it('groups the data and emulator commands by topic', () => {
    const names = leaves(createProgram()).map(([name]) => name);

    expect(names).toEqual(
      expect.arrayContaining([
        'config validate',
        'emulators start',
        'emulators save',
        'data seed',
        'data import',
        'data export',
        'data check',
        'backup create',
        'backup list',
        'backup restore',
        'backup schedule',
      ]),
    );
    expect(names.filter((name) => name.startsWith('firestore'))).toEqual([]);
    expect(names).not.toContain('validate-config');
    expect(names).not.toContain('data copy');
    const check = leaves(createProgram()).find(([name]) => name === 'data check')![1];
    expect(flags(check)).not.toContain('--restore');
  });

  it('has --dry-run and --yes on every command that can change production', () => {
    const readOnly = ['data export', 'backup create', 'backup list'];
    for (const [name, command] of leaves(createProgram())) {
      if (!flags(command).includes('--production') || readOnly.includes(name)) continue;
      expect([name, flags(command)]).toEqual([
        name,
        expect.arrayContaining(['--dry-run', '--yes']),
      ]);
    }
    for (const name of ['deploy', 'backup schedule']) {
      expect(flags(leaves(createProgram()).find(([leaf]) => leaf === name)![1])).toEqual(
        expect.arrayContaining(['--dry-run', '--yes']),
      );
    }
  });

  it('uses the emulator by default, and production with --production', async () => {
    const targets: string[] = [];
    runNotify.mockImplementation(async () => (targets.push(target()), true));

    await hb(...notify);
    await hb(...notify, '--production');

    expect(targets).toEqual(['emulator', 'production']);
  });

  it('refuses FIRESTORE_TARGET=production without --production', async () => {
    vi.stubEnv('FIRESTORE_TARGET', 'production');

    expect(await hb(...notify)).toBe(2);

    expect(runNotify).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '✘ hb no longer reads FIRESTORE_TARGET. Add --production to use the Firebase project in ' +
        'site.json.',
    );
  });

  it('exits with 0 when the command worked, and 1 when it found a problem', async () => {
    expect(await hb(...notify)).toBe(0);

    runNotify.mockResolvedValue(false);
    expect(await hb(...notify)).toBe(1);
  });

  it('exits with 2 for a usage error', async () => {
    expect(await hb('nope')).toBe(2);
    expect(await hb('notify', '--title', 'Doors open')).toBe(2);

    runNotify.mockRejectedValue(new UsageError('Run again with --yes.'));
    expect(await hb(...notify)).toBe(2);
    expect(console.error).toHaveBeenCalledWith('✘ Run again with --yes.');
  });

  it('exits with 0 for --help and --version', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    expect(await hb('--help')).toBe(0);
    expect(await hb('--version')).toBe(0);
  });

  it('prints an expected error without a stack trace, and exits with 1', async () => {
    runNotify.mockRejectedValue(new Error('Not logged in.'));

    expect(await hb(...notify)).toBe(1);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('✘ Not logged in.');
  });

  it('prints the stack of a programming error', async () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'x')");
    runNotify.mockRejectedValue(bug);

    expect(await hb(...notify)).toBe(1);

    expect(console.error).toHaveBeenCalledWith(bug);
  });

  it('prints errors as annotations in GitHub Actions', async () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    runNotify.mockRejectedValue(new Error('Line one\nline two'));

    await hb(...notify);

    expect(console.error).toHaveBeenCalledWith('::error title=hb::Line one%0Aline two');
  });

  describe('--json', () => {
    const stdout = () => vi.mocked(console.log).mock.calls.map(([line]) => String(line));

    it('prints only the result on stdout, and the rest on stderr', async () => {
      runNotify.mockImplementation(async () => {
        console.log('✔ Added notifications/1 to the emulator.');
        return { ok: true, path: 'notifications/1' };
      });

      expect(await hb(...notify, '--json')).toBe(0);

      expect(stdout()).toHaveLength(1);
      expect(JSON.parse(stdout()[0]!)).toEqual({
        command: 'notify',
        target: 'emulator',
        ok: true,
        path: 'notifications/1',
      });
      expect(console.error).toHaveBeenCalledWith('✔ Added notifications/1 to the emulator.');
    });

    it('prints a result for a command that only says whether it worked', async () => {
      runDeploy.mockResolvedValue(false);

      expect(await hb('deploy', '--dry-run', '--json')).toBe(1);

      expect(JSON.parse(stdout()[0]!)).toEqual({ command: 'deploy', ok: false });
    });

    it('prints the error in the result', async () => {
      runNotify.mockRejectedValue(new UsageError('Run again with --yes.'));

      expect(await hb('--json', ...notify, '--production')).toBe(2);

      expect(JSON.parse(stdout()[0]!)).toEqual({
        command: 'notify',
        target: 'production',
        ok: false,
        error: 'Run again with --yes.',
      });
    });
  });
});
