import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup as startServers, teardown as stopServers } from 'jest-dev-server';
import { chromium } from 'playwright';
import type { TestProject } from 'vitest/node';
import { STAGE_FIXTURES } from '../fixtures/stages';
import { buildSite, type SiteBuild } from '../helpers/build-site';

export interface A11ySite {
  url: string;
  /** One path per page template. */
  paths: string[];
  /** The time the dev bar's clock picks, for a site in a stage. */
  time?: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    a11ySites: Record<string, A11ySite>;
  }
}

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const demoConfig = join(repoRoot, 'packages/demo-config');
const minimalSite = join(repoRoot, 'packages/web/__tests__/fixtures/minimal-site');

// Ports apart from `npm start`'s, so both can run.
const SITES: Record<
  string,
  {
    port: number;
    firestoreTarget: 'none' | 'sample';
    time?: string;
    writeConfig: (dir: string) => void;
  }
> = {
  demo: {
    port: 5055,
    firestoreTarget: 'sample',
    writeConfig: (dir: string) => cpSync(demoConfig, dir, { recursive: true }),
  },
  minimal: {
    port: 5056,
    firestoreTarget: 'none',
    writeConfig: (dir: string) => {
      cpSync(minimalSite, dir, { recursive: true });
      cpSync(join(demoConfig, 'public'), join(dir, 'public'), { recursive: true });
    },
  },
  // A first edition, announced with no content yet: every feature on, and every page empty.
  first: {
    port: 5057,
    firestoreTarget: 'none',
    time: STAGE_FIXTURES['first-announced'].time,
    writeConfig: (dir: string) => cpSync(demoConfig, dir, { recursive: true }),
  },
};

/** The first page of each template: the list pages, one of each detail page, and a missing page. */
const templatePaths = ({ pages }: SiteBuild) => {
  const first = (folder: string) =>
    pages.find((page) => page.startsWith(`${folder}/`) && page !== 'schedule/my-schedule.html');
  return [
    'index.html',
    'schedule.html',
    first('schedule'),
    'schedule/my-schedule.html',
    first('sessions'),
    'speakers.html',
    first('speakers'),
    'previous-speakers.html',
    first('previous-speakers'),
    'blog.html',
    first('blog'),
    'team.html',
    'attending.html',
    'faq.html',
    'coc.html',
    'offline.html',
  ]
    .filter((page) => page && pages.includes(page))
    .map((page) => `/${page!.replace(/(index)?\.html$/, '')}`)
    .concat('/not-a-page');
};

let builds: SiteBuild[] = [];
let servers: Awaited<ReturnType<typeof startServers>> = [];

export async function setup(project: TestProject) {
  if (!existsSync(chromium.executablePath())) {
    throw new Error(
      'The A11y tests need Chromium. Install it with `npx playwright install chromium`.',
    );
  }
  const firebase = join(repoRoot, 'node_modules/.bin/firebase');
  const hosting = (
    JSON.parse(readFileSync(join(repoRoot, 'firebase.json'), 'utf8')) as {
      hosting: object;
    }
  ).hosting;
  const sites: Record<string, A11ySite> = {};
  for (const [name, { port, firestoreTarget, time, writeConfig }] of Object.entries(SITES)) {
    const build = buildSite(writeConfig, { firestoreTarget });
    builds.push(build);
    if (build.status !== 0) throw new Error(`The ${name} site didn't build:\n${build.stderr}`);
    // Next to the build's packages/web, with the headers and clean URLs of the real Hosting.
    const config = join(build.dist, '../../../firebase.json');
    writeFileSync(
      config,
      JSON.stringify({
        hosting: { ...hosting, public: 'packages/web/dist' },
        emulators: {
          hosting: { port, host: '127.0.0.1' },
          hub: { port: port - 600 },
          logging: { port: port - 500 },
          ui: { enabled: false },
        },
      }),
    );
    servers.push(
      ...(await startServers({
        // A `demo-` project, so the app expects emulators and reads nothing from production.
        command: `${firebase} emulators:start --only hosting --project demo-hoverboard-a11y --config ${config}`,
        port,
        host: '127.0.0.1',
        launchTimeout: 60000,
        usedPortAction: 'error',
      })),
    );
    sites[name] = {
      url: `http://127.0.0.1:${port}`,
      paths: templatePaths(build),
      ...(time ? { time } : {}),
    };
  }
  project.provide('a11ySites', sites);
}

export async function teardown() {
  await stopServers(servers);
  for (const build of builds) build.remove();
  servers = [];
  builds = [];
}
