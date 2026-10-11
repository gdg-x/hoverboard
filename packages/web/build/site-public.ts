import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** The file in `dir` that a request path names, or undefined outside it or when missing. */
export const publicRequestFile = (dir: string, url: string): string | undefined => {
  const root = resolve(dir);
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return undefined;
  }
  const file = resolve(root, `.${pathname}`);
  return file.startsWith(`${root}${sep}`) && fs.statSync(file, { throwIfNoEntry: false })?.isFile()
    ? file
    : undefined;
};

/**
 * Lays the site's `public` folder over packages/web/public: the dev server serves its files
 * first, and the build copies them over the output. Add it before the integrations that read the
 * output, such as the service worker's.
 */
export const sitePublic = (dir: string): AstroIntegration => ({
  name: 'hoverboard-site-public',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      updateConfig({
        vite: {
          plugins: [
            {
              name: 'hoverboard-site-public',
              // Added here, the middleware runs before Vite serves packages/web/public.
              configureServer: (server) => {
                server.middlewares.use((request, response, next) => {
                  const file = publicRequestFile(dir, request.url ?? '/');
                  if (!file) return next();
                  response.setHeader(
                    'Content-Type',
                    TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
                  );
                  fs.createReadStream(file).pipe(response);
                });
              },
            },
          ],
        },
      });
    },
    'astro:build:done': ({ dir: output }) => {
      if (fs.existsSync(dir)) fs.cpSync(dir, fileURLToPath(output), { recursive: true });
    },
  },
});
