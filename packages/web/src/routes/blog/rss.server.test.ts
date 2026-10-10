import { JSDOM } from 'jsdom';
import { site } from 'virtual:hoverboard/site';
import { describe, expect, it, vi } from 'vitest';
import type { Post } from '../../models/post';
import { GET } from './rss.xml';

const posts = [
  {
    id: 'speakers & more',
    title: 'Speakers <announced>',
    brief: 'Meet them',
    content: 'Meet **them**.<script>alert(1)</script>',
    published: '2026-10-08',
  },
  {
    id: 'launch',
    title: 'Launch',
    brief: 'It is on',
    content: 'Only the start',
    source: '/data/posts/launch.md',
    published: '2026-09-01',
  },
] as Post[];

vi.mock('../../data/content', () => ({ loadContent: async () => ({ blog: posts }) }));
vi.mock('virtual:hoverboard/markdown', () => ({
  posts: { 'launch.md': 'See [the schedule](/schedule) and ![the hall](images/hall.jpg).' },
}));

const feed = async () => (await GET({} as never)).text();

const contents = async () => {
  const { document } = new JSDOM(await feed(), { contentType: 'text/xml' }).window;
  return [...document.getElementsByTagName('content:encoded')].map((item) => item.textContent);
};

describe('blog RSS feed', () => {
  it('lists every post with an absolute link and its date', async () => {
    const xml = await feed();

    expect(xml).toContain(`<link>${new URL('blog', site.url).href}</link>`);
    expect(xml).toContain(`<link>${new URL('blog/launch', site.url).href}</link>`);
    expect(xml).toContain('<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<description>It is on</description>');
    expect(xml.match(/<item>/g)).toHaveLength(2);
  });

  it('escapes post titles and links', async () => {
    const xml = await feed();

    expect(xml).toContain('<title>Speakers &lt;announced&gt;</title>');
    expect(xml).toContain(`${new URL('blog/speakers%20', site.url).href}&amp;%20more</link>`);
  });

  it('sets the language to the site locale', async () => {
    expect(await feed()).toContain(`<language>${site.locales.source}</language>`);
  });

  it('has the whole post as sanitized HTML', async () => {
    expect(await feed()).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect((await contents())[0]).toBe('<p>Meet <strong>them</strong>.</p>\n');
  });

  it('reads the post from its source file, with absolute links and images', async () => {
    const content = (await contents())[1];

    expect(content).toContain(`<a href="${new URL('schedule', site.url).href}"`);
    expect(content).toContain(`<img src="${new URL('images/hall.jpg', site.url).href}"`);
    expect(content).not.toContain('Only the start');
  });
});
