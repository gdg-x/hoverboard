import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../../models/session';
import type { Speaker } from '../../models/speaker';
import { sessionImage, speakerImage } from '../../data/social-images';
import * as sessionRoute from './sessions/[file].png';
import * as speakerRoute from './speakers/[file].png';

const speakers = [{ id: 'ada', name: 'Ada Lovelace', company: '', photoUrl: '' }] as Speaker[];
const sessions = [
  { id: 'keynote', title: 'Keynote', description: '', speakers: ['ada'] },
  { id: 'lunch', title: 'Lunch', description: '' },
] as Session[];

vi.mock('../../data/content', () => ({ loadContent: async () => ({ sessions, speakers }) }));

describe('share image endpoints', () => {
  it('builds one image per session, named as its page names it', async () => {
    const paths = await sessionRoute.getStaticPaths();

    expect(paths.map(({ params }) => params.file)).toEqual(
      sessions.map((session) => sessionImage(session, speakers).file),
    );
  });

  it('builds one image per speaker', async () => {
    const paths = await speakerRoute.getStaticPaths();

    expect(paths.map(({ params }) => params.file)).toEqual([speakerImage(speakers[0]!).file]);
  });

  it('responds with the PNG', async () => {
    const { props } = (await sessionRoute.getStaticPaths())[0]!;

    const response = await sessionRoute.GET({ props } as never);

    expect(response.headers.get('Content-Type')).toBe('image/png');
    const png = Buffer.from(await response.arrayBuffer());
    expect(await sharp(png).metadata()).toMatchObject({ width: 1200, height: 630 });
  });
});
