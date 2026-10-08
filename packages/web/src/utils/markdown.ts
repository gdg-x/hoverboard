import createDOMPurify, { type DOMPurify, type WindowLike } from 'dompurify';
import { isServer } from 'lit';
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';

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
