import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInit } from './index.js';
import type { SiteDetails } from './site-details.js';

const mocks = vi.hoisted(() => ({
  runCommand: vi.fn((_command: string, _args: string[], _cwd: string) => 0),
  ask: vi.fn(async (_question: string, defaultValue = '') => defaultValue),
  confirm: vi.fn(async () => false),
  isBillingEnabled: vi.fn(async () => true),
  runDeploy: vi.fn(async () => true),
  validateSiteConfig: vi.fn(async (): Promise<string[]> => []),
  databaseLocation: vi.fn(async (): Promise<string | undefined> => 'nam5'),
  createDatabase: vi.fn(async () => undefined),
  runDoctor: vi.fn(async () => true),
  setUpRepository: vi.fn(async () => ({ ok: true, pushed: false })),
  projects: {
    signedIn: vi.fn(() => true),
    list: vi.fn(() => [{ projectId: 'old-fest', displayName: 'Old Fest' }]),
    create: vi.fn(),
    webApps: vi.fn((): string[] => ['Hoverboard']),
    createWebApp: vi.fn(),
  },
}));

vi.mock('../../lib/spawn.js', () => ({ runCommand: mocks.runCommand }));
vi.mock('../../lib/firebase-cli.js', () => ({ resolveFirebaseBin: () => '/bin/firebase' }));
vi.mock('../../lib/prompt.js', () => ({ ask: mocks.ask, confirm: mocks.confirm }));
vi.mock('../../lib/billing.js', () => ({ isBillingEnabled: mocks.isBillingEnabled }));
vi.mock('../deploy.js', () => ({ runDeploy: mocks.runDeploy }));
vi.mock('../../utils/site-config.js', () => ({ validateSiteConfig: mocks.validateSiteConfig }));
vi.mock('./firebase-projects.js', () => ({ firebaseProjects: () => mocks.projects }));
vi.mock('../../lib/firebase-backups.js', () => ({
  databaseLocation: mocks.databaseLocation,
  createDatabase: mocks.createDatabase,
}));
vi.mock('../doctor.js', () => ({ runDoctor: mocks.runDoctor }));
vi.mock('./repository.js', () => ({ setUpRepository: mocks.setUpRepository }));

const site = {
  firebase: { projectId: 'old-fest' },
  shortName: 'Old',
  organizer: { name: 'Old organizer', email: 'old@example.com' },
  event: {
    startDate: '2017-10-13',
    endDate: '2017-10-14',
    timezone: 'Europe/Kyiv',
    location: {
      name: 'Old venue',
      city: 'Lviv',
      short: 'Lviv, Ukraine',
      address: '1 Old Street',
      pointer: { latitude: 49.8, longitude: 23.9, zoom: 5 },
      mapCenter: { latitude: 48, longitude: 8 },
    },
  },
  social: { hashtag: 'Old', follow: [] },
  integrations: { googleMapsApiKey: 'old-key' },
  features: { forkMe: true },
};

const details: SiteDetails = {
  title: 'New Fest',
  description: 'A new conference',
  shortName: 'New Fest',
  startDate: '2027-10-15',
  endDate: '2027-10-16',
  timezone: 'UTC',
  attendance: 'inPerson',
  venue: 'Hall',
  address: '1 Main Street',
  city: 'Springfield',
  shortLocation: 'Springfield',
  organizerName: 'GDG Springfield',
  organizerEmail: 'hi@example.com',
  featuresOff: ['forkMe', 'map'],
};

let repo: string;
const write = (path: string, content: string) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), content);
};
const read = (path: string) => JSON.parse(readFileSync(join(repo, path), 'utf8'));
const detailsFile = () => {
  write('details.json', JSON.stringify(details));
  return join(repo, 'details.json');
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-init-'));
  mkdirSync(join(repo, '.git'));
  write('package.json', JSON.stringify({ engines: { node: process.versions.node.split('.')[0] } }));
  write('packages/config/site.json', JSON.stringify(site));
  write(
    'packages/config/content/resources.json',
    JSON.stringify({ title: 'Old Fest', description: 'Old', heroDescriptions: { home: 'Old' } }),
  );
  write(
    'packages/web/defaults/site.json',
    JSON.stringify({ features: { forkMe: false, map: true, schedule: true, speakers: true } }),
  );
  write(
    'packages/web/schemas/site.schema.json',
    JSON.stringify({
      properties: { theme: { properties: { name: { enum: ['festival', 'spotlight'] } } } },
    }),
  );
  write(
    'packages/web/src/config/features.ts',
    "export const FEATURE_REQUIRES = { schedule: ['speakers'] };\n",
  );
  vi.spyOn(process, 'cwd').mockReturnValue(repo);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  mocks.ask.mockImplementation(async (_question: string, defaultValue = '') => defaultValue);
  mocks.confirm.mockResolvedValue(false);
  mocks.runCommand.mockImplementation(() => 0);
  delete process.env['GCLOUD_PROJECT'];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  rmSync(repo, { recursive: true, force: true });
});

describe('runInit', () => {
  it('starts from a copy of the demo config when the site has none', async () => {
    for (const file of ['site.json', 'content/resources.json']) {
      write(
        `packages/demo-config/${file}`,
        readFileSync(join(repo, 'packages/config', file), 'utf8'),
      );
    }
    write('packages/demo-config/package.json', '{ "name": "@hoverboard/demo-config" }');
    write('packages/demo-config/public/images/logo.svg', '<svg></svg>');
    rmSync(join(repo, 'packages/config'), { recursive: true });

    expect(await runInit({ project: 'new-fest', details: detailsFile(), deploy: false })).toBe(
      true,
    );

    expect(read('packages/config/site.json')).toMatchObject({ shortName: 'New Fest' });
    expect(readFileSync(join(repo, 'packages/config/public/images/logo.svg'), 'utf8')).toBe(
      '<svg></svg>',
    );
    expect(existsSync(join(repo, 'packages/config/package.json'))).toBe(false);
    expect(read('packages/demo-config/site.json')).toEqual(site);
  });

  it('writes the site details for the chosen project', async () => {
    const result = await runInit({ project: 'new-fest', details: detailsFile(), deploy: false });

    expect(result).toBe(true);
    expect(mocks.runCommand).not.toHaveBeenCalledWith('/bin/firebase', ['login'], repo);
    expect(read('packages/config/site.json')).toMatchObject({
      firebase: { projectId: 'new-fest' },
      shortName: 'New Fest',
      event: { startDate: '2027-10-15', location: { name: 'Hall' } },
      features: { forkMe: false, map: false, schedule: true, speakers: true },
    });
    expect(read('packages/config/site.json')).not.toHaveProperty('integrations');
    expect(read('packages/config/content/resources.json')).toMatchObject({ title: 'New Fest' });
    expect(read('.firebaserc')).toEqual({ projects: { default: 'new-fest' } });
    expect(mocks.projects.create).not.toHaveBeenCalled();
    expect(mocks.runDeploy).not.toHaveBeenCalled();
  });

  it('signs in to Firebase when no account is signed in', async () => {
    mocks.projects.signedIn.mockReturnValueOnce(false);

    await runInit({ project: 'new-fest', details: detailsFile(), deploy: false });

    expect(mocks.runCommand).toHaveBeenCalledWith('/bin/firebase', ['login'], repo);
  });

  it('creates the project and its web app', async () => {
    mocks.projects.webApps.mockReturnValueOnce([]);

    await runInit({ project: 'new-fest', create: true, details: detailsFile(), deploy: false });

    expect(mocks.projects.create).toHaveBeenCalledWith('new-fest', 'new-fest');
    expect(mocks.projects.createWebApp).toHaveBeenCalledWith('new-fest', 'Hoverboard');
  });

  it('stops when the project cannot be created', async () => {
    mocks.projects.create.mockImplementationOnce(() => {
      throw new Error('Project ID is taken.');
    });

    const result = await runInit({ project: 'taken', create: true, details: detailsFile() });

    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith('✘ Project ID is taken.');
    expect(read('packages/config/site.json')).toEqual(site);
  });

  it('asks for the project and details, with the current config as the defaults', async () => {
    mocks.ask.mockImplementation(async (question: string, defaultValue = '') =>
      question.startsWith('Project number') ? '1' : defaultValue,
    );

    await runInit({ deploy: false });

    expect(mocks.ask).toHaveBeenCalledWith('Project number or ID:', '1');
    expect(mocks.ask).toHaveBeenCalledWith('Event name:', 'Old Fest');
    expect(mocks.ask).toHaveBeenCalledWith('Theme (festival or spotlight):', 'festival');
    expect(mocks.ask).toHaveBeenCalledWith(
      expect.stringContaining('Google Maps API key'),
      'old-key',
    );
    expect(read('packages/config/site.json')).toMatchObject({
      firebase: { projectId: 'old-fest' },
      integrations: { googleMapsApiKey: 'old-key' },
      theme: { name: 'festival' },
      features: { forkMe: true, map: true },
    });
  });

  it('adds the sample content, schedules backups, then deploys once, when asked', async () => {
    mocks.confirm.mockResolvedValue(true);
    const order: string[] = [];
    mocks.runCommand.mockImplementation((_command: string, args: string[]) => {
      order.push(args[1]!);
      return 0;
    });
    mocks.runDeploy.mockImplementation(async () => (order.push('deploy'), true));

    const result = await runInit({ project: 'new-fest', details: detailsFile() });

    expect(result).toBe(true);
    expect(mocks.ask).toHaveBeenCalledWith(expect.stringContaining('Starting content'), 'sample');
    expect(mocks.runCommand).toHaveBeenCalledWith(
      process.execPath,
      ['hb', 'data', 'seed', '--production', '--yes'],
      repo,
    );
    expect(mocks.runCommand).toHaveBeenCalledWith(
      process.execPath,
      ['hb', 'backup', 'schedule', '--daily', '--yes'],
      repo,
    );
    expect(mocks.runDeploy).toHaveBeenCalledWith({ yes: true });
    expect(order).toEqual(['data', 'backup', 'deploy']);
    expect(mocks.runDoctor).toHaveBeenCalled();
  });

  it('adds the sample content without a deploy or the Blaze plan', async () => {
    mocks.isBillingEnabled.mockResolvedValueOnce(false);

    const result = await runInit({
      project: 'new-fest',
      details: detailsFile(),
      seed: true,
      deploy: true,
    });

    expect(result).toBe(true);
    expect(mocks.runCommand).toHaveBeenCalledWith(
      process.execPath,
      ['hb', 'data', 'seed', '--production', '--yes'],
      repo,
    );
    expect(mocks.runDeploy).not.toHaveBeenCalled();
  });

  it('does not deploy without the Blaze plan, and links to the upgrade', async () => {
    mocks.isBillingEnabled.mockResolvedValueOnce(false);

    const result = await runInit({ project: 'new-fest', details: detailsFile(), deploy: true });

    expect(result).toBe(true);
    expect(mocks.runDeploy).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('https://console.firebase.google.com/project/new-fest/usage/details'),
    );
  });

  it('deploys without the Blaze plan when the site has no functions', async () => {
    write(
      'packages/web/defaults/site.json',
      JSON.stringify({ features: { functions: true, schedule: true, speakers: true } }),
    );
    write('details.json', JSON.stringify({ ...details, featuresOff: ['functions'] }));

    const result = await runInit({
      project: 'new-fest',
      details: join(repo, 'details.json'),
      deploy: true,
      seed: false,
      backups: false,
    });

    expect(result).toBe(true);
    expect(read('packages/config/site.json')).toMatchObject({ features: { functions: false } });
    expect(mocks.isBillingEnabled).not.toHaveBeenCalled();
    expect(mocks.runDeploy).toHaveBeenCalledWith({ yes: true });
  });

  it('stops before deploying when the config is not valid', async () => {
    mocks.validateSiteConfig.mockResolvedValueOnce(['site.json/event: bad']);

    const result = await runInit({ project: 'new-fest', details: detailsFile(), deploy: true });

    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith('✘ site.json/event: bad');
    expect(mocks.runDeploy).not.toHaveBeenCalled();
  });

  it('creates the Firestore database in the location given, before the content', async () => {
    mocks.databaseLocation.mockResolvedValueOnce(undefined);
    const order: string[] = [];
    mocks.createDatabase.mockImplementationOnce(async () => void order.push('database'));
    mocks.runCommand.mockImplementation(() => (order.push('seed'), 0));

    const result = await runInit({
      project: 'new-fest',
      details: detailsFile(),
      location: 'eur3',
      seed: true,
      deploy: false,
      backups: false,
    });

    expect(result).toBe(true);
    expect(mocks.createDatabase).toHaveBeenCalledWith(repo, 'new-fest', 'eur3');
    expect(order).toEqual(['database', 'seed']);
  });

  it('asks where to create the Firestore database, and keeps an existing one', async () => {
    mocks.databaseLocation.mockResolvedValueOnce(undefined);
    mocks.ask.mockImplementation(async (question: string, defaultValue = '') =>
      question.includes('Firestore data') ? 'europe-west1' : defaultValue,
    );

    await runInit({ project: 'new-fest', details: detailsFile(), seed: false, deploy: false });
    expect(mocks.createDatabase).toHaveBeenCalledWith(repo, 'new-fest', 'europe-west1');

    mocks.createDatabase.mockClear();
    await runInit({ project: 'new-fest', details: detailsFile(), seed: false, deploy: false });
    expect(mocks.createDatabase).not.toHaveBeenCalled();
  });

  it('stops when the database cannot be created', async () => {
    mocks.databaseLocation.mockResolvedValueOnce(undefined);
    mocks.createDatabase.mockRejectedValueOnce(new Error('firebase failed: no permission'));

    const result = await runInit({
      project: 'new-fest',
      details: detailsFile(),
      location: 'nam5',
      seed: true,
    });

    expect(result).toBe(false);
    expect(console.log).toHaveBeenCalledWith('✘ firebase failed: no permission');
    expect(mocks.runCommand).not.toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(['seed']),
      repo,
    );
  });

  it('starts with the content of an export', async () => {
    const result = await runInit({
      project: 'new-fest',
      details: detailsFile(),
      from: 'last-year',
      deploy: false,
      backups: false,
    });

    expect(result).toBe(true);
    expect(mocks.runCommand).toHaveBeenCalledWith(
      process.execPath,
      ['hb', 'data', 'import', join(repo, 'last-year'), '--production', '--yes'],
      repo,
    );
  });

  it('starts with empty collections when asked', async () => {
    mocks.ask.mockImplementation(async (question: string, defaultValue = '') =>
      question.startsWith('\nStarting content') ? 'empty' : defaultValue,
    );

    await runInit({ project: 'new-fest', details: detailsFile(), deploy: false, backups: false });

    expect(mocks.runCommand).not.toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(['data']),
      repo,
    );
  });

  it('does not offer backups without the Blaze plan', async () => {
    write(
      'packages/web/defaults/site.json',
      JSON.stringify({ features: { functions: true, schedule: true, speakers: true } }),
    );
    write('details.json', JSON.stringify({ ...details, featuresOff: ['functions'] }));
    mocks.isBillingEnabled.mockResolvedValueOnce(false);

    await runInit({
      project: 'new-fest',
      details: join(repo, 'details.json'),
      seed: false,
      deploy: false,
    });

    expect(mocks.isBillingEnabled).toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.runCommand).not.toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(['backup']),
      repo,
    );
  });

  it('replaces the demo text with starter text, and takes text from the details', async () => {
    for (const file of ['site.json', 'content/resources.json']) {
      write(
        `packages/demo-config/${file}`,
        readFileSync(join(repo, 'packages/config', file), 'utf8'),
      );
    }
    rmSync(join(repo, 'packages/config'), { recursive: true });
    write(
      'details.json',
      JSON.stringify({
        ...details,
        resources: { heroDescriptions: { speakers: 'Our speakers.' }, footerRelBlock: [] },
      }),
    );

    await runInit({ project: 'new-fest', details: join(repo, 'details.json'), deploy: false });

    const resources = read('packages/config/content/resources.json');
    expect(resources).toMatchObject({
      title: 'New Fest',
      heroDescriptions: { home: 'A new conference', speakers: 'Our speakers.' },
      team: { description: 'The people who make New Fest happen.' },
      codeOfConductBlock: { contacts: ['GDG Springfield, hi@example.com'] },
      footerRelBlock: [],
    });
  });

  it('keeps the text of a site that is already set up', async () => {
    await runInit({ project: 'new-fest', details: detailsFile(), deploy: false });

    expect(read('packages/config/content/resources.json')).not.toHaveProperty('team');
  });

  it('copies the logo, icon and share image', async () => {
    write('logo.svg', '<svg>new</svg>');
    write('icon.png', 'png');
    write('share.jpeg', 'jpeg');
    write('packages/config/public/images/logo-dark.svg', '<svg>demo</svg>');

    await runInit({
      project: 'new-fest',
      details: detailsFile(),
      logo: 'logo.svg',
      icon: 'icon.png',
      shareImage: 'share.jpeg',
      deploy: false,
    });

    const images = join(repo, 'packages/config/public/images');
    expect(readFileSync(join(images, 'logo.svg'), 'utf8')).toBe('<svg>new</svg>');
    expect(existsSync(join(images, 'logo-dark.svg'))).toBe(false);
    expect(readFileSync(join(images, 'social-share.jpg'), 'utf8')).toBe('jpeg');
    expect(read('packages/config/site.json')).toMatchObject({
      icon: 'images/icon.png',
      image: 'images/social-share.jpg',
    });
  });

  it('asks for the images when it asks for the details', async () => {
    write('logo.svg', '<svg>new</svg>');
    mocks.ask.mockImplementation(async (question: string, defaultValue = '') => {
      if (question.startsWith('Project number')) return '1';
      return question.startsWith('Logo') ? 'logo.svg' : defaultValue;
    });

    await runInit({ deploy: false });

    expect(readFileSync(join(repo, 'packages/config/public/images/logo.svg'), 'utf8')).toBe(
      '<svg>new</svg>',
    );
  });

  it('refuses a logo that is not an SVG', async () => {
    write('logo.png', 'png');

    await expect(
      runInit({ project: 'new-fest', details: detailsFile(), logo: 'logo.png', deploy: false }),
    ).rejects.toThrow('--logo needs a .svg file');
  });

  it('sets up the repository, and fails when it could not', async () => {
    mocks.setUpRepository.mockResolvedValueOnce({ ok: false, pushed: false });

    const result = await runInit({
      project: 'new-fest',
      details: detailsFile(),
      deploy: false,
      repo: 'org/fest',
    });

    expect(result).toBe(false);
    expect(mocks.setUpRepository).toHaveBeenCalledWith(repo, {
      repo: 'org/fest',
      shortName: 'New Fest',
    });
  });
});
