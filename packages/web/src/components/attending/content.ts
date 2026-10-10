import { css, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderMarkdown } from '../../utils/markdown';
import '../shared/hoverboard-icon';

/** The organizers' short markdown, sanitized by `renderMarkdown()`. */
export const markdown = (text: string | undefined) =>
  text ? html`<div class="text">${unsafeHTML(renderMarkdown(text))}</div>` : nothing;

export interface Item {
  icon: string;
  title: string;
  text: string;
}

/** Items with an icon, a heading and markdown, such as the ways to get to the venue. */
export const itemList = (items: Item[]) => html`
  <ul class="items">
    ${items.map(
      ({ icon, title, text }) => html`
        <li class="item">
          <hoverboard-icon name="${icon}"></hoverboard-icon>
          <div>
            <h3>${title}</h3>
            ${markdown(text)}
          </div>
        </li>
      `,
    )}
  </ul>
`;

export const contentStyles = css`
  :host {
    display: block;
  }

  .text {
    max-inline-size: var(--hb-prose-max);
    margin-block-start: var(--hb-space-4);
  }

  .text > :first-child {
    margin-block-start: 0;
  }

  .text > :last-child {
    margin-block-end: 0;
  }

  .text a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--hb-space-6);
    margin: var(--hb-space-6) 0 0;
    padding: 0;
    list-style: none;
  }

  .item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: var(--hb-space-3);
  }

  .item h3 {
    margin: 0;
    font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
  }

  .item .text {
    margin-block-start: var(--hb-space-2);
  }
`;
