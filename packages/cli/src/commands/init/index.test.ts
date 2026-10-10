import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInit } from './index.js';
import type { SiteDetails } from './site-details.js';

const mocks = vi.hoisted(() => ({
  runCommand: vi.fn(() => 0),
  ask: vi.fn(async (_question: string, defaultValue = '') => defaultValue),
  confirm: vi.fn(async () => false),
  isBillingEnabled: vi.fn(async () => true),
  runDeploy: vi.fn(async () => true),
  validateSiteConfig: vi.fn(async (): Promise<string[]> => []),
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
  delete process.env['GCLOUD_PROJECT'];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  rmSync(repo, { recursive: true, force: true });
});

describe('runInit', () => {
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

  it('adds the sample content, then deploys once, when asked', async () => {
    mocks.confirm.mockResolvedValue(true);
    const order: string[] = [];
    mocks.runCommand.mockImplementation(() => (order.push('seed'), 0));
    mocks.runDeploy.mockImplementation(async () => (order.push('deploy'), true));

    const result = await runInit({ project: 'new-fest', details: detailsFile() });

    expect(result).toBe(true);
    expect(mocks.runCommand).toHaveBeenCalledWith(
      'npm',
      ['--prefix', 'packages/cli', 'run', 'firestore-init:production'],
      repo,
    );
    expect(mocks.runDeploy).toHaveBeenCalledWith({ yes: true });
    expect(order).toEqual(['seed', 'deploy']);
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
      'npm',
      ['--prefix', 'packages/cli', 'run', 'firestore-init:production'],
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
});
