import { Resvg } from '@resvg/resvg-js';
import { Buffer } from 'node:buffer';
import { access, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import satori, { type Font, type FontWeight } from 'satori';
import sharp from 'sharp';
import {
  avatarRadius,
  colors,
  displayWeight,
  fonts,
  logo,
  publicDirs,
  share,
} from 'virtual:hoverboard/social-images';
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

// A photo with a path instead of a URL is in the site's public folder, or packages/web's.
const readPhoto = async (photoUrl: string): Promise<Buffer> => {
  if (URL.canParse(photoUrl)) {
    const response = await fetch(photoUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const path = `.${new URL(photoUrl, 'file:///').pathname}`;
  for (const publicDir of publicDirs) {
    const file = resolve(publicDir, path);
    if (!file.startsWith(`${publicDir}${sep}`)) throw new Error('outside the public directory');
    if (
      await access(file).then(
        () => true,
        () => false,
      )
    ) {
      return readFile(file);
    }
  }
  throw new Error('not in a public directory');
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
          .grayscale(share.avatarGrayscale)
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

let logoPng: Promise<string> | undefined;

/** The logo at twice its size as a PNG, since resvg leaves out images inside an SVG image. */
const rasterLogo = (svg: string, size: { height: number }, width: number, height: number) =>
  (logoPng ??= sharp(Buffer.from(svg), { density: (72 * 2 * height) / size.height })
    .resize(Math.round(width * 2), Math.round(height * 2), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
    .then((png) => dataUrl('image/png', png)));

const header = async (): Promise<Node> => {
  const size = logo ? svgSize(logo) : undefined;
  if (!logo || !size) {
    return h(
      'div',
      { fontFamily: DISPLAY, fontWeight: displayWeight, fontSize: 40, color: colors.primary },
      shortName,
    );
  }
  const width = Math.min(LOGO_MAX_WIDTH, (LOGO_HEIGHT * size.width) / size.height);
  const height = (width * size.height) / size.width;
  return {
    type: 'img',
    props: {
      src: await rasterLogo(logo, size, width, height),
      width,
      height,
      style: { objectFit: 'contain' },
    },
  };
};

/**
 * `height` includes the theme's frame. `ring` separates avatars that overlap, when the theme has
 * no border of its own.
 */
const avatar = (
  person: SocialImagePerson,
  photo: string | undefined,
  height: number,
  ring = false,
): Node => {
  const { avatarBorder, avatarShadow, avatarFrame, avatarTilt } = share;
  // The share style's lengths are for a 280px avatar.
  const size = avatarFrame
    ? Math.round((height * 280) / (280 + avatarFrame.side + avatarFrame.bottom))
    : height;
  const px = (length: number) => Math.round((length * size) / 280);
  const border = avatarBorder
    ? `${Math.max(1, px(avatarBorder.width))}px solid ${colors[avatarBorder.role]}`
    : ring && `${Math.round(size / 24)}px solid ${colors.surface}`;
  const shadow =
    avatarShadow &&
    `${px(avatarShadow.x)}px ${px(avatarShadow.y)}px ${px(avatarShadow.blur)}px ${colors[avatarShadow.role]}`;
  const tilt = avatarTilt ? { transform: `rotate(${avatarTilt}deg)` } : {};
  const style = {
    width: size,
    height: size,
    borderRadius: avatarRadius,
    ...(border ? { border } : {}),
    ...(shadow && !avatarFrame ? { boxShadow: shadow } : {}),
    ...(avatarFrame ? {} : tilt),
  };
  const picture = photo
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
          fontWeight: displayWeight,
          fontSize: size * 0.36,
        },
        person.initials,
      );
  if (!avatarFrame) return picture;
  const side = px(avatarFrame.side);
  const tapeWidth = Math.round(size * 0.45);
  return h(
    'div',
    {
      position: 'relative',
      display: 'flex',
      flexShrink: 0,
      padding: `${side}px ${side}px ${px(avatarFrame.bottom)}px`,
      backgroundColor: colors.surfaceBright,
      ...(shadow ? { boxShadow: shadow } : {}),
      ...tilt,
    },
    picture,
    share.avatarTape &&
      h('div', {
        position: 'absolute',
        top: -px(16),
        left: side + (size - tapeWidth) / 2,
        width: tapeWidth,
        height: px(40),
        backgroundColor: colors.surfaceContainerHigh,
        opacity: 0.85,
        transform: 'rotate(-4deg)',
      }),
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
        fontWeight: displayWeight,
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
          fontWeight: displayWeight,
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
    ...share.glows.map(({ role, at, opacity }) =>
      h('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at ${at}, ${colors[role]}, transparent 70%)`,
        opacity,
      }),
    ),
    share.bar > 0 &&
      h('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: share.bar,
        backgroundColor: colors.primary,
      }),
    // Satori sizes boxes without their padding, so the content is placed from each edge instead.
    h(
      'div',
      {
        position: 'absolute',
        top: share.bar + PADDING - 8,
        left: PADDING,
        right: PADDING,
        bottom: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      },
      h('div', { display: 'flex', flexShrink: 0 }, await header()),
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
