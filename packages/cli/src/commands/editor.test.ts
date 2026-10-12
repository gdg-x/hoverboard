import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GoogleCloud } from '../lib/google-cloud.js';
import type { Policy } from './setup-github.js';
import { editors, runEditorAdd, runEditorList, runEditorRemove } from './editor.js';

const confirmMock = vi.hoisted(() => vi.fn());
vi.mock('../lib/prompt.js', () => ({ confirmChange: confirmMock }));

let repo: string;
let policy: Policy;
const requests: { method: string; url: string; body?: unknown }[] = [];
const cloud: GoogleCloud = {
  request: async <T>(method: string, url: string, body?: unknown) => {
    requests.push({ method, url, body });
    return (url.endsWith(':getIamPolicy') ? structuredClone(policy) : {}) as T;
  },
};
const output = () =>
  vi
    .mocked(console.log)
    .mock.calls.map(([line]) => String(line))
    .join('\n');
const setPolicy = () => requests.find(({ url }) => url.endsWith(':setIamPolicy'));

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-editor-'));
  mkdirSync(join(repo, '.git'));
  mkdirSync(join(repo, 'packages', 'config'), { recursive: true });
  writeFileSync(
    join(repo, 'packages', 'config', 'site.json'),
    JSON.stringify({ firebase: { projectId: 'fest-2027' } }),
  );
  vi.stubEnv('GCLOUD_PROJECT', undefined);
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  confirmMock.mockResolvedValue(true);
  policy = {
    bindings: [
      { role: 'roles/owner', members: ['user:owner@example.com'] },
      { role: 'roles/datastore.user', members: ['user:ada@example.com', 'serviceAccount:x@y'] },
      {
        role: 'roles/firebase.viewer',
        members: ['user:ada@example.com', 'user:viewer@example.com'],
      },
    ],
    etag: 'abc',
  };
  requests.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(repo, { recursive: true, force: true });
});

describe('editors', () => {
  it('are the people with both editor roles', () => {
    expect(editors(policy)).toEqual(['ada@example.com']);
  });
});

describe('runEditorList', () => {
  it("lists the project's content editors", async () => {
    expect(await runEditorList({ cloud })).toEqual({ ok: true, editors: ['ada@example.com'] });
    expect(output()).toContain('Content editors of fest-2027:\n  ada@example.com');
  });
});

describe('runEditorAdd', () => {
  it('grants both roles after asking, and keeps the rest of the policy', async () => {
    expect(await runEditorAdd('grace@example.com', { cloud })).toBe(true);

    expect(confirmMock).toHaveBeenCalledWith(
      'Grant roles/datastore.user and roles/firebase.viewer to grace@example.com in fest-2027?',
      false,
    );
    const { policy: written } = setPolicy()!.body as { policy: Policy };
    expect(editors(written)).toEqual(['ada@example.com', 'grace@example.com']);
    expect(written.bindings).toContainEqual({
      role: 'roles/owner',
      members: ['user:owner@example.com'],
    });
    expect(written.etag).toBe('abc');
    expect(output()).toContain('grace@example.com can edit the content in the Firebase console');
  });

  it('only grants the role that is missing', async () => {
    await runEditorAdd('viewer@example.com', { cloud, yes: true });

    expect(confirmMock).toHaveBeenCalledWith(
      'Grant roles/datastore.user to viewer@example.com in fest-2027?',
      true,
    );
  });

  it('changes nothing for an editor, with --dry-run, or when declined', async () => {
    await runEditorAdd('ada@example.com', { cloud });
    await runEditorAdd('grace@example.com', { cloud, dryRun: true });
    confirmMock.mockResolvedValueOnce(false);
    expect(await runEditorAdd('grace@example.com', { cloud })).toBe(false);

    expect(setPolicy()).toBeUndefined();
    expect(output()).toContain('✔ ada@example.com already is a content editor of fest-2027.');
    expect(output()).toContain(
      'Dry run: would grant roles/datastore.user and roles/firebase.viewer to grace@example.com',
    );
  });

  it('needs an email address', async () => {
    await expect(runEditorAdd('grace', { cloud })).rejects.toThrow(
      '"grace" is not an email address.',
    );
  });

  it("refuses the demo's project", async () => {
    rmSync(join(repo, 'packages', 'config', 'site.json'));

    await expect(runEditorAdd('grace@example.com', { cloud })).rejects.toThrow(
      'would deploy the demo site',
    );
  });
});

describe('runEditorRemove', () => {
  it('removes both roles', async () => {
    expect(await runEditorRemove('ada@example.com', { cloud, yes: true })).toBe(true);

    const { policy: written } = setPolicy()!.body as { policy: Policy };
    expect(editors(written)).toEqual([]);
    expect(written.bindings).toContainEqual({
      role: 'roles/datastore.user',
      members: ['serviceAccount:x@y'],
    });
  });
});
