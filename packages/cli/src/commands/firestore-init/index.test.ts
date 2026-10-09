import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { importConfig } from './config.js';
import { runFirestoreInit, siteFeatures } from './index.js';

const { calls, mockImport } = vi.hoisted(() => {
  const calls: string[] = [];
  const mockImport = (label: string) => vi.fn(() => calls.push(label));
  return { calls, mockImport };
});

vi.mock('./blog.js', () => ({ importBlog: mockImport('blog') }));
vi.mock('./config.js', () => ({ importConfig: mockImport('config') }));
vi.mock('./gallery.js', () => ({ importGallery: mockImport('gallery') }));
vi.mock('./partners.js', () => ({ importPartners: mockImport('partners') }));
vi.mock('./previous-speakers.js', () => ({
  importPreviousSpeakers: mockImport('previousSpeakers'),
}));
vi.mock('./sessions.js', () => ({ importSessions: mockImport('sessions') }));
vi.mock('./speakers.js', () => ({ importSpeakers: mockImport('speakers') }));
vi.mock('./team.js', () => ({ importTeam: mockImport('team') }));
vi.mock('./tickets.js', () => ({ importTickets: mockImport('tickets') }));
vi.mock('./videos.js', () => ({ importVideos: mockImport('videos') }));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  calls.length = 0;
});

describe('runFirestoreInit', () => {
  it('imports config first, then every other collection', async () => {
    await runFirestoreInit({});

    expect(calls[0]).toBe('config');
    expect(calls.slice(1).sort()).toEqual(
      [
        'blog',
        'gallery',
        'partners',
        'previousSpeakers',
        'sessions',
        'speakers',
        'team',
        'tickets',
        'videos',
      ].sort(),
    );
  });

  it('skips the collections of features that are off', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const features = { blog: false, schedule: false, speakers: true, team: false };

    await runFirestoreInit(features);

    expect(importConfig).toHaveBeenCalledWith(features);
    expect(calls.sort()).toEqual(
      [
        'config',
        'gallery',
        'partners',
        'previousSpeakers',
        'sessions',
        'speakers',
        'tickets',
        'videos',
      ].sort(),
    );
    expect(log).toHaveBeenCalledWith(
      'Skipped the data of features that are off in packages/config/site.json: blog, team.',
    );
  });

  it('skips sessions only when the schedule and the speakers are off', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runFirestoreInit({ schedule: false, speakers: false });

    expect(calls).not.toContain('sessions');
    expect(calls).not.toContain('speakers');
  });
});

describe('siteFeatures', () => {
  const dirsToClean: string[] = [];

  afterEach(() => {
    for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  const writeSite = (dir: string, path: string, site: object) => {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), JSON.stringify(site));
  };

  it('reads the site features over the defaults', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(dir);
    writeSite(dir, 'packages/web/defaults/site.json', { features: { blog: true, team: true } });
    writeSite(dir, 'packages/config/site.json', { features: { blog: false } });

    expect(siteFeatures(dir)).toEqual({ blog: false, team: true });
  });

  it('uses the defaults when the site has no features', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(dir);
    writeSite(dir, 'packages/web/defaults/site.json', { features: { blog: true } });
    writeSite(dir, 'packages/config/site.json', {});

    expect(siteFeatures(dir)).toEqual({ blog: true });
  });

  it('reads the repository config', () => {
    expect(siteFeatures()).toMatchObject({ blog: true, schedule: true, speakers: true });
  });
});
