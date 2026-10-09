// Turns an SVG downloaded from unDraw into a themed illustration in src/illustrations/:
//   npm --prefix packages/web run illustrations -- <downloaded.svg> <name>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { optimize } from 'svgo';

/** unDraw's colors and the theme colors that replace them. */
export const ILLUSTRATION_COLORS = {
  // The accent, which unDraw lets you pick. Its default.
  '#6c63ff': 'var(--hb-illustration-accent)',
  '#ff6584': 'var(--hb-color-accent-2)',
  // Dark neutrals: outlines, clothes, hair and text.
  '#090814': 'var(--hb-color-on-surface)',
  '#2f2e41': 'var(--hb-color-on-surface)',
  '#3f3d56': 'var(--hb-color-on-surface)',
  // Light neutrals: backgrounds, screens and paper.
  '#ffffff': 'var(--hb-color-surface-bright)',
  '#f2f2f2': 'var(--hb-color-surface-container)',
  '#f0f0f0': 'var(--hb-color-surface-container)',
  '#e6e6e6': 'var(--hb-color-surface-container)',
  '#e4e4e4': 'var(--hb-color-surface-container)',
  '#d6d6e3': 'var(--hb-color-surface-container-high)',
  '#cccccc': 'var(--hb-color-surface-container-high)',
  '#cacaca': 'var(--hb-color-surface-container-high)',
};

/** Skin tones, which stay as drawn. */
export const KEPT_COLORS = ['#ed9da0', '#ffb6b6', '#ffb9b9'];

const HEX = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;

const normalize = (hex) => {
  const value = hex.toLowerCase();
  return value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : value;
};

/** The optimized SVG with theme colors, or an error that lists the colors it does not know. */
export const themeIllustration = (source) => {
  const { data } = optimize(source, {
    multipass: true,
    plugins: [
      { name: 'preset-default', params: { overrides: { convertColors: { shorthex: false } } } },
      'removeDimensions',
      { name: 'removeAttrs', params: { attrs: ['data-name', 'id'] } },
    ],
  });
  const unknown = new Set();
  const themed = data.replace(HEX, (hex) => {
    const color = normalize(hex);
    if (KEPT_COLORS.includes(color)) return color;
    if (color in ILLUSTRATION_COLORS) return ILLUSTRATION_COLORS[color];
    unknown.add(color);
    return color;
  });
  if (unknown.size) {
    throw new Error(
      `Unknown colors: ${[...unknown].join(', ')}. Add them to ILLUSTRATION_COLORS or KEPT_COLORS in build/illustrations.mjs.`,
    );
  }
  return themed.replace('<svg', '<svg aria-hidden="true" focusable="false"');
};

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const [input, name] = argv.slice(2);
  if (!input || !/^[a-z][a-z0-9-]*$/.test(name ?? '')) {
    console.error('Usage: npm run illustrations -- <downloaded.svg> <name, such as not-found>');
    exit(1);
  }
  const svg = themeIllustration(readFileSync(input, 'utf8'));
  const output = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/illustrations',
    `${name}.svg`,
  );
  writeFileSync(output, `${svg}\n`);
  console.log(`Wrote src/illustrations/${name}.svg (${(svg.length / 1024).toFixed(1)}KB).`);
}
