import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { publicRequestFile } from './site-public';

describe('publicRequestFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'hoverboard-site-public-'));
    mkdirSync(join(dir, 'images'));
    writeFileSync(join(dir, 'images/logo.svg'), '<svg></svg>');
    writeFileSync(join(dir, 'images/my logo.svg'), '<svg></svg>');
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('finds the file a request names, without its query', () => {
    expect(publicRequestFile(dir, '/images/logo.svg?v=1')).toBe(join(dir, 'images/logo.svg'));
    expect(publicRequestFile(dir, '/images/my%20logo.svg')).toBe(join(dir, 'images/my logo.svg'));
  });

  it('leaves missing files, folders and paths outside it to the next handler', () => {
    expect(publicRequestFile(dir, '/images/missing.svg')).toBeUndefined();
    expect(publicRequestFile(dir, '/images')).toBeUndefined();
    expect(publicRequestFile(dir, '/%2e%2e/secret')).toBeUndefined();
    expect(publicRequestFile(dir, '/%E0%A4%A')).toBeUndefined();
  });
});
