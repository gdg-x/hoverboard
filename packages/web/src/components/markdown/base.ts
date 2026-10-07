import DOMPurify from 'dompurify';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { hasUnsupportedTags, unsupportedHtmlTags } from '../../utils/markdown';
import { ThemedElement } from '../themed-element';

marked.use(gfmHeadingId());

export class Markdown extends ThemedElement {
  @property()
  accessor content: string = '';

  get document(): DocumentFragment {
    const template = document.createElement('template');
    // Override type as no async extensions are in use
    const rendered = marked.parse(this.content) as string;
    template.innerHTML = rendered;
    if (hasUnsupportedTags(template.content)) {
      console.warn(`Invalid Markdown contains some of the following tags: ${unsupportedHtmlTags}`);
    }
    template.innerHTML = DOMPurify.sanitize(rendered);
    return this.addTargets(template.content);
  }

  override render() {
    return html`<div class="markdown-html">${this.document}</div>`;
  }

  protected addTargets(markdown: DocumentFragment): DocumentFragment {
    markdown.querySelectorAll('a').forEach((element) => {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    });
    return markdown;
  }
}
