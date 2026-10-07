import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkServiceAccountKeys } from './service-account-keys.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeRepo = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  for (const [file, content] of Object.entries(files)) writeFileSync(join(dir, file), content);
  return dir;
};

describe('checkServiceAccountKeys', () => {
  it('passes when there are no key files', () => {
    const repo = makeRepo({ 'package.json': '{ "name": "hoverboard" }', 'firebase.json': '{}' });

    expect(checkServiceAccountKeys(repo)).toEqual({
      name: 'Service account keys',
      ok: true,
      message: 'No service account key files in the repository root.',
    });
  });

  it('warns about serviceAccount.json, even the empty CI placeholder', () => {
    const result = checkServiceAccountKeys(makeRepo({ 'serviceAccount.json': '{}' }));

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Found serviceAccount.json.');
  });

  it('warns about keys downloaded from the Firebase console', () => {
    const result = checkServiceAccountKeys(
      makeRepo({ 'demo-firebase-adminsdk-abc12-0123456789.json': '{}' }),
    );

    expect(result.message).toContain('Found demo-firebase-adminsdk-abc12-0123456789.json.');
  });

  it('warns about renamed key files by their content', () => {
    const result = checkServiceAccountKeys(
      makeRepo({ 'key.json': '{ "type": "service_account" }', 'broken.json': '{' }),
    );

    expect(result.message).toContain('Found key.json.');
  });

  it('skips without a repository root', () => {
    expect(checkServiceAccountKeys(undefined)).toMatchObject({ ok: true, warning: true });
  });
});
