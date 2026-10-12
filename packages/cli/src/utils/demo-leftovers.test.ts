import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkDemoLeftovers, demoLeftovers, formatLeftovers } from './demo-leftovers.js';

let repo: string;
const write = (path: string, content: unknown) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(
    join(repo, path),
    typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content),
  );
};

const demoResources = {
  title: 'DevFest',
  description: 'The biggest community conference in Ukraine.',
  aboutBlock: {
    callToAction: {
      howItWas: { label: 'See how it was', description: 'A video of 2016.', youtubeId: 'abc' },
    },
  },
  footerRelBlock: [{ title: 'Pages', links: [{ name: 'Code of conduct', url: '/coc' }] }],
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'hoverboard-leftovers-'));
  write('packages/demo-config/site.json', {
    social: { follow: [{ icon: 'x', url: 'https://x.com/demo' }] },
  });
  write('packages/demo-config/content/resources.json', demoResources);
  write('packages/demo-config/public/images/logo.svg', '<svg>demo</svg>');
  write('packages/demo-config/public/images/hero.jpg', 'demo photo');
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('demoLeftovers', () => {
  it("finds the demo's images, text, highlights video and social links", () => {
    write('packages/config/site.json', {
      social: {
        follow: [
          { icon: 'x', url: 'https://x.com/demo' },
          { icon: 'x', url: 'https://x.com/fest' },
        ],
      },
    });
    write('packages/config/content/resources.json', {
      ...demoResources,
      title: 'New Fest',
    });
    write('packages/config/public/images/logo.svg', '<svg>ours</svg>');
    write('packages/config/public/images/hero.jpg', 'demo photo');

    expect(demoLeftovers(repo)).toEqual([
      "packages/config/public/images/hero.jpg: the demo's image",
      "packages/config/content/resources.json/description: the demo's text",
      "packages/config/content/resources.json/aboutBlock/callToAction/howItWas: the demo's video",
      "packages/config/site.json/social/follow: the demo's link https://x.com/demo",
    ]);
  });

  it('finds nothing in a site of its own', () => {
    write('packages/config/site.json', { social: { follow: [] } });
    write('packages/config/content/resources.json', {
      title: 'New Fest',
      description: 'A new conference in Springfield.',
      aboutBlock: { callToAction: {} },
      footerRelBlock: demoResources.footerRelBlock,
    });
    write('packages/config/public/images/logo.svg', '<svg>ours</svg>');

    expect(demoLeftovers(repo)).toEqual([]);
  });
});

describe('formatLeftovers', () => {
  it('lists ten, and counts the rest', () => {
    const lines = formatLeftovers(Array.from({ length: 12 }, (_, index) => `item ${index}`));

    expect(lines).toHaveLength(11);
    expect(lines.at(-1)).toBe('    and 2 more');
  });
});

describe('checkDemoLeftovers', () => {
  it('warns without failing, and skips the demo itself', () => {
    expect(checkDemoLeftovers(repo)).toMatchObject({
      ok: true,
      message: 'Skipped, the site is the demo.',
    });

    write('packages/config/site.json', {});
    write('packages/config/public/images/hero.jpg', 'demo photo');

    expect(checkDemoLeftovers(repo)).toMatchObject({
      ok: true,
      warning: true,
      message: expect.stringContaining('images/hero.jpg'),
    });
  });
});
