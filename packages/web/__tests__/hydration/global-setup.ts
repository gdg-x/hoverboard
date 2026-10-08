import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { TestProject } from 'vitest/node';
import { decorators } from '../../build/decorators';
import { configPaths, resolveConfig } from '../../build/resolve-config';
import { siteModule } from '../../build/vite-plugin-site';
import type { renderPages } from './render-pages';

declare module 'vitest' {
  export interface ProvidedContext {
    hydrationPages: Record<string, string>;
  }
}

const webRoot = fileURLToPath(new URL('../..', import.meta.url));

// The pages render in Node, where `isServer` is true, as in the build. The tests run in jsdom.
export default async function setup(project: TestProject): Promise<void> {
  const siteConfig = resolveConfig({ paths: configPaths(webRoot), nodeEnv: 'test' });
  const server = await createServer({
    root: webRoot,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    // Without a watcher, files that other global setups write cannot reload modules mid-render.
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    plugins: [decorators(), siteModule(siteConfig)],
  });
  try {
    const module = (await server.ssrLoadModule('/__tests__/hydration/render-pages.ts')) as {
      renderPages: typeof renderPages;
    };
    project.provide('hydrationPages', await module.renderPages());
  } finally {
    await server.close();
  }
}
