import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFirestoreInit } from './index.js';

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
vi.mock('./schedule.js', () => ({ importSchedule: mockImport('schedule') }));
vi.mock('./sessions.js', () => ({ importSessions: mockImport('sessions') }));
vi.mock('./speakers.js', () => ({ importSpeakers: mockImport('speakers') }));
vi.mock('./team.js', () => ({ importTeam: mockImport('team') }));
vi.mock('./tickets.js', () => ({ importTickets: mockImport('tickets') }));
vi.mock('./videos.js', () => ({ importVideos: mockImport('videos') }));

afterEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
});

describe('runFirestoreInit', () => {
  it('imports config first, then every other collection', async () => {
    await runFirestoreInit();

    expect(calls[0]).toBe('config');
    expect(calls.slice(1).sort()).toEqual(
      [
        'blog',
        'gallery',
        'partners',
        'previousSpeakers',
        'schedule',
        'sessions',
        'speakers',
        'team',
        'tickets',
        'videos',
      ].sort(),
    );
  });
});
