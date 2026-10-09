import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import idleScript from 'astro/runtime/client/idle.prebuilt.js';
import loadScript from 'astro/runtime/client/load.prebuilt.js';
import mediaScript from 'astro/runtime/client/media.prebuilt.js';
import onlyScript from 'astro/runtime/client/only.prebuilt.js';
import visibleScript from 'astro/runtime/client/visible.prebuilt.js';
import islandScript from 'astro/runtime/server/astro-island.prebuilt.js';

/** The directives that `security.csp` in site.json can add sources to. */
export const CSP_DIRECTIVES = [
  'script-src',
  'style-src',
  'connect-src',
  'img-src',
  'font-src',
  'frame-src',
  'media-src',
  'worker-src',
] as const;
export type CspDirective = (typeof CSP_DIRECTIVES)[number];
export type CspPolicy = Record<string, string[]>;

/** The parts of site.json the policy depends on. */
export interface CspSite {
  firebase: { projectId: string };
  features: { map?: boolean };
  integrations?: { googleMapsApiKey?: string };
  theme?: { fonts?: Record<string, { stylesheet?: string } | undefined> };
  security?: { csp?: Partial<Record<CspDirective, string[]>> };
}

const GOOGLE_FONTS = 'https://fonts.googleapis.com';

// https://developers.google.com/maps/documentation/javascript/content-security-policy, with
// 'wasm-unsafe-eval' for the WebAssembly it compiles instead of the 'unsafe-eval' the guide lists.
const MAPS: CspPolicy = {
  'script-src': [
    'https://*.googleapis.com',
    'https://*.gstatic.com',
    'https://*.google.com',
    'https://*.ggpht.com',
    'https://*.googleusercontent.com',
    "'wasm-unsafe-eval'",
    'blob:',
  ],
  'style-src': [GOOGLE_FONTS],
  'connect-src': ['https://*.google.com', 'https://*.gstatic.com', 'data:', 'blob:'],
  'font-src': ['https://fonts.gstatic.com'],
  'frame-src': ['https://*.google.com'],
  'worker-src': ['blob:'],
};

// Builds for the Hosting emulator connect to the Firestore and Auth emulators (see src/firebase.ts).
const EMULATORS: CspPolicy = {
  'connect-src': ['http://127.0.0.1:8080', 'http://127.0.0.1:9099'],
  'frame-src': ['http://127.0.0.1:9099'],
};

const addSources = (policy: CspPolicy, sources: Partial<CspPolicy>) => {
  for (const [directive, values] of Object.entries(sources)) {
    policy[directive] = [...(policy[directive] ?? policy['default-src'] ?? []), ...(values ?? [])];
  }
};

/** The policy for every page, before the hashes of the inline scripts. */
export const cspPolicy = (site: CspSite, { emulators }: { emulators: boolean }): CspPolicy => {
  const fontOrigins = Object.values(site.theme?.fonts ?? {}).flatMap((font) =>
    font?.stylesheet ? [new URL(font.stylesheet).origin] : [],
  );
  const policy: CspPolicy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Firebase Auth loads Google's API loader for popups, and on Safari and mobile when it starts.
      'https://apis.google.com',
      // Firebase Analytics loads the Google tag.
      'https://*.googletagmanager.com',
    ],
    // Lit renders a <style> in every shadow root, and `styleMap` sets style attributes.
    'style-src': ["'self'", "'unsafe-inline'", ...fontOrigins],
    'connect-src': [
      "'self'",
      'https://*.googleapis.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
    ],
    // Content images can be on any host.
    'img-src': ["'self'", 'https:', 'data:'],
    'font-src': [
      "'self'",
      ...fontOrigins.map((origin) =>
        origin === GOOGLE_FONTS ? 'https://fonts.gstatic.com' : origin,
      ),
    ],
    'frame-src': [
      "'self'",
      // Firebase Auth's iframe, on the project's default auth domain.
      `https://${site.firebase.projectId}.firebaseapp.com`,
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
    ],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
  };
  if (site.features.map && site.integrations?.googleMapsApiKey) addSources(policy, MAPS);
  if (emulators) addSources(policy, EMULATORS);
  addSources(policy, site.security?.csp ?? {});
  return policy;
};

export const serializeCsp = (policy: CspPolicy): string =>
  Object.entries(policy)
    .map(([directive, sources]) => [directive, ...new Set(sources)].join(' '))
    .join('; ');

export const scriptHash = (script: string): string =>
  `'sha256-${createHash('sha256').update(script).digest('base64')}'`;

const RUNNABLE_TYPES = ['', 'module', 'text/javascript', 'application/javascript'];

/** The scripts in a page that run their own content, so the policy needs their hashes. */
export const inlineScripts = (html: string): { content: string; inHead: boolean }[] => {
  const headEnd = html.indexOf('</head>');
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    const attributes = match[1] ?? '';
    const type = /(?:^|\s)type="([^"]*)"/i.exec(attributes)?.[1]?.toLowerCase() ?? '';
    if (/(?:^|\s)src=/i.test(attributes) || !RUNNABLE_TYPES.includes(type)) return [];
    return [{ content: match[2] ?? '', inHead: match.index < headEnd }];
  });
};

// Astro renders these in the body, before the first island that needs them.
const ASTRO_SCRIPTS = new Set<string>([
  islandScript,
  idleScript,
  loadScript,
  mediaScript,
  onlyScript,
  visibleScript,
]);

const CHARSET = '<meta charset="utf-8">';

/** Adds the policy right after the charset, before any script it applies to. */
export const withCsp = (html: string, policy: string): string => {
  if (!html.includes(CHARSET)) throw new Error(`The page has no ${CHARSET}`);
  const content = policy.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return html.replace(
    CHARSET,
    `${CHARSET}<meta http-equiv="content-security-policy" content="${content}">`,
  );
};

/**
 * Adds one Content-Security-Policy to every built page. Astro's own `security.csp` doesn't support
 * the client router, which keeps the first page's policy while it swaps in the next page. So every
 * page gets the same policy, with the hashes of the inline scripts of all pages.
 *
 * Inline scripts must be in the head, where content never renders, or be Astro's island scripts.
 * Any other inline script fails the build rather than getting a hash.
 */
export const csp = (site: CspSite, options: { emulators: boolean }): AstroIntegration => ({
  name: 'hoverboard-csp',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      const root = fileURLToPath(dir);
      const pages = readdirSync(root, { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.html'))
        .map((file) => ({ file: join(root, file), html: readFileSync(join(root, file), 'utf8') }));
      const hashes = new Set<string>();
      for (const { file, html } of pages) {
        for (const script of inlineScripts(html)) {
          if (!script.inHead && !ASTRO_SCRIPTS.has(script.content)) {
            throw new Error(
              `${relative(root, file)} has an inline script in the body, which the CSP blocks. Move it to the head with <Fragment slot="head">.`,
            );
          }
          hashes.add(scriptHash(script.content));
        }
      }
      const policy = cspPolicy(site, options);
      policy['script-src'] = [...(policy['script-src'] ?? []), ...[...hashes].sort()];
      const content = serializeCsp(policy);
      for (const { file, html } of pages) writeFileSync(file, withCsp(html, content));
      logger.info(`Added the CSP to ${pages.length} pages, with ${hashes.size} script hashes.`);
    },
  },
});
