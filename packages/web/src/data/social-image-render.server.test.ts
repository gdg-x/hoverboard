import sharp from 'sharp';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { loadPhoto, renderSocialImage, socialImageSvg, svgSize } from './social-image-render';
import { sessionImage, speakerImage } from './social-images';

let jpeg: Buffer;

beforeAll(async () => {
  jpeg = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#336699' },
  })
    .jpeg()
    .toBuffer();
});

const fetchPhoto = vi.fn(async (_url: string) => new Response(new Uint8Array(jpeg)));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchPhoto.mockClear();
});

const speaker = (id: string, photoUrl: string) =>
  ({ id, name: `Speaker ${id}`, company: 'Example', photoUrl }) as Speaker;

const session = (speakers: string[]) =>
  ({ id: 'talk', title: 'A talk', description: '', speakers, day: '2017-10-13' }) as Session;

// Photos are JPEG data URLs in the SVG. The logo is SVG.
const photoCount = (svg: string) => svg.match(/data:image\/jpeg;base64,/g)?.length ?? 0;

describe('renderSocialImage', () => {
  it('renders a session image as a 1200×630 PNG', async () => {
    vi.stubGlobal('fetch', fetchPhoto);
    const speakers = [speaker('a', 'https://photos.test/render-a.jpg')];

    const png = await renderSocialImage(sessionImage(session(['a']), speakers));

    expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 1200, height: 630 });
  });

  it('renders a speaker image as a 1200×630 PNG', async () => {
    vi.stubGlobal('fetch', fetchPhoto);

    const png = await renderSocialImage(speakerImage(speaker('b', 'https://photos.test/b.jpg')));

    expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 1200, height: 630 });
  });
});

describe('socialImageSvg', () => {
  it("draws the site's logo and each speaker's photo", async () => {
    vi.stubGlobal('fetch', fetchPhoto);
    const speakers = ['c', 'd'].map((id) => speaker(id, `https://photos.test/${id}.jpg`));

    const svg = await socialImageSvg(sessionImage(session(['c', 'd']), speakers));

    expect(svg).toContain('data:image/svg+xml;base64,');
    expect(photoCount(svg)).toBe(2);
  });

  it('loads each photo once per build', async () => {
    vi.stubGlobal('fetch', fetchPhoto);
    const speakers = [speaker('e', 'https://photos.test/once.jpg')];

    await socialImageSvg(sessionImage(session(['e']), speakers));
    await socialImageSvg(speakerImage(speakers[0]!));

    expect(fetchPhoto).toHaveBeenCalledTimes(1);
  });

  it('shows initials and warns when a photo does not load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const svg = await socialImageSvg(speakerImage(speaker('f', 'https://photos.test/missing.jpg')));

    expect(photoCount(svg)).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('https://photos.test/missing.jpg'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'));
  });

  it('shows initials for a speaker without a photo', async () => {
    vi.stubGlobal('fetch', fetchPhoto);

    const svg = await socialImageSvg(speakerImage(speaker('g', '')));

    expect(photoCount(svg)).toBe(0);
    expect(fetchPhoto).not.toHaveBeenCalled();
  });
});

describe('loadPhoto', () => {
  it("reads a photo's path from the public directory", async () => {
    vi.stubGlobal('fetch', fetchPhoto);

    const photo = await loadPhoto('/images/team.jpg');

    expect(photo).toMatch(/^data:image\/jpeg;base64,/);
    expect(fetchPhoto).not.toHaveBeenCalled();
    const data = Buffer.from(photo!.split(',')[1]!, 'base64');
    expect(await sharp(data).metadata()).toMatchObject({ width: 320, height: 320 });
  });

  it('stays in the public directory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await loadPhoto('../../../package.json')).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('svgSize', () => {
  it("reads the size from the logo's attributes, or its viewBox", () => {
    expect(svgSize('<svg width="536.9" height="128">')).toEqual({ width: 536.9, height: 128 });
    expect(svgSize('<svg viewBox="0 0 200 50" width="100%">')).toEqual({ width: 200, height: 50 });
    expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg">')).toBeUndefined();
  });
});
