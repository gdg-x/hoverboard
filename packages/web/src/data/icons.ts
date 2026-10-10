/** The sizes of the app icons, which the build makes from `icon` in site.json. */
export const ICON_SIZES = [
  16, 32, 48, 57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 512,
] as const;

export type IconSize = (typeof ICON_SIZES)[number];

export const iconPath = (size: IconSize): string => `images/manifest/icon-${size}.png`;
