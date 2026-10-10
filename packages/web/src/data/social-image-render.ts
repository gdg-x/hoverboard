import { Resvg } from '@resvg/resvg-js';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import satori, { type Font, type FontWeight } from 'satori';
import sharp from 'sharp';
import { avatarRadius, colors, fonts, logo, publicDir } from 'virtual:hoverboard/social-images';
import { shortName } from '../config/site';
import {
  SOCIAL_IMAGE,
  type SessionImage,
  type SocialImage,
  type SocialImagePerson,
  type SpeakerImage,
} from './social-images';

type Style = Record<string, string | number>;
interface Node {
  type: string;
  props: { style?: Style; children?: (Node | string)[] | Node | string; [name: string]: unknown };
}

const h = (
  type: string,
  style: Style,
  ...children: (Node | string | false | undefined)[]
): Node => ({
  type,
  props: { style, children: children.filter((child) => child !== false && child !== undefined) },
});

const PADDING = 64;
const PHOTO_SIZE = 320;
const FETCH_TIMEOUT = 10_000;

const dataUrl = (type: string, data: Buffer) => `data:${type};base64,${data.toString('base64')}`;

/** The role's families, one per subset, in order. */
const family = (role: 'display' | 'body') =>
  [...new Set(fonts.filter((font) => font.role === role).map(({ name }) => name))].join(', ');
const DISPLAY = family('display');
const BODY = family('body');

// A photo with a path instead of a URL is in the site's public directory.
const readPhoto = async (photoUrl: string): Promise<Buffer> => {
  if (URL.canParse(photoUrl)) {
    const response = await fetch(photoUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const file = resolve(publicDir, `.${new URL(photoUrl, 'file:///').pathname}`);
  if (!file.startsWith(`${publicDir}${sep}`)) throw new Error('outside the public directory');
  return readFile(file);
};

const photos = new Map<string, Promise<string | undefined>>();

/**
 * A square JPEG of the photo, as a data URL. Satori reads few formats, and a large photo would
 * slow the render. Each photo loads once per build. A photo that fails to load shows initials.
 */
export const loadPhoto = (photoUrl: string): Promise<string | undefined> => {
  let photo = photos.get(photoUrl);
  if (!photo) {
    photo = readPhoto(photoUrl)
      .then((data) =>
        sharp(data)
          .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer(),
      )
      .then((jpeg) => dataUrl('image/jpeg', jpeg))
      .catch((error: unknown) => {
        console.warn(
          `Share images: the photo ${photoUrl} did not load, so they show initials. ${String(error)}`,
        );
        return undefined;
      });
    photos.set(photoUrl, photo);
  }
  return photo;
};

/** The logo's width and height, from its attributes or its `viewBox`. */
export const svgSize = (svg: string): { width: number; height: number } | undefined => {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? '';
  const attribute = (name: string) => new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1];
  const width = Number.parseFloat(attribute('width') ?? '');
  const height = Number.parseFloat(attribute('height') ?? '');
  if (width > 0 && height > 0) return { width, height };
  const [, , boxWidth = 0, boxHeight = 0] = (attribute('viewBox') ?? '')
    .split(/[\s,]+/)
    .map(Number);
  return boxWidth > 0 && boxHeight > 0 ? { width: boxWidth, height: boxHeight } : undefined;
};

const LOGO_HEIGHT = 56;
const LOGO_MAX_WIDTH = 480;

const header = (): Node => {
  const size = logo ? svgSize(logo) : undefined;
  if (!logo || !size) {
    return h(
      'div',
      { fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: colors.primary },
      shortName,
    );
  }
  const width = Math.min(LOGO_MAX_WIDTH, (LOGO_HEIGHT * size.width) / size.height);
  return {
    type: 'img',
    props: {
      src: dataUrl('image/svg+xml', Buffer.from(logo)),
      width,
      height: (width * size.height) / size.width,
      style: { objectFit: 'contain' },
    },
  };
};

/** `ring` separates avatars that overlap. */
const avatar = (
  person: SocialImagePerson,
  photo: string | undefined,
  size: number,
  ring = false,
): Node => {
  const style = {
    width: size,
    height: size,
    borderRadius: avatarRadius,
    ...(ring ? { border: `${Math.round(size / 24)}px solid ${colors.surface}` } : {}),
  };
  return photo
    ? { type: 'img', props: { src: photo, width: size, height: size, style } }
    : h(
        'div',
        {
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryContainer,
          color: colors.onPrimaryContainer,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: size * 0.36,
        },
        person.initials,
      );
};

const footer = (image: SocialImage): Node =>
  h(
    'div',
    {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      flexShrink: 0,
      gap: 32,
      paddingTop: 24,
      borderTop: `2px solid ${colors.outlineVariant}`,
    },
    h(
      'div',
      { display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 1 },
      h('div', { fontSize: 28, fontWeight: 600, color: colors.onSurface }, image.details),
      h('div', { fontSize: 24, color: colors.onSurfaceVariant }, image.place),
    ),
    h('div', { fontSize: 26, fontWeight: 600, color: colors.primary, flexShrink: 0 }, image.host),
  );

const clamp = (lines: number): Style => ({ display: 'block', lineClamp: lines });

const photoOf = ({ photoUrl }: SocialImagePerson) =>
  photoUrl ? loadPhoto(photoUrl) : Promise.resolve(undefined);

const sessionBody = async (image: SessionImage): Promise<Node> => {
  const photoSize = image.speakers.length === 1 ? 104 : 88;
  const ring = image.speakers.length > 1;
  const avatars = await Promise.all(
    image.speakers.map(async (speaker, index) =>
      h(
        'div',
        { display: 'flex', marginLeft: index ? -photoSize / 5 : 0 },
        avatar(speaker, await photoOf(speaker), photoSize, ring),
      ),
    ),
  );
  if (image.moreSpeakers) {
    avatars.push(
      h(
        'div',
        { display: 'flex', marginLeft: -photoSize / 5 },
        avatar({ name: '', initials: `+${image.moreSpeakers}` }, undefined, photoSize, ring),
      ),
    );
  }
  return h(
    'div',
    { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, gap: 32 },
    h(
      'div',
      {
        ...clamp(3),
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: image.titleSize,
        lineHeight: 1.15,
        color: colors.onSurface,
      },
      image.title,
    ),
    image.speakers.length > 0 &&
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 24 },
        h('div', { display: 'flex' }, ...avatars),
        h(
          'div',
          { display: 'flex', flexDirection: 'column', flexShrink: 1, gap: 2 },
          h(
            'div',
            { ...clamp(1), fontSize: 32, fontWeight: 600, color: colors.onSurface },
            image.names,
          ),
          image.company &&
            h('div', { ...clamp(1), fontSize: 26, color: colors.onSurfaceVariant }, image.company),
        ),
      ),
  );
};

const speakerBody = async (image: SpeakerImage): Promise<Node> =>
  h(
    'div',
    { display: 'flex', alignItems: 'center', flexGrow: 1, gap: 56 },
    avatar(image.speaker, await photoOf(image.speaker), 280),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', flexShrink: 1, gap: 16 },
      h(
        'div',
        {
          ...clamp(2),
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: image.nameSize,
          lineHeight: 1.1,
          color: colors.onSurface,
        },
        image.speaker.name,
      ),
      image.company &&
        h('div', { ...clamp(2), fontSize: 34, color: colors.onSurfaceVariant }, image.company),
    ),
  );

let fontData: Promise<Font[]> | undefined;

const loadFonts = () =>
  (fontData ??= Promise.all(
    fonts.map(async ({ name, path, weight }) => ({
      name,
      data: await readFile(path),
      weight: weight as FontWeight,
      style: 'normal' as const,
    })),
  ));

/** The image as an SVG, with the text as paths. */
export const socialImageSvg = async (image: SocialImage): Promise<string> => {
  const body = image.kind === 'session' ? await sessionBody(image) : await speakerBody(image);
  const tree = h(
    'div',
    {
      display: 'flex',
      width: SOCIAL_IMAGE.width,
      height: SOCIAL_IMAGE.height,
      backgroundColor: colors.surface,
      fontFamily: BODY,
      color: colors.onSurface,
    },
    h('div', {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 16,
      backgroundColor: colors.primary,
    }),
    // Satori sizes boxes without their padding, so the content is placed from each edge instead.
    h(
      'div',
      {
        position: 'absolute',
        top: 16 + PADDING - 8,
        left: PADDING,
        right: PADDING,
        bottom: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      },
      h('div', { display: 'flex', flexShrink: 0 }, header()),
      body,
      footer(image),
    ),
  );
  return satori(tree, { ...SOCIAL_IMAGE, fonts: await loadFonts() });
};

/** The image as a PNG. */
export const renderSocialImage = async (image: SocialImage): Promise<Buffer> => {
  const svg = await socialImageSvg(image);
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
};
