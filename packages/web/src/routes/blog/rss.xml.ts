import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { JSDOM } from 'jsdom';
import { posts } from 'virtual:hoverboard/markdown';
import { site } from 'virtual:hoverboard/site';
import { loadContent } from '../../data/content';
import '../../data/markdown';
import { pageMetadata } from '../../data/metadata';
import { withPostSource } from '../../data/posts';
import { renderMarkdown } from '../../utils/markdown';

// Feed readers show posts away from the site, so its relative links and images need its URL.
const withAbsoluteUrls = (html: string, document: Document): string => {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const element of template.content.querySelectorAll('[href], [src]')) {
    for (const name of ['href', 'src']) {
      const value = element.getAttribute(name);
      const url = value === null ? null : URL.parse(value, site.url);
      if (url) element.setAttribute(name, url.href);
    }
  }
  return template.innerHTML;
};

export const GET: APIRoute = async () => {
  const { blog = [] } = await loadContent();
  const { title, description } = pageMetadata('blog');
  const { document } = new JSDOM('').window;
  return rss({
    title,
    description,
    site: new URL('blog', site.url).href,
    trailingSlash: false,
    customData: `<language>${site.locales.source}</language>`,
    items: blog.map((post) => ({
      title: post.title,
      link: new URL(`blog/${post.id}`, site.url).href,
      pubDate: new Date(post.published),
      description: post.brief,
      content: withAbsoluteUrls(renderMarkdown(withPostSource(post, posts).content), document),
    })),
  });
};
