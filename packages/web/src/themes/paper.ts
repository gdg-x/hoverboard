import { type Theme, type ToneColors, containerTones } from './tokens';

const svg = (markup: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${markup}</svg>`)}")`;

const ROUGH = [6, 4, 7, 3, 6, 2, 5, 3, 7, 4, 6, 2, 5, 3, 6, 4];

// A torn edge: a 10px strip filled below a rough line, for the top of a band, or above it, for the bottom.
const tear = (base: 0 | 10) =>
  svg(
    `viewBox='0 0 120 10' preserveAspectRatio='none'><path d='M0 ${base} ${ROUGH.map((y, index) => `L${index * 8} ${base ? y : 10 - y}`).join(' ')} L120 ${base}Z'/>`,
  );
const tornEdges = [
  `${tear(10)} 0 0 / 120px 10px repeat-x`,
  'linear-gradient(black 0 0) 0 10px / 100% calc(100% - 20px) no-repeat',
  `${tear(0)} 0 100% / 120px 10px repeat-x`,
].join(', ');

// Faint paper grain, about 6% black.
const grain = svg(
  "width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0 0 0 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/>",
);

// Watercolor: a few soft pools of the band's own color, darker where the paint gathered.
const wash = (spots: [string, string][]) =>
  spots
    .map(
      ([size, at]) =>
        `radial-gradient(${size} at ${at}, color-mix(in srgb, currentColor 7%, transparent), transparent 70%)`,
    )
    .join(', ');

const washed = (tone: ToneColors, spots: [string, string][]): ToneColors => ({
  ...tone,
  pattern: wash(spots),
});

// Lines of a notebook page, in the text color.
const ruled =
  'repeating-linear-gradient(transparent 0 31px, color-mix(in srgb, currentColor 12%, transparent) 31px 32px)';

// White paper, light pencil outlines and watercolor washes: ultramarine, rose madder, ochre, sap green.
export const paper: Theme = {
  colorScheme: 'system',
  fonts: { display: 'literata', body: 'inter', mono: 'jetbrains-mono', accent: 'caveat' },
  share: {
    bar: 0,
    glows: [
      { role: 'accent2', at: '100% 0%', opacity: 0.12 },
      { role: 'accent1', at: '0% 100%', opacity: 0.1 },
    ],
    avatarRadius: '2px',
    avatarShadow: { x: 0, y: 6, blur: 18, role: 'scrim' },
    avatarGrayscale: false,
    avatarFrame: { side: 16, bottom: 56 },
    avatarTape: true,
    avatarTilt: -2,
  },
  light: {
    primary: '#3f5f9a',
    onPrimary: '#ffffff',
    primaryContainer: '#dde7f3',
    onPrimaryContainer: '#1c2f52',
    secondary: '#e3b25a',
    onSecondary: '#2f2f33',
    surface: '#fffefb',
    surfaceDim: '#ebe9e3',
    surfaceBright: '#ffffff',
    surfaceContainer: '#f7f6f2',
    surfaceContainerHigh: '#efede7',
    onSurface: '#2f2f33',
    onSurfaceVariant: '#5b5a60',
    outline: '#8a8780',
    outlineVariant: '#d3d0c8',
    ink: '#3c3b40',
    focus: '#3f5f9a',
    error: '#b3261e',
    onError: '#ffffff',
    success: '#3f7a3e',
    scrim: 'rgb(47 47 51 / 50%)',
    accent1: '#3f5f9a',
    accent1Container: '#dbe6f2',
    onAccent1Container: '#1c2f52',
    accent2: '#b8475a',
    accent2Container: '#f6dde1',
    onAccent2Container: '#5a1c28',
    accent3: '#d9a441',
    accent3Container: '#f8edd3',
    onAccent3Container: '#4d3a12',
    accent4: '#5b8a5a',
    accent4Container: '#dfecdb',
    onAccent4Container: '#23401f',
  },
  dark: {
    primary: '#9db6e0',
    onPrimary: '#142544',
    primaryContainer: '#263a5a',
    onPrimaryContainer: '#dde7f3',
    secondary: '#e8bf6e',
    onSecondary: '#1d1c1a',
    surface: '#1d1c1a',
    surfaceDim: '#161514',
    surfaceBright: '#2b2a27',
    surfaceContainer: '#252421',
    surfaceContainerHigh: '#2f2e2a',
    onSurface: '#ece9e2',
    onSurfaceVariant: '#c2beb5',
    outline: '#9a968d',
    outlineVariant: '#4a4843',
    ink: '#e6e2da',
    focus: '#9db6e0',
    error: '#ffb4ab',
    onError: '#690005',
    success: '#8fcf8c',
    scrim: 'rgb(0 0 0 / 60%)',
    accent1: '#9db6e0',
    accent1Container: '#263a5a',
    onAccent1Container: '#dde7f3',
    accent2: '#e79aa6',
    accent2Container: '#4f2530',
    onAccent2Container: '#f6dde1',
    accent3: '#e8bf6e',
    accent3Container: '#4a3a18',
    onAccent3Container: '#f8edd3',
    accent4: '#9cc79a',
    accent4Container: '#26402a',
    onAccent4Container: '#dfecdb',
  },
  style: {
    displayWeight: '600',
    headingWeight: '600',
    displayTracking: '-0.01em',
    displayLeading: '1.05',
    displayStyle: 'normal',
    heroTitleStyle: 'italic',
    // Caveat runs small: 1.5 times makes the smallest sticker text 18px.
    accentScale: '1.5',
    displayScale: '1',
    // Nearly square corners, a little uneven, as if drawn by hand. `radiusL` stays one length, because `calc()` reads it.
    radiusS: '1px 2px 1px 3px / 2px 1px 3px 1px',
    radiusM: '2px 3px 2px 4px / 3px 2px 4px 2px',
    radiusL: '3px',
    radiusAvatar: '47% 53% 45% 55% / 53% 46% 54% 47%',
    radiusControl: '3px 5px 4px 6px / 5px 3px 6px 4px',
    borderWidth: '1.5px',
    borderColor: 'var(--hb-color-outline-variant)',
    // A second, fainter pencil stroke just off the first.
    shadowCard: '1px 2px 0 -0.5px var(--hb-color-outline-variant)',
    shadowCardHover: '2px 4px 0 -0.5px var(--hb-color-outline-variant)',
    shadowButton: '1px 2px 0 -0.5px var(--hb-color-outline-variant)',
    pressOffset: '1px',
    ctaBackground: 'var(--hb-color-primary)',
    onCta: 'var(--hb-color-on-primary)',
    footerBackground: 'var(--hb-color-surface-container)',
    footerText: 'var(--hb-color-on-surface)',
    pageBackground: 'var(--hb-color-surface)',
    sectionBackground: 'var(--hb-color-surface)',
    tintOpacity: '100%',
    panelBackground: 'var(--hb-color-surface-bright)',
    barBackground: 'var(--hb-color-surface)',
    backdropFilter: 'none',
    headerMaxWidth: '100%',
    headerInset: '0',
    headerRadius: '0',
    headerBorderWidth: '0 0 1.5px',
    headerShadow: '0 2px 0 -0.5px var(--hb-color-outline-variant)',
    headerSideFlex: '0 1 auto',
    heroColumns: '1fr 1.4fr',
    heroAlign: 'start',
    heroPanelBackground: 'transparent',
    heroPanelPadding: '0',
    heroPanelShadow: 'none',
    heroArtOrder: '-1',
    heroArtDisplay: 'block',
    heroArtMaxWidth: 'none',
    heroArtBackground: 'none',
    bandHeaderDirection: 'column',
    bandHeaderAlign: 'flex-start',
    bandTextAlign: 'start',
    bandEyebrow: 'block',
    eyebrowColor: 'currentColor',
    cardScale: '1',
    cardStagger: '1.5rem',
    bandInset: '0',
    bandRadius: '0',
    bandDivider: 'none',
    titleUnderline: 'underline wavy 0.06em var(--hb-color-accent-2)',
    heroPattern: ruled,
    bandEdge: tornEdges,
    pageTexture: grain,
    // A strip of tape with torn ends.
    stickerShape:
      'polygon(0 0, 100% 0, calc(100% - 4px) 25%, 100% 50%, calc(100% - 4px) 75%, 100% 100%, 0 100%, 4px 75%, 0 50%, 4px 25%)',
    stickerTiltScale: '1',
    // A polaroid: white all round, more at the bottom.
    photoFrame: '8px 8px 28px',
    photoFrameColor: 'var(--hb-color-surface-bright)',
    photoTilt: '1.5deg',
    photoTape: 'color-mix(in srgb, var(--hb-color-accent-3) 55%, transparent)',
    avatarFilter: 'none',
    avatarFilterHover: 'none',
    avatarShadow: 'none',
    easePress: 'var(--hb-ease-standard)',
    pressScale: '1',
    hoverTranslate: '0 -3px',
    hoverRotate: '-1deg',
    durationShort: '160ms',
    durationMedium: '320ms',
  },
  tones: {
    surface: containerTones.surface,
    'accent-1': washed(containerTones['accent-1'], [
      ['40% 60%', '15% 30%'],
      ['30% 50%', '80% 70%'],
    ]),
    'accent-2': washed(containerTones['accent-2'], [
      ['35% 55%', '75% 25%'],
      ['40% 60%', '20% 80%'],
    ]),
    'accent-3': washed(containerTones['accent-3'], [
      ['45% 70%', '50% 20%'],
      ['25% 45%', '10% 85%'],
    ]),
    'accent-4': washed(containerTones['accent-4'], [
      ['30% 55%', '25% 20%'],
      ['45% 65%', '85% 75%'],
    ]),
  },
};
