import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeExport } from '../lib/data-format.js';
import { runCommand } from '../lib/spawn.js';
import { setTarget, target } from '../lib/target.js';
import { importDocuments } from './data-import.js';
import { runDataPull, runDataPush } from './data-sync.js';

vi.mock('../lib/spawn.js', () => ({ runCommand: vi.fn() }));
vi.mock('./data-import.js', () => ({ importDocuments: vi.fn() }));
vi.mock('../utils/node-version.js', () => ({ findRepoRoot: () => '/repo' }));
vi.mock('../utils/firebase-project.js', () => ({ resolveFirebaseProjectId: () => 'fest-2027' }));

const team = { path: 'team/ada', data: { title: 'Ada' } };

/** The documents the child `hb data export` writes, and the arguments it got. */
const exported = (documents: { path: string; data: Record<string, unknown> }[]) => {
  const calls: string[][] = [];
  vi.mocked(runCommand).mockImplementation((_command, args) => {
    calls.push(args);
    writeExport(args[3]!, documents, {
      hoverboard: '4.0.0',
      projectId: 'fest-2027',
      createdAt: '2027-10-15T09:00:00.000Z',
      command: 'hb data export',
    });
    return 0;
  });
  return calls;
};

let targets: string[];

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  targets = [];
  vi.mocked(importDocuments).mockImplementation(async () => {
    targets.push(target());
    return { ok: true };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setTarget('emulator');
});

describe('runDataPull', () => {
  it("exports production's content, and replaces the emulator's with it", async () => {
    const calls = exported([team]);

    expect(await runDataPull({ dryRun: true })).toEqual({ ok: true });

    expect(calls[0]).toEqual([
      'hb',
      'data',
      'export',
      expect.stringContaining('hb-content-'),
      '--content',
      '--production',
    ]);
    expect(importDocuments).toHaveBeenCalledWith([team], 'fest-2027', {
      collection: [],
      replace: true,
      entries: expect.arrayContaining(['sessions', 'partners/*/items', 'blog']),
      dryRun: true,
      command: 'hb data pull',
    });
    const { entries } = vi.mocked(importDocuments).mock.calls[0]![2]!;
    expect(entries).not.toContain('subscribers');
    expect(targets).toEqual(['emulator']);
  });

  it('stops when the export fails', async () => {
    vi.mocked(runCommand).mockReturnValue(1);

    await expect(runDataPull()).rejects.toThrow("Couldn't export the content of production.");
    expect(importDocuments).not.toHaveBeenCalled();
  });
});

describe('runDataPush', () => {
  it("exports the emulator's content, and replaces production's with it", async () => {
    const calls = exported([team]);

    await runDataPush({ collection: ['team'], yes: true });

    expect(calls[0]).toEqual([
      'hb',
      'data',
      'export',
      expect.any(String),
      '--content',
      '--collection',
      'team',
    ]);
    expect(importDocuments).toHaveBeenCalledWith(
      [team],
      'the emulator',
      expect.objectContaining({
        collection: ['team'],
        replace: true,
        yes: true,
        command: 'hb data push',
      }),
    );
    expect(targets).toEqual(['production']);
  });

  it('pushes nothing when the emulator has no content', async () => {
    exported([]);

    expect(await runDataPush()).toBe(false);

    expect(importDocuments).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      '✘ The emulator has no content, so nothing was pushed.',
    );
  });
});
