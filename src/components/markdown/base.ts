import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { marked } from 'marked';
import { hasUnsupportedTags, unsupportedHtmlTags } from '../../utils/markdown';
import { ThemedElement } from '../themed-element';

marked.setOptions({
  headerIds: true,
});

export class Markdown extends ThemedElement {
  static override get styles() {
    return [...super.styles];
  }

  @property()
  content: string = '';

  get document(): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = marked.parse(this.content);
    if (hasUnsupportedTags(template.content)) {
      console.warn(`Invalid Markedown contains some of the following tags ${unsupportedHtmlTags}`);
      // TODO: Enable
      // Markdown wraps content in <p> which can not contain <div>s.
      // template.innerHTML = 'Invalid Markedown contains `div` tags.';
    }
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

  private hasDiv(document: DocumentFragment) {
    return document.querySelector('div') !== null;
  }
}
