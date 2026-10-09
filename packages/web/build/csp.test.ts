import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import loadScript from 'astro/runtime/client/load.prebuilt.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  csp,
  type CspSite,
  cspPolicy,
  inlineScripts,
  scriptHash,
  serializeCsp,
  withCsp,
} from './csp';

const site = (overrides: Partial<CspSite> = {}): CspSite => ({
  firebase: { projectId: 'my-devfest' },
  features: { map: true },
  ...overrides,
});

describe('cspPolicy', () => {
  it('allows the site, Firebase, Google Analytics and YouTube', () => {
    const policy = cspPolicy(site(), { emulators: false });

    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['script-src']).toEqual([
      "'self'",
      'https://apis.google.com',
      'https://*.googletagmanager.com',
    ]);
    expect(policy['connect-src']).toContain('https://*.googleapis.com');
    expect(policy['frame-src']).toEqual([
      "'self'",
      'https://my-devfest.firebaseapp.com',
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
    ]);
    expect(policy['img-src']).toEqual(["'self'", 'https:', 'data:']);
  });

  it('never allows inline scripts or eval', () => {
    const policy = serializeCsp(
      cspPolicy(site({ integrations: { googleMapsApiKey: 'key' } }), { emulators: true }),
    );
    const scriptSrc = policy.split('; ').find((directive) => directive.startsWith('script-src'));

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('allows Google Maps only with a key and the map feature on', () => {
    const withKey = { integrations: { googleMapsApiKey: 'key' } };

    expect(cspPolicy(site(withKey), { emulators: false })['worker-src']).toEqual([
      "'self'",
      'blob:',
    ]);
    expect(cspPolicy(site(withKey), { emulators: false })['script-src']).toContain(
      "'wasm-unsafe-eval'",
    );
    expect(cspPolicy(site(), { emulators: false })['worker-src']).toEqual(["'self'"]);
    expect(
      cspPolicy(site({ ...withKey, features: { map: false } }), { emulators: false })['script-src'],
    ).not.toContain('https://*.gstatic.com');
  });

  it('allows the font stylesheets and the hosts of their fonts', () => {
    const policy = cspPolicy(
      site({
        theme: {
          fonts: {
            body: { stylesheet: 'https://fonts.googleapis.com/css2?family=Inter' },
            display: { stylesheet: 'https://fonts.example.com/brand.css' },
          },
        },
      }),
      { emulators: false },
    );

    expect(policy['style-src']).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://fonts.example.com',
    ]);
    expect(policy['font-src']).toEqual([
      "'self'",
      'https://fonts.gstatic.com',
      'https://fonts.example.com',
    ]);
  });

  it('allows the emulators only when asked', () => {
    expect(cspPolicy(site(), { emulators: true })['connect-src']).toContain(
      'http://127.0.0.1:8080',
    );
    expect(cspPolicy(site(), { emulators: false })['connect-src']).not.toContain(
      'http://127.0.0.1:8080',
    );
  });

  it("adds the site's own sources, starting from default-src for a new directive", () => {
    const policy = cspPolicy(
      site({
        security: {
          csp: {
            'script-src': ['https://widget.example.com'],
            'media-src': ['https://cdn.example.com'],
          },
        },
      }),
      { emulators: false },
    );

    expect(policy['script-src']).toContain('https://widget.example.com');
    expect(policy['media-src']).toEqual(["'self'", 'https://cdn.example.com']);
  });
});

describe('serializeCsp', () => {
  it('joins the directives and drops repeated sources', () => {
    expect(
      serializeCsp({ 'default-src': ["'self'"], 'img-src': ["'self'", 'https:', "'self'"] }),
    ).toBe("default-src 'self'; img-src 'self' https:");
  });
});

describe('scriptHash', () => {
  it('is the SHA-256 source expression of the script', () => {
    expect(scriptHash('')).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
  });
});

describe('inlineScripts', () => {
  it('finds the scripts that run their own content, and whether they are in the head', () => {
    const html = [
      '<html><head>',
      '<script>a()</script>',
      '<script type="module">b()</script>',
      '<script src="/c.js"></script>',
      '<script type="application/json">{}</script>',
      '<script type="application/ld+json">{}</script>',
      '<script data-src="x">d()</script>',
      '</head><body>',
      '<script>e()</script>',
      '</body></html>',
    ].join('');

    expect(inlineScripts(html)).toEqual([
      { content: 'a()', inHead: true },
      { content: 'b()', inHead: true },
      { content: 'd()', inHead: true },
      { content: 'e()', inHead: false },
    ]);
  });
});

describe('withCsp', () => {
  it('adds the policy right after the charset, before any script', () => {
    expect(withCsp('<head><base href="/"><meta charset="utf-8"><script>', 'a \'b\' "c" &')).toBe(
      `<head><base href="/"><meta charset="utf-8"><meta http-equiv="content-security-policy" content="a 'b' &quot;c&quot; &amp;"><script>`,
    );
  });

  it('fails on a page without a charset', () => {
    expect(() => withCsp('<head></head>', 'a')).toThrow('The page has no <meta charset="utf-8">');
  });
});

describe('csp integration', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  const buildDone = (pages: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-csp-'));
    dirs.push(dir);
    for (const [file, html] of Object.entries(pages)) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      writeFileSync(join(dir, file), html);
    }
    const hook = csp(site(), { emulators: false }).hooks['astro:build:done'];
    void hook?.({ dir: pathToFileURL(`${dir}/`), logger: { info: vi.fn() } } as never);
    return (file: string) => readFileSync(join(dir, file), 'utf8');
  };

  const page = (head: string, body = '') =>
    `<html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`;

  it('gives every page the same policy, with the hashes of all inline scripts', () => {
    const read = buildDone({
      'index.html': page('<script>one()</script>', `<script>${loadScript}</script>`),
      'speakers/ada.html': page('<script>two()</script>'),
    });
    const policy = (file: string) =>
      /<meta http-equiv="content-security-policy" content="([^"]+)">/.exec(read(file))?.[1];

    expect(policy('index.html')).toBe(policy('speakers/ada.html'));
    for (const script of ['one()', 'two()', loadScript]) {
      expect(policy('index.html')).toContain(scriptHash(script));
    }
  });

  it('fails on an inline script in the body, which content could have added', () => {
    expect(() => buildDone({ 'blog.html': page('', '<script>alert(1)</script>') })).toThrow(
      'blog.html has an inline script in the body',
    );
  });
});
