import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmChange } from '../../lib/prompt.js';
import { setTarget } from '../../lib/target.js';
import { importConfig } from './config.js';
import { runFirestoreInit, seedPlan } from './index.js';

const { calls, mockImport } = vi.hoisted(() => {
  const calls: string[] = [];
  const mockImport = (label: string) => vi.fn(() => calls.push(label));
  return { calls, mockImport };
});

vi.mock('./blog.js', () => ({ importBlog: mockImport('blog') }));
vi.mock('./config.js', () => ({
  importConfig: mockImport('config'),
  seededConfig: (features: Record<string, boolean>) =>
    features['notifications'] === false ? [] : ['notifications'],
}));
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
vi.mock('../../lib/prompt.js', () => ({ confirmChange: vi.fn() }));
vi.mock('../../utils/firebase-project.js', () => ({ resolveFirebaseProjectId: () => 'fest-2027' }));

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  setTarget('emulator');
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
    expect(console.log).toHaveBeenCalledWith(
      'Skipped the data of features that are off in packages/config/site.json: blog, team.',
    );
  });

  it('skips sessions only when the schedule and the speakers are off', async () => {
    await runFirestoreInit({ schedule: false, speakers: false });

    expect(calls).not.toContain('sessions');
    expect(calls).not.toContain('speakers');
  });

  it('writes nothing with --dry-run, and says how many documents it would write', async () => {
    const result = await runFirestoreInit({ blog: false }, { dryRun: true });

    expect(calls).toEqual([]);
    expect(result).toEqual({
      ok: true,
      documents: seedPlan({ blog: false }).documents,
      skipped: ['blog'],
      dryRun: true,
    });
    expect(result && result['documents']).not.toHaveProperty('blog');
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/^Would write \d+ documents/));
  });

  it('asks before writing to production, and writes nothing when told no', async () => {
    setTarget('production');
    vi.mocked(confirmChange).mockResolvedValue(false);

    expect(await runFirestoreInit({})).toBe(false);

    expect(confirmChange).toHaveBeenCalledWith(
      expect.stringMatching(/^Write \d+ sample documents to fest-2027\?/),
      false,
    );
    expect(calls).toEqual([]);
  });
});

describe('seedPlan', () => {
  it('counts the documents of each collection, with subcollections', () => {
    const { documents } = seedPlan({});

    expect(documents['config']).toBe(1);
    expect(documents['sessions']).toBeGreaterThan(0);
    // Each partner group has its items, and each team its members.
    expect(documents['partners']).toBeGreaterThan(2);
    expect(documents['team']).toBeGreaterThan(2);
  });

  it('leaves out the collections of features that are off', () => {
    const names = Object.keys(seedPlan({ notifications: false, videos: false }).documents);

    expect(names).not.toContain('config');
    expect(names).not.toContain('videos');
  });
});
