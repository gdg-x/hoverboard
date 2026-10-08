import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../../utils/markdown';
import { ThemedElement } from '../themed-element';

export class Markdown extends ThemedElement {
  @property()
  accessor content: string = '';

  get document(): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = renderMarkdown(this.content);
    return template.content;
  }

  override render() {
    return html`<div class="markdown-html">${unsafeHTML(renderMarkdown(this.content))}</div>`;
  }
}
