import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('../..', import.meta.url));

export interface SiteBuild {
  status: number | null;
  stderr: string;
  /** The HTML files, relative to `dist`, sorted. */
  pages: string[];
  /** The names of the JavaScript chunks in `dist/_astro`, without their hashes. */
  chunks: string[];
  read: (file: string) => string;
  remove: () => void;
}

/**
 * Builds a copy of packages/web without Firestore content, next to the site config that
 * `writeConfig` writes to the directory it gets, so the real dist is untouched.
 */
export const buildSite = (writeConfig: (configDir: string) => void): SiteBuild => {
  // macOS links /var to /private/var. Astro needs its root as a real path to match module paths.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'hoverboard-build-')));
  const web = join(root, 'packages/web');
  const skip = new Set(['node_modules', 'dist', '.astro'].map((name) => join(webRoot, name)));
  cpSync(webRoot, web, { recursive: true, filter: (source) => !skip.has(source) });
  // Linked one by one, so each build writes the Vite and Astro caches to its own node_modules.
  mkdirSync(join(web, 'node_modules'));
  for (const entry of readdirSync(join(webRoot, 'node_modules'))) {
    if (entry === '.vite' || entry === '.astro') continue;
    symlinkSync(join(webRoot, 'node_modules', entry), join(web, 'node_modules', entry), 'junction');
  }
  writeConfig(join(root, 'packages/config'));

  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST'))),
    FIRESTORE_TARGET: 'none',
  };
  const { status, stderr } = spawnSync('npm', ['run', 'build'], {
    cwd: web,
    env,
    encoding: 'utf8',
  });
  const dist = join(web, 'dist');
  const files = status === 0 ? readdirSync(dist, { recursive: true, encoding: 'utf8' }) : [];

  return {
    status,
    stderr,
    pages: files.filter((file) => file.endsWith('.html')).sort(),
    chunks: files
      .filter((file) => /^_astro[\\/][^\\/]+\.js$/.test(file))
      .map((file) => file.replace(/^_astro[\\/]/, '').replace(/\.[\w-]{8}\.js$/, '')),
    read: (file) => readFileSync(join(dist, file), 'utf8'),
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
};
