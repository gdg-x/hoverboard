import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { footerRelBlock } from '../../config/site';
import { ThemedElement } from '../themed-element';

/** The link columns from `footerRelBlock`, such as past editions. */
@customElement('footer-rel')
export class FooterRel extends ThemedElement {
  static override styles = css`
    :host {
      display: grid;
      gap: var(--hb-space-5);
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    }

    .col-heading {
      margin: 0 0 var(--hb-space-2);
      font: 700 var(--hb-text-md) / 1.3 var(--hb-font-display);
    }

    .nav {
      display: grid;
      gap: var(--hb-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    a {
      display: inline-block;
      padding-block: var(--hb-space-1);
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  `;

  override render() {
    return html`
      ${footerRelBlock.map(
        (footerRel) => html`
          <div class="col">
            <h2 class="col-heading">${footerRel.title}</h2>
            <ul class="nav">
              ${footerRel.links.map(
                (link) => html`
                  <li>
                    <a
                      href="${link.url}"
                      target="${link.newTab ? '_blank' : ''}"
                      rel="${link.newTab ? 'noopener noreferrer' : ''}"
                      >${link.name}</a
                    >
                  </li>
                `,
              )}
            </ul>
          </div>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-rel': FooterRel;
  }
}
