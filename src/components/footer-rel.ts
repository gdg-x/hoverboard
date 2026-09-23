import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { footerRelBlock, notifications, subscribeNote } from '../utils/data';
import { ThemedElement } from './themed-element';
import './subscribe-form-footer';

@customElement('footer-rel')
export class FooterRel extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          border-top: 1px solid var(--border-light-color);
          border-bottom: 1px solid var(--border-light-color);
          margin: 0 20px;
          overflow: auto;
          overflow-y: hidden;
          padding: 10px 0;
          color: var(--footer-text-color);
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .col-heading {
          font-size: 14px;
          font-weight: 500;
          line-height: 21px;
          margin-top: 25px;
          margin-bottom: 10px;
        }

        .col {
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          flex: 1 1 auto;
        }

        .nav {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        a {
          color: var(--footer-text-color);
          padding-bottom: 2px;
          text-decoration: none;
          pointer-events: all;
        }

        li {
          display: list-item;
          line-height: 25px;
          pointer-events: none;
        }

        li:hover {
          text-decoration: underline;
        }

        @media (min-width: 768px) {
          :host {
            margin: 15px 0;
            padding: 30px 0;
          }

          .col-heading {
            font-size: 18px;
            margin-top: 0;
          }
        }
      `,
    ];
  }

  override render() {
    return html`
      ${footerRelBlock.map(
        (footerRel) => html`
          <div class="col">
            <div class="col-heading">${footerRel.title}</div>
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

      <div class="col">
        <div class="col-heading">${notifications.subscribe}</div>
        <span>${subscribeNote}</span>
        <subscribe-form-footer></subscribe-form-footer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-rel': FooterRel;
  }
}
