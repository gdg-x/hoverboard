import createDOMPurify, { type DOMPurify, type WindowLike } from 'dompurify';
import { isServer } from 'lit';
import { marked } from 'marked';
import { getHeadingList, gfmHeadingId } from 'marked-gfm-heading-id';

marked.use(gfmHeadingId());

const UNSUPPORTED_TAGS = ['div', 'plastic-image'];

let foundUnsupportedTag = false;

const configure = (purify: DOMPurify): DOMPurify => {
  purify.addHook('uponSanitizeElement', (_node, { tagName }) => {
    if (UNSUPPORTED_TAGS.includes(tagName)) foundUnsupportedTag = true;
  });
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return purify;
};

let purify = isServer ? undefined : configure(createDOMPurify(window));

/** Sanitizing needs a DOM. The server has none, so it passes a window, for example from jsdom. */
export const setMarkdownWindow = (window: WindowLike): void => {
  purify = configure(createDOMPurify(window));
};

/** Markdown as sanitized HTML, the same on the server and in the browser. Links open in a new tab. */
export const renderMarkdown = (content: string): string => {
  if (!purify) {
    throw new Error('Rendering markdown on the server needs setMarkdownWindow() first.');
  }
  foundUnsupportedTag = false;
  // No async extensions are in use, so parse returns a string.
  const html = purify.sanitize(marked.parse(content) as string);
  if (foundUnsupportedTag) {
    console.warn(
      `Invalid Markdown contains some of the following tags: ${UNSUPPORTED_TAGS.join(', ')}`,
    );
  }
  return html;
};

export interface MarkdownHeading {
  id: string;
  level: number;
  /** Plain text, without markup. */
  text: string;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

// A heading's HTML as text. Its `raw` text drops characters such as `&`.
const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ENTITIES[name]!);

/** Like `renderMarkdown()`, with the headings and the ids it gave them. */
export const renderMarkdownWithHeadings = (
  content: string,
): { html: string; headings: MarkdownHeading[] } => {
  const html = renderMarkdown(content);
  const headings = getHeadingList().map(({ id, level, text }) => ({
    id,
    level,
    text: plainText(text),
  }));
  return { html, headings };
};

/**
 * Turns each `###` question and the content up to the next heading into a `<details>` disclosure,
 * with the heading in its `<summary>`, so a long FAQ is easy to scan. Takes `renderMarkdown()`
 * output, where headings are top-level elements.
 */
export const withDisclosures = (html: string): string =>
  html
    .split(/(?=<h[23][\s>])/)
    .map((chunk) => {
      const question = /^(<h3[\s>][\s\S]*?<\/h3>)([\s\S]*)$/.exec(chunk);
      return question
        ? `<details><summary>${question[1]}</summary><div class="answer">${question[2]}</div></details>`
        : chunk;
    })
    .join('');
